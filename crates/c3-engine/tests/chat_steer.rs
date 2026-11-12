//! Orientar o turno em andamento (ADR 0008): `steer` chega à porta, a orientação esperando sai pelo DELETE (a porta
//! decide 204, 409 ou 404), o aviso passageiro (`notice`) chega ao SSE e, sem `remove` na porta, o DELETE é 404.

use std::sync::Mutex;
use std::time::Duration;

use axum::body::Body;
use axum::http::request::Parts;
use axum::http::{Request, StatusCode};
use c3_engine::{ApiError, Chat, ChatPage, ChatRoom, Engine, Outgoing};
use http_body_util::BodyExt;
use serde_json::{json, Map, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["note"], "layout": { "menu": [] } }"#;
const NOTE: &str = r#"{ "specVersion": "0", "name": "note", "label": { "singular": "Nota", "plural": "Notas" },
  "titleField": "text", "fields": [ { "name": "text", "type": "string" } ] }"#;

/// Porta mínima: guarda os envios; "parado" responde com o aviso; remove só `s1` (o resto já foi lido).
#[derive(Default)]
struct Port {
    sent: Mutex<Vec<Outgoing>>,
    removed: Mutex<Vec<String>>,
    with_remove: bool,
}

#[c3_engine::async_trait]
impl Chat for Port {
    fn audience(&self, _req: &Parts) -> String {
        "ana".into()
    }
    async fn history(&self, _room: &ChatRoom, _before: Option<&str>, _limit: usize) -> Result<ChatPage, ApiError> {
        Ok(ChatPage::default())
    }
    async fn send(&self, room: ChatRoom, m: Outgoing) -> Result<Value, ApiError> {
        if m.text == "parado" {
            room.notice("O agente já tinha terminado.").map_err(ApiError::bad_request)?;
        }
        let steer = if m.steer { json!("pending") } else { Value::Null };
        self.sent.lock().unwrap().push(m.clone());
        Ok(json!({ "id": "s1", "clientId": m.client_id, "direction": "out", "text": m.text, "steer": steer }))
    }
    async fn remove(&self, room: ChatRoom, id: &str) -> Result<(), ApiError> {
        if !self.with_remove {
            return Err(ApiError::not_found("sem"));
        }
        if id != "s1" {
            return Err(ApiError::conflict("O agente já leu esta mensagem.", None));
        }
        room.emit(json!({ "type": "removed", "id": id })).map_err(ApiError::bad_request)?;
        self.removed.lock().unwrap().push(id.into());
        Ok(())
    }
    async fn answer(&self, _room: ChatRoom, _id: &str, _a: Map<String, Value>) -> Result<(), ApiError> {
        Ok(())
    }
    async fn answer_ui(&self, _room: ChatRoom, _id: &str, _p: &str, _a: Map<String, Value>) -> Result<(), ApiError> {
        Ok(())
    }
}

/// Porta que não implementa `remove`: vale o padrão do motor.
struct Bare;

#[c3_engine::async_trait]
impl Chat for Bare {
    fn audience(&self, _req: &Parts) -> String {
        "ana".into()
    }
    async fn history(&self, _room: &ChatRoom, _before: Option<&str>, _limit: usize) -> Result<ChatPage, ApiError> {
        Ok(ChatPage::default())
    }
    async fn send(&self, _room: ChatRoom, _m: Outgoing) -> Result<Value, ApiError> {
        Ok(json!({}))
    }
    async fn answer(&self, _room: ChatRoom, _id: &str, _a: Map<String, Value>) -> Result<(), ApiError> {
        Ok(())
    }
    async fn answer_ui(&self, _room: ChatRoom, _id: &str, _p: &str, _a: Map<String, Value>) -> Result<(), ApiError> {
        Ok(())
    }
}

async fn build(port: impl Chat) -> Engine {
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)")
        .execute(&pool)
        .await
        .unwrap();
    let b = Engine::builder(c3_engine::sqlx::SqlxStore::new(pool)).app(APP).entity(NOTE);
    b.chat(port).build().await.unwrap()
}

