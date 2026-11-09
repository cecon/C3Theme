//! Campo só de escrita (`writeOnly`, senha): o sistema recebe o valor em texto puro só quando chega um novo,
//! a leitura nunca traz o gravado, e o motor recusa subir se ninguém faz o hash.

use std::sync::{Arc, Mutex};

use axum::body::Body;
use axum::http::{Request, StatusCode};
use c3_engine::{ApiError, Engine, Hooks, WriteCall, WriteOp};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["operator"], "layout": { "menu": [] } }"#;
const OPERATOR: &str = r#"{
  "specVersion": "0", "name": "operator", "label": { "singular": "Operador", "plural": "Operadores" },
  "fields": [ { "name": "login", "type": "string", "required": true },
              { "name": "password", "type": "string", "writeOnly": true, "required": true, "minLength": 6 } ]
}"#;

/// Valores que o escritor recebeu, em ordem.
type Calls = Arc<Mutex<Vec<Value>>>;

struct System {
    pool: SqlitePool,
    calls: Calls,
    delegates: bool,
}

#[c3_engine::async_trait]
impl Hooks for System {
    fn delegates_writes(&self, _entity: &str) -> bool {
        self.delegates
    }

    async fn write(&self, call: WriteCall<'_>) -> Result<i64, ApiError> {
        self.calls.lock().unwrap().push(json!(call.values));
        // o "hash" de teste só marca que passou pelo sistema
        let hash = call.values.get("password").and_then(Value::as_str).map(|p| format!("hash:{p}"));
        let login = call.values["login"].as_str();
        Ok(match call.op {
            WriteOp::Create => sqlx::query("INSERT INTO operator (login, password) VALUES (?, ?)")
                .bind(login)
                .bind(hash)
                .execute(&self.pool)
                .await?
                .last_insert_rowid(),
            WriteOp::Update => {
                let id = call.id.unwrap();
                sqlx::query("UPDATE operator SET login = ?, password = coalesce(?, password) WHERE id = ?")
                    .bind(login)
                    .bind(hash)
                    .bind(id)
                    .execute(&self.pool)
                    .await?;
                id
            }
            WriteOp::Delete => unreachable!(),
        })
    }
}

async fn engine(delegates: bool) -> Result<(Engine, SqlitePool, Calls), String> {
    let path = std::env::temp_dir().join(format!("c3-write-only-{delegates}-{}.db", std::process::id()));
    let _ = std::fs::remove_file(&path);
    let url = format!("sqlite://{}", path.display());
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options(&url).unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE operator (id INTEGER PRIMARY KEY, login TEXT NOT NULL, password TEXT)")
        .execute(&pool)
        .await
        .unwrap();
    let calls = Calls::default();
    let hooks = System {
        pool: pool.clone(),
        calls: calls.clone(),
        delegates,
    };
    let engine = Engine::builder(c3_engine::sqlx::SqlxStore::new(pool.clone()))
        .app(APP)
        .entity(OPERATOR)
        .hooks(hooks)
        .build()
        .await
        .map_err(|e| e.0)?;
    Ok((engine, pool, calls))
}

async fn send(engine: &Engine, method: &str, uri: &str, body: Value) -> (StatusCode, Value) {
    let req = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json");
    let body = if body.is_null() {
        Body::empty()
    } else {
        Body::from(body.to_string())
    };
    let res = engine.router().oneshot(req.body(body).unwrap()).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

async fn stored(pool: &SqlitePool) -> Option<String> {
    sqlx::query_scalar("SELECT password FROM operator").fetch_one(pool).await.unwrap()
}

#[tokio::test]
async fn senha_vai_ao_sistema_so_quando_muda_e_nunca_volta_na_leitura() {
    let (engine, pool, calls) = engine(true).await.unwrap();

    let (status, body) = send(&engine, "POST", "/operator", json!({ "login": "ana" })).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY, "obrigatória na criação: {body}");

    let (status, body) = send(&engine, "POST", "/operator", json!({ "login": "ana", "password": "segredo1" })).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    assert_eq!(body["data"]["password"], Value::Null, "a leitura nunca traz a senha");
    assert_eq!(
        calls.lock().unwrap()[0]["password"],
        "segredo1",
        "o sistema recebe o texto puro para fazer o hash"
    );
    assert_eq!(stored(&pool).await.as_deref(), Some("hash:segredo1"));

    let (status, body) = send(&engine, "PATCH", "/operator/1", json!({ "login": "ana.s" })).await;
    assert_eq!(status, StatusCode::OK, "sem a senha, a alteração não exige: {body}");
    assert!(
        calls.lock().unwrap()[1].get("password").is_none(),
        "sem valor novo, a chave não vem"
    );
    assert_eq!(stored(&pool).await.as_deref(), Some("hash:segredo1"), "a gravada fica");

    let (status, body) = send(&engine, "PATCH", "/operator/1", json!({ "password": "123" })).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(body["error"]["fields"]["password"][0]["code"], "too_short");

    let (_, list) = send(&engine, "GET", "/operator", Value::Null).await;
    assert_eq!(list["data"][0]["password"], Value::Null);
    let where_ = r#"{"field":"password","op":"contains","value":"hash"}"#;
    let (status, _) = send(&engine, "GET", &format!("/operator?where={}", urlencode(where_)), Value::Null).await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "filtrar pela senha revelaria o hash");
    let (status, _) = send(&engine, "GET", "/operator?sort=password", Value::Null).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn sem_escrita_delegada_o_motor_nao_sobe() {
    let err = engine(false).await.err().expect("deveria recusar");
    assert!(err.contains("writeOnly exige escrita delegada"), "{err}");
}

fn urlencode(s: &str) -> String {
    s.bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' => (b as char).to_string(),
            _ => format!("%{b:02X}"),
        })
        .collect()
}
