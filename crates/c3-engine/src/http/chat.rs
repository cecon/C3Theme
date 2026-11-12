//! Rotas do chat (spec/v0/chat.yaml): só transporte. Quem guarda as conversas e responde é o sistema
//! (`crate::chat::Chat`), pelo `ChatRoom`.

use std::collections::HashMap;
use std::convert::Infallible;
use std::time::Duration;

use axum::body::Bytes;
use axum::extract::{Path, RawQuery, State};
use axum::http::request::Parts;
use axum::http::StatusCode;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::Json;
use futures_util::stream::{self, Stream};
use serde_json::{json, Value};
use tokio::sync::broadcast::error::RecvError;

use super::object_or_empty;
use crate::chat;
use crate::error::ApiError;
use crate::Engine;

pub(super) async fn history(
    State(engine): State<Engine>,
    Path(conversation): Path<String>,
    RawQuery(query): RawQuery,
    req: Parts,
) -> Result<Json<Value>, ApiError> {
    let (port, room) = chat::open(&engine, &req, &conversation)?;
    let q: HashMap<String, String> = form_urlencoded::parse(query.unwrap_or_default().as_bytes()).into_owned().collect();
    let limit = chat::parse_limit(q.get("limit").map(String::as_str))?;
    let before = q.get("before").map(String::as_str).filter(|b| !b.is_empty());
    let page = port.history(&room, before, limit).await?;
    let skip = page.messages.len().saturating_sub(limit);
    Ok(Json(
        json!({ "messages": page.messages[skip..], "hasMore": page.has_more || skip > 0 }),
    ))
}

pub(super) async fn send(
    State(engine): State<Engine>,
    Path(conversation): Path<String>,
    req: Parts,
    body: Bytes,
) -> Result<Json<Value>, ApiError> {
    let (port, room) = chat::open(&engine, &req, &conversation)?;
    let message = chat::parse_outgoing(&object_or_empty(&body)?)?;
    Ok(Json(json!({ "data": port.send(room, message).await? })))
}

pub(super) async fn stop(State(engine): State<Engine>, Path(conversation): Path<String>, req: Parts) -> Result<StatusCode, ApiError> {
    let (port, room) = chat::open(&engine, &req, &conversation)?;
    port.stop(room).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// Tira a orientação que o agente ainda não leu (ADR 0008); a porta confere o estado (409) e emite `removed`.
pub(super) async fn remove(
    State(engine): State<Engine>,
    Path((conversation, message)): Path<(String, String)>,
    req: Parts,
) -> Result<StatusCode, ApiError> {
    let (port, room) = chat::open(&engine, &req, &conversation)?;
    chat::check_id(&message, "Mensagem")?;
    port.remove(room, &message).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub(super) async fn answer(
    State(engine): State<Engine>,
    Path((conversation, message)): Path<(String, String)>,
    req: Parts,
    body: Bytes,
) -> Result<StatusCode, ApiError> {
    let (port, room) = chat::open(&engine, &req, &conversation)?;
    chat::check_id(&message, "Mensagem")?;
    let answer = chat::parse_answer(object_or_empty(&body)?)?;
    port.answer(room, &message, answer).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub(super) async fn answer_ui(
    State(engine): State<Engine>,
    Path((conversation, message, part)): Path<(String, String, String)>,
    req: Parts,
    body: Bytes,
) -> Result<StatusCode, ApiError> {
    let (port, room) = chat::open(&engine, &req, &conversation)?;
    chat::check_id(&message, "Mensagem")?;
    chat::check_id(&part, "Parte")?;
    let answer = chat::parse_ui_answer(object_or_empty(&body)?)?;
    port.answer_ui(room, &message, &part, answer).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// Primeiro `ready`, depois cada evento desta conversa deste usuário, com o nome do `type`. Quem ficou para trás
/// recebe outro `ready` (relê o histórico).
pub(super) async fn events(
    State(engine): State<Engine>,
    Path(conversation): Path<String>,
    req: Parts,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, ApiError> {
    let (_, room) = chat::open(&engine, &req, &conversation)?;
    let rx = engine.0.chat_feed.subscribe();
    let ready = || Event::default().event("ready").data("{}");
    let stream = stream::unfold((rx, room, Some(ready())), move |(mut rx, room, first)| async move {
        if let Some(ready) = first {
            return Some((Ok(ready), (rx, room, None)));
        }
        loop {
            match rx.recv().await {
                Ok(s) if s.audience != room.audience() || s.conversation != room.conversation() => continue,
                Ok(s) => {
                    let name = s.event["type"].as_str().unwrap_or("message").to_owned();
                    let event = Event::default().event(name).data(s.event.to_string());
                    return Some((Ok(event), (rx, room, None)));
                }
                Err(RecvError::Lagged(_)) => return Some((Ok(ready()), (rx, room, None))),
                Err(RecvError::Closed) => return None,
            }
        }
    });
    Ok(Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(20)).text("")))
}
