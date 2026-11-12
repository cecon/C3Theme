//! Corpos e parâmetros das rotas do chat (spec/v0/chat.yaml), já conferidos antes de chegar à porta.

use serde_json::{Map, Value};

use super::Outgoing;
use crate::error::ApiError;

/// Mensagens por página do histórico, no máximo.
pub const MAX_LIMIT: usize = 100;
const DEFAULT_LIMIT: usize = 30;
/// Tamanho máximo do texto que o usuário manda, em caracteres.
pub const MAX_TEXT: usize = 20_000;

/// `limit` da query: ausente vale 30; fora de 1..=100 ou não numérico, 400.
pub(crate) fn parse_limit(raw: Option<&str>) -> Result<usize, ApiError> {
    match raw {
        None => Ok(DEFAULT_LIMIT),
        Some(s) => match s.parse::<usize>() {
            Ok(n) if (1..=MAX_LIMIT).contains(&n) => Ok(n),
            _ => Err(ApiError::bad_request("limit precisa ser um número de 1 a 100.")),
        },
    }
}

fn text_of(body: &Map<String, Value>, key: &str, max: usize) -> Result<Option<String>, ApiError> {
    match body.get(key) {
        None | Some(Value::Null) => Ok(None),
        Some(Value::String(s)) if !s.is_empty() && s.chars().count() <= max => Ok(Some(s.clone())),
        Some(_) => Err(ApiError::bad_request(format!("{key} precisa ser texto de 1 a {max} caracteres."))),
    }
}

/// Corpo de POST messages: `{ clientId, text, replyTo?, pendingPart?, steer? }`, sem outras chaves.
pub(crate) fn parse_outgoing(body: &Map<String, Value>) -> Result<Outgoing, ApiError> {
    if let Some(k) = body
        .keys()
        .find(|k| !["clientId", "text", "replyTo", "pendingPart", "steer"].contains(&k.as_str()))
    {
        return Err(ApiError::bad_request(format!("'{k}' não vale no envio.")));
    }
    let required = |v: Option<String>, key: &str| v.ok_or_else(|| ApiError::bad_request(format!("{key} é obrigatório.")));
    let pending_part = match body.get("pendingPart") {
        None | Some(Value::Null) => None,
        Some(p @ Value::Object(o))
            if ["messageId", "partId", "kind"]
                .iter()
                .all(|k| o.get(*k).is_some_and(Value::is_string)) =>
        {
            Some(p.clone())
        }
        Some(_) => return Err(ApiError::bad_request("pendingPart precisa de messageId, partId e kind.")),
    };
    let steer = match body.get("steer") {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(_) => return Err(ApiError::bad_request("steer precisa ser verdadeiro ou falso.")),
    };
    Ok(Outgoing {
        client_id: required(text_of(body, "clientId", 100)?, "clientId")?,
        text: required(text_of(body, "text", MAX_TEXT)?, "text")?,
        reply_to: text_of(body, "replyTo", 100)?,
        pending_part,
        steer,
    })
}

/// Corpo da resposta de pergunta: `{ optionIds?: string[], text?: string, dismissed?: boolean }`.
pub(crate) fn parse_answer(body: Map<String, Value>) -> Result<Map<String, Value>, ApiError> {
    let ok = body.iter().all(|(k, v)| match k.as_str() {
        "optionIds" => v.as_array().is_some_and(|a| a.iter().all(Value::is_string)),
        "text" => v.is_string(),
        "dismissed" => v.is_boolean(),
        _ => false,
    });
    if ok {
        Ok(body)
    } else {
        Err(ApiError::bad_request("Resposta precisa ser { optionIds?, text?, dismissed? }."))
    }
}

/// Corpo da resposta de parte: `action` é `accept`, `decline`, `cancel` ou `undo`; `values` objeto; `version` número.
pub(crate) fn parse_ui_answer(body: Map<String, Value>) -> Result<Map<String, Value>, ApiError> {
    let action = body.get("action").and_then(Value::as_str);
    if !action.is_some_and(|a| ["accept", "decline", "cancel", "undo"].contains(&a)) {
        return Err(ApiError::bad_request("action precisa ser accept, decline, cancel ou undo."));
    }
    let shape = |k: &str, ok: fn(&Value) -> bool| body.get(k).is_none_or(ok);
    if !shape("values", Value::is_object) || !shape("version", Value::is_u64) || !shape("reason", Value::is_string) {
        return Err(ApiError::bad_request("values precisa ser objeto, version número e reason texto."));
    }
    Ok(body)
}

/// Id de mensagem ou de parte no caminho: não vazio.
pub(crate) fn check_id(id: &str, what: &str) -> Result<(), ApiError> {
    if id.is_empty() {
        Err(ApiError::bad_request(format!("{what} vazio.")))
    } else {
        Ok(())
    }
}
