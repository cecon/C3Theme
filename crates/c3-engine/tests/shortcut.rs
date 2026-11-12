//! Atalho de teclado (`format: "shortcut"`, #110): grava na forma canônica, recusa a forma errada (`pattern`) e o
//! atalho repetido dentro do mesmo registro (`unique` no segundo campo), também no PATCH de um campo só.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use c3_engine::Engine;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["prefs"], "layout": { "menu": [] } }"#;
const PREFS: &str = r#"{
  "specVersion": "0", "name": "prefs", "label": { "singular": "Preferência", "plural": "Preferências" },
  "fields": [ { "name": "search", "type": "string", "format": "shortcut" },
              { "name": "palette", "type": "string", "format": "shortcut" } ]
}"#;

async fn engine() -> Engine {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE prefs (id INTEGER PRIMARY KEY, search TEXT, palette TEXT)")
        .execute(&pool)
        .await
        .unwrap();
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(PREFS)
        .build()
        .await
        .unwrap()
}

async fn send(engine: &Engine, method: &str, uri: &str, body: Value) -> (StatusCode, Value) {
    let req = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .body(Body::from(body.to_string()))
        .unwrap();
    let res = engine.router().oneshot(req).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

fn field_code(body: &Value, field: &str) -> String {
    body["error"]["fields"][field][0]["code"].as_str().unwrap_or_default().to_owned()
}

#[tokio::test]
async fn shortcut_shape_and_repeat_in_record() {
    let e = engine().await;
    let (status, body) = send(&e, "POST", "/prefs", json!({ "search": "Ctrl+Shift+K", "palette": "F5" })).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let id = body["data"]["id"].as_str().unwrap().to_owned();

    let (status, body) = send(&e, "POST", "/prefs", json!({ "search": "Shift+Ctrl+K" })).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(field_code(&body, "search"), "pattern");

    let (status, body) = send(&e, "POST", "/prefs", json!({ "search": "Ctrl+K", "palette": "Ctrl+K" })).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(field_code(&body, "palette"), "unique");
    assert_eq!(field_code(&body, "search"), "");

    // PATCH só de um campo confere contra o gravado no outro
    let (status, body) = send(&e, "PATCH", &format!("/prefs/{id}"), json!({ "palette": "Ctrl+Shift+K" })).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY, "{body}");
    assert_eq!(field_code(&body, "palette"), "unique");
}
