//! Chat com o agente (spec/v0/chat.yaml): sem a porta, 404; com ela, histórico e envio por usuário, o SSE só da
//! conversa do dono, a parte recusada pelo motor que não sai e a validação de cada corpo.

use std::collections::HashMap;
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

/// Conversas em memória, por (usuário, conversa). O agente responde na hora: "ruim" manda uma parte que a spec
/// recusa (entidade que não existe) e guarda o erro do motor.
#[derive(Default)]
struct Port {
    log: Mutex<HashMap<(String, String), Vec<Value>>>,
    refused: Mutex<Vec<String>>,
    calls: Mutex<Vec<String>>,
}

fn message(id: &str, direction: &str, text: &str) -> Value {
    json!({ "id": id, "author": { "id": direction, "name": direction }, "direction": direction, "text": text,
            "createdAt": "2026-11-12T12:00:00Z" })
}

#[c3_engine::async_trait]
impl Chat for Port {
    fn audience(&self, req: &Parts) -> String {
        req.headers.get("x-user").and_then(|v| v.to_str().ok()).unwrap_or("").to_owned()
    }
    async fn history(&self, room: &ChatRoom, before: Option<&str>, limit: usize) -> Result<ChatPage, ApiError> {
        let log = self.log.lock().unwrap();
        let all = log
            .get(&(room.audience().into(), room.conversation().into()))
            .cloned()
            .unwrap_or_default();
        let end = before.and_then(|b| all.iter().position(|m| m["id"] == b)).unwrap_or(all.len());
        let start = end.saturating_sub(limit);
        Ok(ChatPage {
            messages: all[start..end].to_vec(),
            has_more: start > 0,
        })
    }
    async fn send(&self, room: ChatRoom, m: Outgoing) -> Result<Value, ApiError> {
        let key = (room.audience().to_owned(), room.conversation().to_owned());
        let n = self.log.lock().unwrap().get(&key).map_or(0, Vec::len);
        let mut mine = message(&format!("u{n}"), "out", &m.text);
        mine["clientId"] = json!(m.client_id);
        let mut reply = message(&format!("a{n}"), "in", &format!("Você disse {}", m.text));
        if m.text == "ruim" {
            reply["ui"] = json!([{ "id": "p1", "kind": "c3.record", "payload": { "entity": "nada", "values": {} } }]);
        }
        let mut log = self.log.lock().unwrap();
        log.entry(key).or_default().extend([mine.clone(), reply.clone()]);
        drop(log);
        if let Err(e) = room.message(reply) {
            self.refused.lock().unwrap().push(e);
        }
        Ok(mine)
    }
    async fn stop(&self, room: ChatRoom) -> Result<(), ApiError> {
        room.delta("a0", "", true).map_err(ApiError::bad_request)?;
        self.calls.lock().unwrap().push(format!("stop {}", room.conversation()));
        Ok(())
    }
    async fn answer(&self, room: ChatRoom, id: &str, answer: Map<String, Value>) -> Result<(), ApiError> {
        // ids de teste: o formato de evento que o motor recusa vira 400
        let bad = match id {
            "respondida" => return Err(ApiError::conflict("Já respondida.", None)),
            "evento" => Some(json!({ "type": "x" })),
            "lista" => Some(json!([1])),
            "sem-mensagem" => Some(json!({ "type": "message", "message": 1 })),
            _ => None,
        };
        if let Some(event) = bad {
            return room.emit(event).map_err(ApiError::bad_request);
        }
        self.calls.lock().unwrap().push(format!("answer {id} {}", Value::Object(answer)));
        Ok(())
    }
    async fn answer_ui(&self, room: ChatRoom, id: &str, part: &str, answer: Map<String, Value>) -> Result<(), ApiError> {
        room.emit(json!({ "type": "ui.cancel", "partId": part, "reason": "agent" }))
            .map_err(ApiError::bad_request)?;
        self.calls.lock().unwrap().push(format!("ui {id} {part} {}", answer["action"]));
        Ok(())
    }
}

