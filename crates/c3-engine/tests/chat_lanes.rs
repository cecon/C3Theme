use axum::body::Body;
use axum::http::{request::Parts, Request, StatusCode};
use c3_engine::{ApiError, Chat, ChatPage, ChatRoom, Engine, Outgoing};
use http_body_util::BodyExt;
use serde_json::{json, Map, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

struct Port;
#[c3_engine::async_trait]
impl Chat for Port {
    fn audience(&self, req: &Parts) -> String {
        req.headers["x-user"].to_str().unwrap().to_owned()
    }
    async fn history(&self, _: &ChatRoom, _: Option<&str>, _: usize) -> Result<ChatPage, ApiError> {
        Ok(ChatPage::default())
    }
    async fn send(&self, _: ChatRoom, _: Outgoing) -> Result<Value, ApiError> {
        Ok(json!({}))
    }
    async fn answer(&self, _: ChatRoom, _: &str, _: Map<String, Value>) -> Result<(), ApiError> {
        Ok(())
    }
    async fn answer_ui(&self, _: ChatRoom, _: &str, _: &str, _: Map<String, Value>) -> Result<(), ApiError> {
        Ok(())
    }
    async fn lanes(&self, r: ChatRoom) -> Result<Vec<Value>, ApiError> {
        Ok(vec![json!({ "owner": r.audience(), "parent": r.conversation() })])
    }
    async fn open_lane(&self, r: ChatRoom, input: Value) -> Result<Value, ApiError> {
        let child = r.in_conversation("child")?;
        Ok(json!({ "owner": child.audience(), "parent": r.conversation(), "id": child.conversation(), "input": input }))
    }
    async fn message_action(&self, r: ChatRoom, m: &str, a: &str) -> Result<Value, ApiError> {
        Ok(json!({ "message": format!("{}/{}/{m}/{a}", r.audience(), r.conversation()) }))
    }
}

async fn build() -> Engine {
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)")
        .execute(&pool)
        .await
        .unwrap();
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(r#"{ "specVersion": "0", "name": "t", "entities": ["note"], "layout": { "menu": [] } }"#)
        .entity(r#"{ "specVersion": "0", "name": "note", "label": { "singular": "Nota", "plural": "Notas" }, "titleField": "text", "fields": [{ "name": "text", "type": "string" }] }"#)
        .chat(Port).build().await.unwrap()
}

async fn request(engine: &Engine, method: &str, path: &str, user: &str, body: Value) -> (StatusCode, Value) {
    let req = Request::builder()
        .method(method)
        .uri(path)
        .header("x-user", user)
        .header("content-type", "application/json")
        .body(Body::from(if body.is_null() { String::new() } else { body.to_string() }))
        .unwrap();
    let response = engine.router().oneshot(req).await.unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

#[tokio::test]
async fn lanes_always_use_the_request_audience_and_parent() {
    let e = build().await;
    for (user, parent) in [("ana", "main"), ("bob", "main"), ("ana", "other")] {
        let (status, value) = request(&e, "GET", &format!("/_chat/{parent}/_lanes"), user, Value::Null).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(value, json!({ "data": [{ "owner": user, "parent": parent }] }));
    }
    let (status, value) = request(
        &e,
        "POST",
        "/_chat/main/_lanes",
        "ana",
        json!({ "kind": "branch", "fromMessageId": "m1" }),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(value["data"]["owner"], "ana");
    assert_eq!(value["data"]["id"], "child");
    let (status, value) = request(&e, "POST", "/_chat/main/messages/m1/_actions/a1", "ana", Value::Null).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(value["message"], "ana/main/m1/a1");
}

#[tokio::test]
async fn rejects_invalid_lane_bodies_before_the_agent() {
    let e = build().await;
    for body in [
        json!({}),
        json!({ "kind": "x" }),
        json!({ "kind": "branch" }),
        json!({ "kind": "branch", "fromMessageId": "" }),
        json!({ "kind": "aside", "fromMessageId": 1 }),
        json!({ "kind": "aside", "text": 1 }),
        json!({ "kind": "aside", "text": "x".repeat(20001) }),
        json!({ "kind": "aside", "audience": "bob" }),
    ] {
        assert_eq!(
            request(&e, "POST", "/_chat/main/_lanes", "ana", body).await.0,
            StatusCode::BAD_REQUEST
        );
    }
    assert_eq!(
        request(&e, "POST", "/_chat/main/_lanes", "ana", json!({ "kind": "aside", "text": "" }))
            .await
            .0,
        StatusCode::CREATED
    );
}
