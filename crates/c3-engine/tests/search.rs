//! Busca do Ctrl K (spec/v0/search.yaml): sem a porta, 404; com ela, `q` aparado, `limit` conferido e a resposta
//! cortada no limite, com os nulos no lugar.

use axum::body::Body;
use axum::http::request::Parts;
use axum::http::{Request, StatusCode};
use c3_engine::{ApiError, Engine, Search, SearchHit};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["note"], "layout": { "menu": [] } }"#;
const NOTE: &str = r#"{ "specVersion": "0", "name": "note", "label": { "singular": "Nota", "plural": "Notas" },
  "fields": [ { "name": "text", "type": "string" } ] }"#;

/// Devolve 30 achados com o texto e o usuário no título, para o teste ver o que chegou.
struct Port;

#[c3_engine::async_trait]
impl Search for Port {
    async fn search(&self, req: &Parts, q: &str, limit: usize) -> Result<Vec<SearchHit>, ApiError> {
        let user = req.headers.get("x-user").and_then(|v| v.to_str().ok()).unwrap_or("");
        Ok((0..30)
            .map(|i| SearchHit {
                kind: "note".into(),
                group: "Notas".into(),
                title: format!("{q} {i} {user} {limit}"),
                path: format!("/note/{i}"),
                ..Default::default()
            })
            .collect())
    }
}

async fn build(port: bool) -> Engine {
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)")
        .execute(&pool)
        .await
        .unwrap();
    let b = Engine::builder(c3_engine::sqlx::SqlxStore::new(pool)).app(APP).entity(NOTE);
    if port { b.search(Port) } else { b }.build().await.unwrap()
}

async fn get(engine: &Engine, uri: &str) -> (StatusCode, Value) {
    let req = Request::builder().uri(uri).header("x-user", "ana").body(Body::empty()).unwrap();
    let res = engine.router().oneshot(req).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

#[tokio::test]
async fn sem_a_porta_404() {
    let engine = build(false).await;
    assert_eq!(get(&engine, "/_search?q=pao").await.0, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn chama_a_porta_e_corta_no_limit() {
    let engine = build(true).await;
    let (status, body) = get(&engine, "/_search?q=%20p%C3%A3o%20&limit=5").await;
    assert_eq!(status, StatusCode::OK);
    let data = body["data"].as_array().unwrap();
    assert_eq!(data.len(), 5);
    assert_eq!(
        data[0],
        json!({ "kind": "note", "group": "Notas", "title": "pão 0 ana 5", "snippet": null, "path": "/note/0", "icon": null, "at": null })
    );
    let (_, plain) = get(&engine, "/_search?q=pao").await;
    assert_eq!(plain["data"].as_array().unwrap().len(), 20);
}

#[tokio::test]
async fn q_curto_ou_limit_fora_400() {
    let engine = build(true).await;
    for uri in [
        "/_search",
        "/_search?q=%20a%20",
        "/_search?q=pao&limit=0",
        "/_search?q=pao&limit=51",
    ] {
        assert_eq!(get(&engine, uri).await.0, StatusCode::BAD_REQUEST, "{uri}");
    }
}
