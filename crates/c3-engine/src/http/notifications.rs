//! Rotas do sino (spec/v0/notifications.yaml): só transporte. Quem guarda os avisos é o sistema
//! (`crate::notifications::Notifications`).

use std::collections::HashMap;
use std::convert::Infallible;
use std::time::Duration;

use axum::body::Bytes;
use axum::extract::{RawQuery, State};
use axum::http::request::Parts;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::Json;
use futures_util::stream::{self, Stream};
use serde_json::Value;
use tokio::sync::broadcast::error::RecvError;

use super::object_or_empty;
use crate::error::ApiError;
use crate::notifications;
use crate::Engine;

pub(super) async fn list(State(engine): State<Engine>, RawQuery(query): RawQuery, req: Parts) -> Result<Json<Value>, ApiError> {
    let q: HashMap<String, String> = form_urlencoded::parse(query.unwrap_or_default().as_bytes()).into_owned().collect();
    Ok(Json(notifications::list(&engine, &req, q.get("limit").map(String::as_str)).await?))
}

pub(super) async fn read(State(engine): State<Engine>, req: Parts, body: Bytes) -> Result<Json<Value>, ApiError> {
    let ids = notifications::parse_ids(&object_or_empty(&body)?)?;
    Ok(Json(notifications::mark_read(&engine, &req, ids).await?))
}

/// Primeiro `ready`, depois um `notification` (sem conteúdo: a shell relê a lista) a cada aviso para este usuário.
/// Assinante que ficou para trás também recebe um `notification`.
pub(super) async fn events(
    State(engine): State<Engine>,
    req: Parts,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, ApiError> {
    let (rx, audience) = notifications::subscribe(&engine, &req)?;
    let ready = Event::default().event("ready").data("{}");
    let stream = stream::unfold((rx, audience, Some(ready)), |(mut rx, audience, first)| async move {
        if let Some(ready) = first {
            return Some((Ok(ready), (rx, audience, None)));
        }
        loop {
            match rx.recv().await {
                Ok(who) if who != audience => continue,
                Ok(_) | Err(RecvError::Lagged(_)) => {
                    let event = Event::default().event("notification").data("{}");
                    return Some((Ok(event), (rx, audience, None)));
                }
                Err(RecvError::Closed) => return None,
            }
        }
    });
    Ok(Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(20)).text("")))
}
