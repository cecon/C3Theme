//! O estado público chega antes do login sem expor o restante do app.json.
use axum::body::Body;
use axum::http::Request;
use c3_engine::Engine;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

#[tokio::test]
async fn public_status_projection() {
    for status in [
        Value::Null,
        json!({ "mode": "maintenance", "message": "Atualização", "until": "2026-12-01T12:00:00Z" }),
    ] {
        let pool = SqlitePoolOptions::new()
            .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
            .await
            .unwrap();
        let mut app = json!({ "specVersion": "0", "name": "Loja", "entities": ["nota"], "layout": { "menu": [] } });
        sqlx::query("CREATE TABLE nota (id INTEGER PRIMARY KEY, titulo TEXT)")
            .execute(&pool)
            .await
            .unwrap();
        if !status.is_null() {
            app["status"] = status.clone();
        }
        let engine = Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
            .app(&app.to_string())
            .entity(r#"{ "specVersion": "0", "name": "nota", "label": { "singular": "Nota", "plural": "Notas" }, "fields": [{ "name": "titulo", "type": "string" }] }"#)
            .build()
            .await
            .unwrap();
        let response = engine
            .router()
            .oneshot(Request::builder().uri("/_meta/login").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), 200);
        let body: Value = serde_json::from_slice(&response.into_body().collect().await.unwrap().to_bytes()).unwrap();
        let mut expected = json!({ "name": "Loja", "auth": null });
        if !status.is_null() {
            expected["status"] = status;
        }
        assert_eq!(body["data"], expected);
    }
}
