//! Adaptador HTTP (axum) do contrato: rotas, extração do pedido e formato da resposta.
//!
//! Os handlers só traduzem: o pedido vira chamada às regras (`crud`, `action`, `lookup`, `meta`) e o
//! resultado (ou o `ApiError`) vira a resposta do contrato. Nenhuma regra de negócio mora aqui.

mod chat;
mod handlers;
mod live;
mod notifications;
mod search;

use axum::body::Bytes;
use axum::extract::DefaultBodyLimit;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde_json::{json, Map, Value};

use crate::error::ApiError;
use crate::Engine;

pub(crate) fn router(engine: Engine) -> Router {
    // o corpo acompanha o teto de upload do app (`maxUploadSize`), em base64
    let limit = crate::field::file::body_limit(engine.0.app.max_upload);
    Router::new()
        .route("/_meta/app", get(handlers::meta_app))
        .route("/_meta/login", get(handlers::meta_login))
        .route("/_meta/context", get(handlers::meta_context))
        .route("/_meta/entities/{entity}", get(handlers::meta_entity))
        .route("/_notifications", get(notifications::list))
        .route("/_notifications/_read", post(notifications::read))
        .route("/_notifications/_events", get(notifications::events))
        .route("/_search", get(search::search))
        .route("/_chat/{conversation}/messages", get(chat::history).post(chat::send))
        .route("/_chat/{conversation}/_events", get(chat::events))
        .route("/_chat/{conversation}/_stop", post(chat::stop))
        .route("/_chat/{conversation}/messages/{message}/_answer", post(chat::answer))
        .route("/_chat/{conversation}/messages/{message}/_ui/{part}", post(chat::answer_ui))
        .route("/{entity}", get(handlers::list).post(handlers::create))
        .route(
            "/{entity}/{id}",
            get(handlers::read).patch(handlers::update).delete(handlers::delete),
        )
        .route("/{entity}/_aggregate", get(handlers::aggregate))
        .route("/{entity}/_events", get(live::events))
        .route("/{entity}/_actions/{action}", post(handlers::run_bulk_action))
        .route("/{entity}/_actions/{action}/_prefill", get(handlers::list_prefill))
        .route("/{entity}/_actions/{action}/_preview", post(handlers::list_preview))
        .route("/{entity}/_lookups/{lookup}", post(handlers::lookup))
        .route("/{entity}/{id}/_actions/{action}", post(handlers::run_action))
        .route("/{entity}/{id}/_actions/{action}/_prefill", get(handlers::prefill))
        .route("/{entity}/{id}/_actions/{action}/_preview", post(handlers::preview))
        .route("/{entity}/{id}/_files/{field}", get(handlers::download))
        .layer(DefaultBodyLimit::max(limit))
        .with_state(engine)
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(json!({ "error": self.body() }))).into_response()
    }
}

/// Corpo como JSON; `None` se não for JSON (a regra decide a mensagem).
fn json_body(body: &Bytes) -> Option<Value> {
    serde_json::from_slice(body).ok()
}

/// Corpo vazio vale como `{}`; fora isso, precisa ser um objeto JSON.
fn object_or_empty(body: &Bytes) -> Result<Map<String, Value>, ApiError> {
    if body.iter().all(u8::is_ascii_whitespace) {
        return Ok(Map::new());
    }
    match json_body(body) {
        Some(Value::Object(obj)) => Ok(obj),
        _ => Err(ApiError::bad_request("Corpo precisa ser um objeto JSON.")),
    }
}
