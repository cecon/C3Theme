//! Escrita delegada (`Hooks::delegates_writes`): o motor valida e o sistema grava com um pool próprio,
//! como um sistema com Diesel e escritor único faria. O contrato HTTP é o da suíte de conformidade
//! (o c3-example delega o pedido); aqui fica o que só se vê por dentro: o que o sistema recebe, que o
//! motor não segura o lock de escrita e que nada chega ao sistema quando a validação recusa. O motor roda
//! em `read_only()`, com o pool `query_only`: o modo do sistema que só grava pelo próprio escritor.

use std::sync::{Arc, Mutex};

use axum::body::Body;
use axum::http::request::Parts;
use axum::http::{Request, StatusCode};
use c3_engine::{ApiError, Capabilities, Engine, FieldErrors, Hooks, WriteCall, WriteOp};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["item"], "layout": { "menu": [] } }"#;
const ITEM: &str = r#"{
  "specVersion": "0", "name": "item", "label": { "singular": "Item", "plural": "Itens" },
  "fields": [ { "name": "code", "type": "string", "required": true, "maxLength": 10 },
              { "name": "kind", "type": "enum", "required": true, "default": "a",
                "options": [ { "value": "a", "label": "A" }, { "value": "b", "label": "B" } ] },
              { "name": "note", "type": "text", "visibleWhen": { "field": "kind", "op": "eq", "value": "b" } } ]
}"#;

/// O que o escritor recebeu: operação, id, antes e valores.
type Calls = Arc<Mutex<Vec<(WriteOp, Option<i64>, Option<Value>, Value)>>>;

struct System {
    writer: SqlitePool,
    calls: Calls,
}

#[c3_engine::async_trait]
impl Hooks for System {
    fn capabilities(&self, _entity: &str, _branch: Option<&str>, req: &Parts) -> Capabilities {
        if req.headers.contains_key("x-reader") {
            Capabilities::READ_ONLY
        } else {
            Capabilities::ALL
        }
    }

    fn delegates_writes(&self, _entity: &str) -> bool {
        true
    }

    async fn write(&self, call: WriteCall<'_>) -> Result<i64, ApiError> {
        self.calls
            .lock()
            .unwrap()
            .push((call.op, call.id, call.before.map(|b| json!(b)), json!(call.values)));
        // BEGIN IMMEDIATE noutro pool: se o motor segurasse uma transação de escrita, isto esperaria o lock
        let mut tx = self.writer.begin_with("BEGIN IMMEDIATE").await?;
        let v = |k: &str| call.values[k].as_str().map(str::to_owned);
        let id = match call.op {
            WriteOp::Create => {
                let done = sqlx::query("INSERT INTO item (code, kind, note) VALUES (?, ?, ?)")
                    .bind(v("code"))
                    .bind(v("kind"))
                    .bind(v("note"))
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| match e {
                        sqlx::Error::Database(db) if db.kind() == sqlx::error::ErrorKind::UniqueViolation => {
                            let mut f = FieldErrors::default();
                            f.add("code", "unique", "Já existe.");
                            ApiError::conflict("Já existe um item com este código.", Some(f))
                        }
                        e => e.into(),
                    })?;
                done.last_insert_rowid()
            }
            WriteOp::Update => {
                let id = call.id.unwrap();
                sqlx::query("UPDATE item SET code = ?, kind = ?, note = ? WHERE id = ?")
                    .bind(v("code"))
                    .bind(v("kind"))
                    .bind(v("note"))
                    .bind(id)
                    .execute(&mut *tx)
                    .await?;
                id
            }
            WriteOp::Delete => {
                let id = call.id.unwrap();
                sqlx::query("DELETE FROM item WHERE id = ?").bind(id).execute(&mut *tx).await?;
                id
            }
        };
        sqlx::query("INSERT INTO audit (op, item_id) VALUES (?, ?)")
            .bind(format!("{:?}", call.op))
            .bind(id)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(id)
    }
}

struct Fixture {
    engine: Engine,
    writer: SqlitePool,
    calls: Calls,
    path: std::path::PathBuf,
}

impl Drop for Fixture {
    fn drop(&mut self) {
        for ext in ["", "-wal", "-shm"] {
            let _ = std::fs::remove_file(format!("{}{ext}", self.path.display()));
        }
    }
}

async fn fixture(name: &str) -> Fixture {
    let path = std::env::temp_dir().join(format!("c3-writes-{name}-{}.db", std::process::id()));
    let url = format!("sqlite://{}", path.display());
    let _ = std::fs::remove_file(&path);
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options(&url).unwrap())
        .await
        .unwrap();
    for sql in [
        "CREATE TABLE item (id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, note TEXT)",
        "CREATE TABLE audit (id INTEGER PRIMARY KEY, op TEXT NOT NULL, item_id INTEGER NOT NULL)",
    ] {
        sqlx::query(sql).execute(&pool).await.unwrap();
    }
    let writer = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(c3_engine::sqlx::sqlite_options(&url).unwrap())
        .await
        .unwrap();
    let calls = Calls::default();
    let system = System {
        writer: writer.clone(),
        calls: calls.clone(),
    };
    // o motor só lê (query_only), como no Nati: se ele tentasse gravar, o SQLite recusaria
    let reader = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options_read_only(&url).unwrap())
        .await
        .unwrap();
    let engine = Engine::builder(c3_engine::sqlx::SqlxStore::new(reader))
        .app(APP)
        .entity(ITEM)
        .hooks(system)
        .read_only()
        .build()
        .await
        .unwrap();
    Fixture {
        engine,
        writer,
        calls,
        path,
    }
}