async fn build(port: Option<Port>) -> Engine {
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)")
        .execute(&pool)
        .await
        .unwrap();
    let mut b = Engine::builder(c3_engine::sqlx::SqlxStore::new(pool)).app(APP).entity(NOTE);
    if let Some(port) = port {
        b = b.chat(port);
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

/// Próximo evento do SSE (nome e dados), ou None se nada chegou no prazo.
async fn next_event(body: &mut Body, buf: &mut String) -> Option<(String, Value)> {
    loop {
        if let Some(end) = buf.find("\n\n") {
            let block: String = buf.drain(..end + 2).collect();
            let name = block.lines().find_map(|l| l.strip_prefix("event: "));
            let data = block.lines().find_map(|l| l.strip_prefix("data: ")).unwrap_or("null");
            if let Some(name) = name {
                return Some((name.to_owned(), serde_json::from_str(data).unwrap()));
            }
            continue;
        }
        let frame = tokio::time::timeout(Duration::from_millis(300), body.frame()).await.ok()??.ok()?;
        buf.push_str(&String::from_utf8_lossy(&frame.into_data().ok()?));
    }
}

const ROUTES: [(&str, &str); 6] = [
    ("GET", "/_chat/assistant/messages"),
    ("POST", "/_chat/assistant/messages"),
    ("GET", "/_chat/assistant/_events"),
    ("POST", "/_chat/assistant/_stop"),
    ("POST", "/_chat/assistant/messages/m1/_answer"),
    ("POST", "/_chat/assistant/messages/m1/_ui/p1"),
];

#[tokio::test]
async fn sem_porta_as_rotas_sao_404() {
    let engine = build(None).await;
    for (m, uri) in ROUTES {
        let (status, body) = send(&engine, m, uri, "ana", Value::Null).await;
        assert_eq!(status, StatusCode::NOT_FOUND, "{m} {uri}");
        assert_eq!(body["error"]["message"], "Este sistema não tem assistente.");
    }
}

#[tokio::test]
async fn conversa_invalida_e_400_em_todas_as_rotas() {
    let engine = build(Some(Port::default())).await;
    for (m, uri) in ROUTES {
        let uri = uri.replace("assistant", "com%20espa%C3%A7o");
        assert_eq!(
            send(&engine, m, &uri, "ana", Value::Null).await.0,
            StatusCode::BAD_REQUEST,
            "{m} {uri}"
        );
    }
}

#[tokio::test]
async fn envia_e_le_o_historico_do_usuario() {
    let engine = build(Some(Port::default())).await;
    let uri = "/_chat/assistant/messages";
    let (status, body) = send(&engine, "POST", uri, "ana", json!({ "clientId": "c1", "text": "oi" })).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["data"]["clientId"], "c1");
    assert_eq!(body["data"]["text"], "oi");
    send(&engine, "POST", uri, "ana", json!({ "clientId": "c2", "text": "tudo bem" })).await;

    let (status, page) = send(&engine, "GET", uri, "ana", Value::Null).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(page["hasMore"], false);
    let texts: Vec<_> = page["messages"].as_array().unwrap().iter().map(|m| m["text"].clone()).collect();
    assert_eq!(texts, ["oi", "Você disse oi", "tudo bem", "Você disse tudo bem"]);

    let (_, page) = send(&engine, "GET", &format!("{uri}?limit=1&before=u2"), "ana", Value::Null).await;
    assert_eq!(page, json!({ "messages": [message("a0", "in", "Você disse oi")], "hasMore": true }));
    assert_eq!(
        send(&engine, "GET", &format!("{uri}?limit=0"), "ana", Value::Null).await.0,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        send(&engine, "GET", uri, "beto", Value::Null).await.1,
        json!({ "messages": [], "hasMore": false })
    );
    // outra conversa do mesmo usuário é outra lista
    assert_eq!(
        send(&engine, "GET", "/_chat/outra/messages", "ana", Value::Null).await.1["messages"],
        json!([])
    );
    assert_eq!(
        send(&engine, "POST", uri, "ana", json!({ "text": "oi" })).await.0,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(send(&engine, "POST", uri, "ana", json!([1])).await.0, StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn sse_leva_a_resposta_so_ao_dono_e_segura_parte_recusada() {
    let engine = build(Some(Port::default())).await;
    let res = engine
        .router()
        .oneshot(req("GET", "/_chat/assistant/_events", "ana", Value::Null))
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let (mut body, mut buf) = (res.into_body(), String::new());
    assert_eq!(next_event(&mut body, &mut buf).await, Some(("ready".into(), json!({}))));

    let uri = "/_chat/assistant/messages";
    send(&engine, "POST", uri, "beto", json!({ "clientId": "c1", "text": "oi" })).await;
    send(
        &engine,
        "POST",
        "/_chat/outra/messages",
        "ana",
        json!({ "clientId": "c1", "text": "oi" }),
    )
    .await;
    assert_eq!(
        next_event(&mut body, &mut buf).await,
        None,
        "outro usuário e outra conversa não chegam"
    );

    send(&engine, "POST", uri, "ana", json!({ "clientId": "c2", "text": "oi" })).await;
    let (name, event) = next_event(&mut body, &mut buf).await.unwrap();
    assert_eq!(name, "message");
    assert_eq!(event["type"], "message");
    assert_eq!(event["message"]["text"], "Você disse oi");
    assert_eq!(event["message"]["conversationId"], "assistant");

    send(&engine, "POST", uri, "ana", json!({ "clientId": "c3", "text": "ruim" })).await;
    assert_eq!(next_event(&mut body, &mut buf).await, None, "parte que a spec recusa não sai");

    assert_eq!(
        send(&engine, "POST", "/_chat/assistant/_stop", "ana", Value::Null).await.0,
        StatusCode::NO_CONTENT
    );
    let (name, event) = next_event(&mut body, &mut buf).await.unwrap();
    assert_eq!(name, "delta");
    assert_eq!(
        event,
        json!({ "type": "delta", "id": "a0", "text": "", "done": true, "conversationId": "assistant" })
    );
}

#[tokio::test]
async fn responde_pergunta_e_parte() {
    let engine = build(Some(Port::default())).await;
    let base = "/_chat/assistant/messages";
    let (status, _) = send(&engine, "POST", &format!("{base}/m1/_answer"), "ana", json!({ "optionIds": ["a"] })).await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _) = send(&engine, "POST", &format!("{base}/respondida/_answer"), "ana", json!({})).await;
    assert_eq!(status, StatusCode::CONFLICT);
    let (status, _) = send(&engine, "POST", &format!("{base}/m1/_answer"), "ana", json!({ "text": 1 })).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    for (id, error) in [
        ("evento", "evento 'x' desconhecido"),
        ("lista", "o evento precisa ser um objeto"),
        ("sem-mensagem", "message precisa ser um objeto"),
    ] {
        let (status, body) = send(&engine, "POST", &format!("{base}/{id}/_answer"), "ana", json!({})).await;
        assert_eq!((status, body["error"]["message"].as_str()), (StatusCode::BAD_REQUEST, Some(error)));
    }

    let ui = format!("{base}/m1/_ui/p1");
    assert_eq!(
        send(&engine, "POST", &ui, "ana", json!({ "action": "accept", "values": {} }))
            .await
            .0,
        StatusCode::NO_CONTENT
    );
    assert_eq!(
        send(&engine, "POST", &ui, "ana", json!({ "action": "talvez" })).await.0,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(send(&engine, "POST", &ui, "ana", Value::Null).await.0, StatusCode::BAD_REQUEST);
}
