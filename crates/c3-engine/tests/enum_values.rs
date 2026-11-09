//! Enum com o valor que o banco já grava (`"SEM BALANCA"`, `"SP"`, `5102`): o motor grava, lê e filtra
//! o valor exato, sem tradução, e recusa o que não está em `options` ou vem no tipo errado.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use c3_engine::Engine;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["printer"], "layout": { "menu": [] } }"#;
const PRINTER: &str = r#"{
  "specVersion": "0", "name": "printer", "label": { "singular": "Impressora", "plural": "Impressoras" },
  "fields": [ { "name": "code", "type": "string", "required": true },
              { "name": "kind", "type": "enum", "required": true, "default": "SEM BALANCA",
                "options": [ { "value": "PISTA", "label": "Pista" }, { "value": "SEM BALANCA", "label": "Sem balança" } ] },
              { "name": "cfop", "type": "enum",
                "options": [ { "value": 0, "label": "Nenhum" }, { "value": 5102, "label": "Venda" }, { "value": 5405, "label": "Venda ST" } ] } ]
}"#;

async fn engine() -> Engine {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE printer (id INTEGER PRIMARY KEY, code TEXT NOT NULL, kind TEXT NOT NULL, cfop INTEGER)")
        .execute(&pool)
        .await
        .unwrap();
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(PRINTER)
        .build()
        .await
        .unwrap()
}

async fn send(engine: &Engine, method: &str, uri: &str, body: Value) -> (StatusCode, Value) {
    let req = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .body(Body::from(if body.is_null() { String::new() } else { body.to_string() }))
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
async fn stores_and_reads_the_exact_value() {
    let e = engine().await;
    let (status, body) = send(&e, "POST", "/printer", json!({ "code": "A", "cfop": 5102 })).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    assert_eq!(body["data"]["kind"], "SEM BALANCA", "default com espaço e maiúsculas");
    assert_eq!(body["data"]["cfop"], 5102, "enum numérico trafega como número");

    let (status, body) = send(&e, "POST", "/printer", json!({ "code": "B", "kind": "PISTA", "cfop": 0 })).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    assert_eq!(body["data"]["cfop"], 0, "zero é opção, não vazio");
}

#[tokio::test]
async fn filters_by_the_exact_value() {
    let e = engine().await;
    for (code, kind, cfop) in [("A", "PISTA", 5102), ("B", "SEM BALANCA", 5405), ("C", "SEM BALANCA", 0)] {
        send(&e, "POST", "/printer", json!({ "code": code, "kind": kind, "cfop": cfop })).await;
    }
    let codes = |body: Value| {
        body["data"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| r["code"].as_str().unwrap().to_owned())
            .collect::<Vec<_>>()
    };
    let query = |w: Value| format!("/printer?sort=code&where={}", urlencode(&w.to_string()));

    let (_, body) = send(
        &e,
        "GET",
        &query(json!({ "field": "kind", "op": "eq", "value": "SEM BALANCA" })),
        Value::Null,
    )
    .await;
    assert_eq!(codes(body), ["B", "C"]);
    let (_, body) = send(
        &e,
        "GET",
        &query(json!({ "field": "cfop", "op": "in", "value": [0, 5102] })),
        Value::Null,
    )
    .await;
    assert_eq!(codes(body), ["A", "C"]);
    let (_, body) = send(
        &e,
        "GET",
        &query(json!({ "field": "cfop", "op": "null", "value": true })),
        Value::Null,
    )
    .await;
    assert_eq!(codes(body), Vec::<String>::new(), "0 não é vazio");
    let (status, _) = send(
        &e,
        "GET",
        &query(json!({ "field": "cfop", "op": "eq", "value": "5102" })),
        Value::Null,
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "enum numérico não aceita string");
}

#[tokio::test]
async fn rejects_other_case_and_wrong_type() {
    let e = engine().await;
    let (status, body) = send(&e, "POST", "/printer", json!({ "code": "A", "kind": "pista" })).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(field_code(&body, "kind"), "invalid_option", "comparação é exata");
    let (_, body) = send(&e, "POST", "/printer", json!({ "code": "A", "cfop": "5102" })).await;
    assert_eq!(field_code(&body, "cfop"), "invalid_type");
    let (_, body) = send(&e, "POST", "/printer", json!({ "code": "A", "cfop": 6102 })).await;
    assert_eq!(field_code(&body, "cfop"), "invalid_option");
}

fn urlencode(s: &str) -> String {
    s.bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' => (b as char).to_string(),
            _ => format!("%{b:02X}"),
        })
        .collect()
}