async fn send(engine: &Engine, method: &str, uri: &str, reader: bool, body: Value) -> (StatusCode, Value) {
    let mut req = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json");
    if reader {
        req = req.header("x-reader", "1");
    }
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

async fn audit(f: &Fixture) -> Vec<String> {
    sqlx::query_scalar("SELECT op || ':' || item_id FROM audit ORDER BY id")
        .fetch_all(&f.writer)
        .await
        .unwrap()
}

#[tokio::test]
async fn system_writes_create_update_delete_with_audit() {
    let f = fixture("crud").await;
    let (status, body) = send(&f.engine, "POST", "/item", false, json!({ "code": "A1", "note": "some" })).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    // o motor relê o registro gravado pelo sistema; note estava escondido (kind = a) e não vai
    let mut data = body["data"].clone();
    assert!(data.as_object_mut().unwrap().remove("_version").is_some_and(|v| v.is_string()));
    assert_eq!(data, json!({ "id": "1", "code": "A1", "kind": "a", "note": null }));

    let (status, body) = send(&f.engine, "PATCH", "/item/1", false, json!({ "kind": "b", "note": "  " })).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["data"]["kind"], "b");

    let (status, _) = send(&f.engine, "DELETE", "/item/1", false, Value::Null).await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    assert_eq!(audit(&f).await, ["Create:1", "Update:1", "Delete:1"]);

    let calls = f.calls.lock().unwrap();
    assert_eq!(
        calls[0],
        (WriteOp::Create, None, None, json!({ "code": "A1", "kind": "a", "note": null }))
    );
    // alterar recebe o registro inteiro (o patch sobre o atual) e o antes, para a auditoria
    assert_eq!(calls[1].0, WriteOp::Update);
    assert_eq!(calls[1].1, Some(1));
    assert_eq!(calls[1].2, Some(json!({ "id": "1", "code": "A1", "kind": "a", "note": null })));
    assert_eq!(calls[1].3, json!({ "code": "A1", "kind": "b", "note": "  " }));
    assert_eq!((calls[2].0, calls[2].1, &calls[2].3), (WriteOp::Delete, Some(1), &json!({})));
    assert_eq!(calls[2].2.as_ref().unwrap()["kind"], "b");
}

#[tokio::test]
async fn refusals_never_reach_the_system() {
    let f = fixture("refusals").await;
    send(&f.engine, "POST", "/item", false, json!({ "code": "A1" })).await;
    f.calls.lock().unwrap().clear();

    let (status, body) = send(&f.engine, "POST", "/item", false, json!({ "code": "longo demais aqui" })).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(body["error"]["fields"]["code"][0]["code"], "too_long");
    let (status, _) = send(&f.engine, "POST", "/item", false, json!({ "code": "B1", "x": 1 })).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let (status, _) = send(&f.engine, "POST", "/item", true, json!({ "code": "B1" })).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let (status, _) = send(&f.engine, "PATCH", "/item/1", true, json!({ "code": "B1" })).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let (status, _) = send(&f.engine, "DELETE", "/item/1", true, Value::Null).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let (status, _) = send(&f.engine, "PATCH", "/item/999", false, json!({ "code": "B1" })).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    let (status, _) = send(&f.engine, "DELETE", "/item/999", false, Value::Null).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert!(f.calls.lock().unwrap().is_empty());
}

#[tokio::test]
async fn error_from_the_system_writer_keeps_the_contract() {
    let f = fixture("conflict").await;
    send(&f.engine, "POST", "/item", false, json!({ "code": "A1" })).await;
    let (status, body) = send(&f.engine, "POST", "/item", false, json!({ "code": "A1" })).await;
    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(body["error"]["fields"]["code"][0]["code"], "unique");
    // a transação do sistema desfez tudo: nada de auditoria órfã
    assert_eq!(audit(&f).await, ["Create:1"]);
}

#[tokio::test]
async fn delegating_without_write_is_internal_error() {
    struct Half;
    #[c3_engine::async_trait]
    impl Hooks for Half {
        fn delegates_writes(&self, _entity: &str) -> bool {
            true
        }
    }
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE item (id INTEGER PRIMARY KEY, code TEXT NOT NULL, kind TEXT NOT NULL, note TEXT)")
        .execute(&pool)
        .await
        .unwrap();
    let engine = Engine::builder(c3_engine::sqlx::SqlxStore::new(pool.clone()))
        .app(APP)
        .entity(ITEM)
        .hooks(Half)
        .build()
        .await
        .unwrap();
    let (status, body) = send(&engine, "POST", "/item", false, json!({ "code": "A1" })).await;
    assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
    assert_eq!(body["error"]["code"], "internal");
}
