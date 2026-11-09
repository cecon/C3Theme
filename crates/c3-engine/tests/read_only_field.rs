//! Campo `readOnly` na alteração: mandar outro valor é 422 `read_only` (antes era descartado em silêncio e o
//! PATCH respondia 200 sem gravar); o mesmo valor, como no registro lido, passa e não se grava.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use c3_engine::Engine;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["item"], "layout": { "menu": [] } }"#;
const ITEM: &str = r#"{
  "specVersion": "0", "name": "item", "label": { "singular": "Item", "plural": "Itens" },
  "fields": [ { "name": "code", "type": "string", "required": true, "maxLength": 10 },
              { "name": "active", "type": "boolean", "label": "Ativo", "readOnly": true } ]
}"#;

async fn engine() -> Engine {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE item (id INTEGER PRIMARY KEY, code TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)")
        .execute(&pool)
        .await
        .unwrap();
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(ITEM)
        .build()
        .await
        .unwrap()
}

async fn send(engine: &Engine, method: &str, uri: &str, body: Value) -> (StatusCode, Value) {
    let req = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .body(if body.is_null() {
            Body::empty()
        } else {
            Body::from(body.to_string())
        })
        .unwrap();
    let res = engine.router().oneshot(req).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

#[tokio::test]
async fn changing_a_read_only_field_is_422_and_nothing_is_written() {
    let e = engine().await;
    // na criação o readOnly continua ignorado (o backend preenche)
    let (status, body) = send(&e, "POST", "/item", json!({ "code": "A1", "active": false })).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    assert_eq!(body["data"]["active"], true);

    let (status, body) = send(&e, "PATCH", "/item/1", json!({ "code": "B1", "active": false })).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY, "{body}");
    assert_eq!(body["error"]["fields"]["active"][0]["code"], "read_only");
    let (_, body) = send(&e, "GET", "/item/1", Value::Null).await;
    assert_eq!((&body["data"]["code"], &body["data"]["active"]), (&json!("A1"), &json!(true)));

    // o registro lido reenviado inteiro passa: o mesmo valor não é mudança
    let (status, body) = send(&e, "PATCH", "/item/1", json!({ "code": "B1", "active": true })).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["data"]["code"], "B1");
}
