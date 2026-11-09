//! Sino (spec/v0/notifications.yaml): sem a porta, 404; com ela, lista do usuário, marcar lido e o SSE que avisa
//! só o dono do aviso.

use std::sync::Mutex;
use std::time::Duration;

use axum::body::Body;
use axum::http::request::Parts;
use axum::http::{Request, StatusCode};
use c3_engine::{ApiError, Bell, Engine, Notification, NotificationList, Notifications};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["note"], "layout": { "menu": [] } }"#;
const NOTE: &str = r#"{ "specVersion": "0", "name": "note", "label": { "singular": "Nota", "plural": "Notas" },
  "fields": [ { "name": "text", "type": "string" } ] }"#;

/// Avisos da `ana` (o usuário vem no cabeçalho `x-user`).
struct Port(Mutex<Vec<Notification>>);

#[c3_engine::async_trait]
impl Notifications for Port {
    fn audience(&self, req: &Parts) -> String {
        req.headers.get("x-user").and_then(|v| v.to_str().ok()).unwrap_or("").to_owned()
    }
    async fn list(&self, audience: &str, limit: usize) -> Result<NotificationList, ApiError> {
        let all = self.0.lock().unwrap();
        let mine: Vec<_> = if audience == "ana" { all.clone() } else { Vec::new() };
        let unread = mine.iter().filter(|n| n.read_at.is_none()).count() as u64;
        Ok(NotificationList {
            items: mine.into_iter().take(limit).collect(),
            unread,
        })
    }
    async fn mark_read(&self, audience: &str, ids: Option<&[String]>) -> Result<u64, ApiError> {
        let mut all = self.0.lock().unwrap();
        if audience == "ana" {
            for n in all.iter_mut().filter(|n| ids.is_none_or(|ids| ids.contains(&n.id))) {
                n.read_at.get_or_insert_with(|| "2026-11-09T13:00:00Z".to_owned());
            }
        }
        Ok(all.iter().filter(|n| audience == "ana" && n.read_at.is_none()).count() as u64)
    }
}

fn aviso(id: &str) -> Notification {
    Notification {
        id: id.into(),
        title: format!("Aviso {id}"),
        created_at: "2026-11-09T12:00:00Z".into(),
        to: Some("/note".into()),
        ..Default::default()
    }
}

async fn build(port: Option<Port>, bell: Bell) -> Engine {
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)")
        .execute(&pool)
        .await
        .unwrap();
    let mut b = Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(NOTE)
        .bell(bell);
    if let Some(port) = port {
        b = b.notifications(port);
    }
    b.build().await.unwrap()
}

fn req(method: &str, uri: &str, user: &str, body: Value) -> Request<Body> {
    let body = if body.is_null() { String::new() } else { body.to_string() };
    Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .header("x-user", user)
        .body(Body::from(body))
        .unwrap()
}

async fn send(engine: &Engine, method: &str, uri: &str, user: &str, body: Value) -> (StatusCode, Value) {
    let res = engine.router().oneshot(req(method, uri, user, body)).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

/// Próximo evento nomeado do SSE (pula o keep-alive), ou None se nada chegou no prazo.
async fn next_event(body: &mut Body, buf: &mut String) -> Option<String> {
    loop {
        if let Some(end) = buf.find("\n\n") {
            let block: String = buf.drain(..end + 2).collect();
            if let Some(name) = block.lines().find_map(|l| l.strip_prefix("event: ")) {
                return Some(name.to_owned());
            }
            continue;
        }
        let frame = tokio::time::timeout(Duration::from_millis(300), body.frame()).await.ok()??.ok()?;
        buf.push_str(&String::from_utf8_lossy(&frame.into_data().ok()?));
    }
}

#[tokio::test]
async fn sem_porta_as_rotas_sao_404() {
    let engine = build(None, Bell::new()).await;
    for (m, uri) in [
        ("GET", "/_notifications"),
        ("POST", "/_notifications/_read"),
        ("GET", "/_notifications/_events"),
    ] {
        assert_eq!(
            send(&engine, m, uri, "ana", Value::Null).await.0,
            StatusCode::NOT_FOUND,
            "{m} {uri}"
        );
    }
}

#[tokio::test]
async fn lista_marca_lido_e_valida_o_pedido() {
    let engine = build(Some(Port(Mutex::new(vec![aviso("1"), aviso("2")]))), Bell::new()).await;
    let (status, body) = send(&engine, "GET", "/_notifications?limit=1", "ana", Value::Null).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["unread"], 2);
    assert_eq!(
        body["items"],
        json!([{ "id": "1", "title": "Aviso 1", "createdAt": "2026-11-09T12:00:00Z", "readAt": null, "to": "/note" }])
    );
    assert_eq!(
        send(&engine, "GET", "/_notifications?limit=0", "ana", Value::Null).await.0,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        send(&engine, "POST", "/_notifications/_read", "ana", json!({ "ids": ["1"] }))
            .await
            .1,
        json!({ "unread": 1 })
    );
    assert_eq!(
        send(&engine, "POST", "/_notifications/_read", "ana", json!({ "ids": "1" })).await.0,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        send(&engine, "POST", "/_notifications/_read", "ana", Value::Null).await.1,
        json!({ "unread": 0 })
    );
    assert_eq!(
        send(&engine, "GET", "/_notifications", "beto", Value::Null).await.1,
        json!({ "items": [], "unread": 0 })
    );
}

#[tokio::test]
async fn sse_avisa_so_o_dono() {
    let bell = Bell::new();
    let engine = build(Some(Port(Mutex::new(vec![aviso("1")]))), bell.clone()).await;
    let res = engine
        .router()
        .oneshot(req("GET", "/_notifications/_events", "ana", Value::Null))
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let (mut body, mut buf) = (res.into_body(), String::new());
    assert_eq!(next_event(&mut body, &mut buf).await.as_deref(), Some("ready"));
    bell.notify("beto");
    assert_eq!(next_event(&mut body, &mut buf).await, None, "aviso de outro usuário não chega");
    bell.notify("ana");
    assert_eq!(next_event(&mut body, &mut buf).await.as_deref(), Some("notification"));
    // marcar lido em outra aba também avisa
    send(&engine, "POST", "/_notifications/_read", "ana", Value::Null).await;
    assert_eq!(next_event(&mut body, &mut buf).await.as_deref(), Some("notification"));
}
