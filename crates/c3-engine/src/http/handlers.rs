//! Um handler por rota do contrato (spec/v0/openapi.yaml).

use std::collections::HashMap;

use axum::body::Bytes;
use axum::extract::{Path, RawQuery, State};
use axum::http::request::Parts;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::{json, Value};

use super::{json_body, object_or_empty};
use crate::error::ApiError;
use crate::{action, action_prefill, action_preview, crud, download, lookup, meta, Engine};

type Result<T> = std::result::Result<T, ApiError>;

pub(super) async fn meta_app(State(engine): State<Engine>, req: Parts) -> Result<Json<Value>> {
    Ok(Json(meta::app(&engine, &req).await?))
}

pub(super) async fn meta_login(State(engine): State<Engine>) -> Json<Value> {
    Json(json!({ "data": meta::login(&engine) }))
}

pub(super) async fn meta_entity(State(engine): State<Engine>, Path(name): Path<String>, req: Parts) -> Result<Json<Value>> {
    Ok(Json(meta::entity(&engine, &req, &name).await?))
}

pub(super) async fn meta_context(State(engine): State<Engine>, req: Parts) -> Result<Json<Value>> {
    Ok(Json(json!({ "data": meta::context(&engine, &req).await? })))
}

pub(super) async fn read(State(engine): State<Engine>, Path((name, id)): Path<(String, String)>, req: Parts) -> Result<Json<Value>> {
    let record = crud::read(&engine, &req, &name, &id).await?;
    Ok(Json(json!({ "data": record })))
}

pub(super) async fn aggregate(
    State(engine): State<Engine>,
    Path(name): Path<String>,
    RawQuery(query): RawQuery,
    req: Parts,
) -> Result<Json<Value>> {
    let q: HashMap<String, String> = form_urlencoded::parse(query.unwrap_or_default().as_bytes()).into_owned().collect();
    let data = crud::aggregate(&engine, &req, &name, &q).await?;
    Ok(Json(json!({ "data": data })))
}

pub(super) async fn list(
    State(engine): State<Engine>,
    Path(name): Path<String>,
    RawQuery(query): RawQuery,
    req: Parts,
) -> Result<Json<Value>> {
    let q: HashMap<String, String> = form_urlencoded::parse(query.unwrap_or_default().as_bytes()).into_owned().collect();
    let page = crud::list(&engine, &req, &name, &q).await?;
    Ok(Json(json!({
        "data": page.data,
        "meta": { "page": page.page, "pageSize": page.page_size, "total": page.total },
    })))
}

pub(super) async fn create(
    State(engine): State<Engine>,
    Path(name): Path<String>,
    req: Parts,
    body: Bytes,
) -> Result<(StatusCode, Json<Value>)> {
    let created = crud::create(&engine, &req, &name, json_body(&body)).await?;
    Ok((StatusCode::CREATED, Json(json!({ "data": created }))))
}

pub(super) async fn update(
    State(engine): State<Engine>,
    Path((name, id)): Path<(String, String)>,
    req: Parts,
    body: Bytes,
) -> Result<Json<Value>> {
    let updated = crud::update(&engine, &req, &name, &id, json_body(&body)).await?;
    Ok(Json(json!({ "data": updated })))
}

pub(super) async fn delete(State(engine): State<Engine>, Path((name, id)): Path<(String, String)>, req: Parts) -> Result<StatusCode> {
    crud::delete(&engine, &req, &name, &id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub(super) async fn run_action(
    State(engine): State<Engine>,
    Path((name, id, action)): Path<(String, String, String)>,
    req: Parts,
    body: Bytes,
) -> Result<Response> {
    let body = object_or_empty(&body);
    Ok(action::run(&engine, &req, &name, &id, &action, body).await?.into_response())
}

pub(super) async fn run_bulk_action(
    State(engine): State<Engine>,
    Path((name, action)): Path<(String, String)>,
    req: Parts,
    body: Bytes,
) -> Result<Response> {
    let body = object_or_empty(&body);
    Ok(action::run_bulk(&engine, &req, &name, &action, body).await?.into_response())
}

pub(super) async fn prefill(
    State(engine): State<Engine>,
    Path((name, id, action)): Path<(String, String, String)>,
    req: Parts,
) -> Result<Json<Value>> {
    Ok(Json(action_prefill::prefill(&engine, &req, &name, Some(&id), &action).await?))
}

pub(super) async fn list_prefill(
    State(engine): State<Engine>,
    Path((name, action)): Path<(String, String)>,
    req: Parts,
) -> Result<Json<Value>> {
    Ok(Json(action_prefill::prefill(&engine, &req, &name, None, &action).await?))
}

pub(super) async fn preview(
    State(engine): State<Engine>,
    Path((name, id, action)): Path<(String, String, String)>,
    req: Parts,
    body: Bytes,
) -> Result<Json<Value>> {
    let body = object_or_empty(&body);
    Ok(Json(action_preview::preview(&engine, &req, &name, Some(&id), &action, body).await?))
}

pub(super) async fn list_preview(
    State(engine): State<Engine>,
    Path((name, action)): Path<(String, String)>,
    req: Parts,
    body: Bytes,
) -> Result<Json<Value>> {
    let body = object_or_empty(&body);
    Ok(Json(action_preview::preview(&engine, &req, &name, None, &action, body).await?))
}

pub(super) async fn lookup(
    State(engine): State<Engine>,
    Path((name, lookup)): Path<(String, String)>,
    req: Parts,
    body: Bytes,
) -> Result<Json<Value>> {
    let data = lookup::run(&engine, &req, &name, &lookup, json_body(&body)).await?;
    Ok(Json(json!({ "data": data })))
}

pub(super) async fn download(
    State(engine): State<Engine>,
    Path((name, id, field)): Path<(String, String, String)>,
    req: Parts,
) -> Result<Response> {
    let file = download::run(&engine, &req, &name, &id, &field).await?;
    let content_type = file.content_type.unwrap_or_else(|| "application/octet-stream".into());
    let headers = [
        (header::CONTENT_TYPE, content_type),
        (header::CONTENT_DISPOSITION, download::disposition(&file.name)),
        (header::X_CONTENT_TYPE_OPTIONS, "nosniff".into()),
    ];
    Ok((headers, file.data).into_response())
}