fn req(method: &str, uri: &str, body: Value) -> Request<Body> {
    let body = if body.is_null() { String::new() } else { body.to_string() };
    Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .body(Body::from(body))
        .unwrap()
}

async fn call(engine: &Engine, method: &str, uri: &str, body: Value) -> (StatusCode, Value) {
    let res = engine.router().oneshot(req(method, uri, body)).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

/// Os eventos do SSE (nome e dados) que chegarem até o prazo.
async fn events(body: &mut Body, buf: &mut String) -> Vec<(String, Value)> {
    let mut out = vec![];
    while let Ok(Some(Ok(frame))) = tokio::time::timeout(Duration::from_millis(300), body.frame()).await {
        buf.push_str(&String::from_utf8_lossy(&frame.into_data().unwrap_or_default()));
        while let Some(end) = buf.find("\n\n") {
            let block: String = buf.drain(..end + 2).collect();
            let name = block.lines().find_map(|l| l.strip_prefix("event: "));
            let data = block.lines().find_map(|l| l.strip_prefix("data: ")).unwrap_or("null");
            if let Some(name) = name {
                out.push((name.to_owned(), serde_json::from_str(data).unwrap()));
            }
        }
    }
    out
}

const URI: &str = "/_chat/assistant/messages";

#[tokio::test]
async fn steer_chega_a_porta_e_fora_do_formato_e_400() {
    let engine = build(Port::default()).await;
    let (status, body) = call(&engine, "POST", URI, json!({ "clientId": "c1", "text": "vá", "steer": true })).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["data"]["steer"], "pending");
    let (status, body) = call(&engine, "POST", URI, json!({ "clientId": "c2", "text": "oi" })).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["data"]["steer"], Value::Null);
    let (status, body) = call(&engine, "POST", URI, json!({ "clientId": "c3", "text": "oi", "steer": "sim" })).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["error"]["message"], "steer precisa ser verdadeiro ou falso.");
}

#[tokio::test]
async fn remover_orientacao_pela_porta_e_aviso_no_sse() {
    let engine = build(Port {
        with_remove: true,
        ..Port::default()
    })
    .await;
    let res = engine
        .router()
        .oneshot(req("GET", "/_chat/assistant/_events", Value::Null))
        .await
        .unwrap();
    let (mut body, mut buf) = (res.into_body(), String::new());
    assert_eq!(events(&mut body, &mut buf).await, [("ready".to_owned(), json!({}))]);

    assert_eq!(
        call(&engine, "DELETE", &format!("{URI}/s1"), Value::Null).await.0,
        StatusCode::NO_CONTENT
    );
    let (status, err) = call(&engine, "DELETE", &format!("{URI}/u9"), Value::Null).await;
    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(err["error"]["message"], "O agente já leu esta mensagem.");
    call(&engine, "POST", URI, json!({ "clientId": "c1", "text": "parado", "steer": true })).await;
    assert_eq!(
        events(&mut body, &mut buf).await,
        [
            (
                "removed".to_owned(),
                json!({ "type": "removed", "id": "s1", "conversationId": "assistant" })
            ),
            (
                "notice".to_owned(),
                json!({ "type": "notice", "text": "O agente já tinha terminado.", "tone": "info", "conversationId": "assistant" })
            )
        ]
    );
    assert_eq!(
        call(&engine, "DELETE", "/_chat/com%20espa%C3%A7o/messages/s1", Value::Null).await.0,
        StatusCode::BAD_REQUEST
    );
}

#[tokio::test]
async fn porta_sem_remove_responde_404() {
    let engine = build(Bare).await;
    let (status, body) = call(&engine, "DELETE", &format!("{URI}/s1"), Value::Null).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body["error"]["message"], "Este sistema não orienta o agente no meio do trabalho.");
}
