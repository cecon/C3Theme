//! Login de demonstração para a shell (`auth` no app.json): o sistema é dono da autenticação, o motor não.
//!
//! Segue a convenção do adaptador `httpAuth` do `@c3theme/engine`: `POST /auth/login` e `GET /auth/me`.
//! O token é o próprio nome do usuário, como nos testes (`Bearer caio`). Senha de todos: `c3`.
//! Nunca use isto num sistema de verdade.

use axum::http::{HeaderMap, StatusCode};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde_json::{json, Value};

const PASSWORD: &str = "c3";
const USERS: [(&str, &str, &str); 3] = [
    ("admin", "Administrador", "admin@exemplo.com"),
    ("ana", "Ana Lima", "ana@exemplo.com"),
    ("caio", "Caio Souza", "caio@exemplo.com"),
];

pub fn router() -> Router {
    Router::new().route("/auth/login", post(login)).route("/auth/me", get(me))
}

fn user_json(login: &str) -> Option<Value> {
    let (id, name, email) = USERS.iter().find(|(id, _, email)| *id == login || *email == login)?;
    Some(json!({ "id": id, "name": name, "email": email }))
}

fn unauthorized(message: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({ "error": { "code": "unauthorized", "message": message } })),
    )
}

async fn login(Json(body): Json<Value>) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let identifier = body["identifier"].as_str().unwrap_or_default().trim().to_lowercase();
    match user_json(&identifier) {
        Some(user) if body["password"] == PASSWORD => Ok(Json(json!({ "token": user["id"], "user": user }))),
        _ => Err(unauthorized("Usuário ou senha incorretos.")),
    }
}

async fn me(headers: HeaderMap) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let token = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));
    match token.and_then(|t| user_json(t.split('@').next().unwrap_or(t))) {
        Some(user) => Ok(Json(json!({ "user": user }))),
        None => Err(unauthorized("Sessão expirada.")),
    }
}
