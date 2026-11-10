//! Rota da busca do Ctrl K (spec/v0/search.yaml): só transporte. Quem procura é o sistema (`crate::search::Search`).

use std::collections::HashMap;

use axum::extract::{RawQuery, State};
use axum::http::request::Parts;
use axum::Json;
use serde_json::Value;

use crate::error::ApiError;
use crate::search;
use crate::Engine;

pub(super) async fn search(State(engine): State<Engine>, RawQuery(query): RawQuery, req: Parts) -> Result<Json<Value>, ApiError> {
    let q: HashMap<String, String> = form_urlencoded::parse(query.unwrap_or_default().as_bytes()).into_owned().collect();
    let text = q.get("q").map(String::as_str);
    Ok(Json(search::search(&engine, &req, text, q.get("limit").map(String::as_str)).await?))
}
