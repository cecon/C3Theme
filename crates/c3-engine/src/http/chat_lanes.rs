//! Transporte das conversas filhas; a porta recebe sempre a sala do usuário autenticado.
use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{request::Parts, StatusCode};
use axum::Json;
use serde_json::{json, Map, Value};

use super::object_or_empty;
use crate::{chat, error::ApiError, Engine};

pub(super) async fn list(State(engine): State<Engine>, Path(c): Path<String>, req: Parts) -> Result<Json<Value>, ApiError> {
    let (port, room) = chat::open(&engine, &req, &c)?;
    Ok(Json(json!({ "data": port.lanes(room).await? })))
}

pub(super) async fn open(
    State(engine): State<Engine>,
    Path(c): Path<String>,
    req: Parts,
    body: Bytes,
) -> Result<(StatusCode, Json<Value>), ApiError> {
    let (port, room) = chat::open(&engine, &req, &c)?;
    let input = validate(object_or_empty(&body)?)?;
    Ok((
        StatusCode::CREATED,
        Json(json!({ "data": port.open_lane(room, Value::Object(input)).await? })),
    ))
}

pub(super) async fn act(
    State(engine): State<Engine>,
    Path((c, m, a)): Path<(String, String, String)>,
    req: Parts,
) -> Result<Json<Value>, ApiError> {
    let (port, room) = chat::open(&engine, &req, &c)?;
    chat::check_id(&m, "Mensagem")?;
    chat::check_id(&a, "Ação")?;
    Ok(Json(port.message_action(room, &m, &a).await?))
}

pub(crate) fn validate(body: Map<String, Value>) -> Result<Map<String, Value>, ApiError> {
    if body.keys().any(|k| !["kind", "fromMessageId", "text"].contains(&k.as_str())) {
        return Err(ApiError::bad_request("Campo de conversa desconhecido."));
    }
    let kind = body.get("kind").and_then(Value::as_str).unwrap_or_default();
    if !["aside", "branch"].contains(&kind) {
        return Err(ApiError::bad_request("kind precisa ser aside ou branch."));
    }
    let id = body.get("fromMessageId");
    if id.is_some_and(|v| v.as_str().is_none_or(str::is_empty)) || (kind == "branch" && id.is_none()) {
        return Err(ApiError::bad_request("Ramo precisa de fromMessageId não vazio."));
    }
    if body
        .get("text")
        .is_some_and(|v| v.as_str().is_none_or(|s| s.chars().count() > chat::MAX_TEXT))
    {
        return Err(ApiError::bad_request("Texto de conversa inválido."));
    }
    Ok(body)
}
