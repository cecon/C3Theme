//! Permissão sem escopo de filial, falta de `run_action` e recusa no boot: o que a suíte de
//! conformidade (que testa a permissão por filial) não cobre.

use axum::body::Body;
use axum::http::request::Parts;
use axum::http::{Request, StatusCode};
use c3_engine::{Engine, Hooks};
use http_body_util::BodyExt;
use serde_json::Value;
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["sale"], "layout": { "menu": [] } }"#;
const SALE: &str = r#"{
  "specVersion": "0", "name": "sale", "label": { "singular": "Venda", "plural": "Vendas" },
  "fields": [ { "name": "code", "type": "string", "required": true },
              { "name": "status", "type": "enum", "required": true, "options": [ { "value": "done", "label": "Concluída" }, { "value": "canceled", "label": "Cancelada" } ] } ],
  "actions": [ { "name": "cancel", "label": "Cancelar", "visibleWhen": { "field": "status", "op": "eq", "value": "done" },
                 "input": { "fields": [ { "name": "reason", "type": "text", "required": true, "minLength": 15 } ] } },
               { "name": "reprint", "label": "Reimprimir" } ]
}"#;

/// Só deixa cancelar quem manda `x-role: manager`; não implementa `run_action`.
struct Rules;

#[c3_engine::async_trait]
impl Hooks for Rules {
    fn action_allowed(&self, _entity: &str, action: &str, _branch: Option<&str>, req: &Parts) -> bool {
        action != "cancel" || req.headers.get("x-role").is_some_and(|v| v == "manager")
    }
}

async fn engine() -> Engine {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE sale (id INTEGER PRIMARY KEY, code TEXT NOT NULL, status TEXT NOT NULL)")
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("INSERT INTO sale (code, status) VALUES ('V1', 'done')")
        .execute(&pool)
        .await
        .unwrap();
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool.clone()))
        .app(APP)
        .entity(SALE)
        .hooks(Rules)
        .build()
        .await
        .unwrap()
}

async fn send(engine: &Engine, method: &str, uri: &str, role: Option<&str>, body: &str) -> (StatusCode, Value) {
    let mut req = Request::builder().method(method).uri(uri);
    if let Some(r) = role {
        req = req.header("x-role", r);
    }
    let res = engine
        .router()
        .oneshot(req.body(Body::from(body.to_owned())).unwrap())
        .await
        .unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

#[tokio::test]
async fn capabilities_list_each_action() {
    let e = engine().await;
    let (_, body) = send(&e, "GET", "/_meta/entities/sale", None, "").await;
    assert_eq!(
        body["capabilities"]["actions"],
        serde_json::json!({ "cancel": false, "reprint": true })
    );
    let (_, body) = send(&e, "GET", "/_meta/entities/sale", Some("manager"), "").await;
    assert_eq!(body["capabilities"]["actions"]["cancel"], true);
}

#[tokio::test]
async fn forbidden_comes_before_availability_and_input() {
    let e = engine().await;
    // a permissão da ação é decidida na filial dona do registro, então o registro vem antes (404);
    // depois dele, sem permissão é 403 mesmo com corpo inválido
    let (status, _) = send(&e, "POST", "/sale/999/_actions/cancel", None, "{").await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    let (status, body) = send(&e, "POST", "/sale/1/_actions/cancel", None, "{").await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(body["error"]["code"], "forbidden");
}

#[tokio::test]
async fn validated_action_without_run_action_is_internal_error() {
    let e = engine().await;
    let (status, body) = send(&e, "POST", "/sale/1/_actions/cancel", Some("manager"), r#"{"reason":"curto"}"#).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(body["error"]["fields"]["reason"][0]["code"], "too_short");
    let (status, body) = send(
        &e,
        "POST",
        "/sale/1/_actions/cancel",
        Some("manager"),
        r#"{"reason":"cliente desistiu da compra"}"#,
    )
    .await;
    assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
    assert_eq!(body["error"]["code"], "internal");
}

#[tokio::test]
async fn bad_action_definitions_fail_at_boot() {
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE sale (id INTEGER PRIMARY KEY, code TEXT NOT NULL, status TEXT NOT NULL)")
        .execute(&pool)
        .await
        .unwrap();
    let bad = SALE.replace(r#""field": "status", "op": "eq""#, r#""field": "reason", "op": "eq""#);
    let err = Engine::builder(c3_engine::sqlx::SqlxStore::new(pool.clone()))
        .app(APP)
        .entity(&bad)
        .build()
        .await
        .err()
        .unwrap();
    assert!(err.0.contains("actions.cancel.visibleWhen"), "{}", err.0);
}
