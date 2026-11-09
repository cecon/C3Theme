//! Versão do registro e Desfazer conferido no servidor: `If-Match` com versão velha não grava (412), `C3-Undo`
//! respeita `undoable` e `inverse`, e a spec errada falha no boot.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use c3_engine::{ActionCall, ActionOutcome, ApiError, Engine, Hooks, SqlValue};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["deal", "invoice"], "layout": { "menu": [] } }"#;
const DEAL: &str = r#"{
  "specVersion": "0", "name": "deal", "label": { "singular": "Negócio", "plural": "Negócios" },
  "fields": [ { "name": "title", "type": "string", "required": true },
              { "name": "status", "type": "enum", "readOnly": true, "default": "open",
                "options": [ { "value": "open", "label": "Aberto" }, { "value": "won", "label": "Ganho" } ] } ],
  "actions": [ { "name": "win", "label": "Ganhar", "inverse": "reopen" }, { "name": "reopen", "label": "Reabrir" } ]
}"#;
const INVOICE: &str = r#"{
  "specVersion": "0", "name": "invoice", "label": { "singular": "Nota", "plural": "Notas" }, "undoable": false,
  "fields": [ { "name": "number", "type": "string", "required": true } ]
}"#;

/// `win` e `reopen` mudam o status pelo mesmo banco do motor.
struct Rules;

#[c3_engine::async_trait]
impl Hooks for Rules {
    async fn run_action(&self, call: ActionCall<'_>) -> Result<ActionOutcome, ApiError> {
        let status = if call.action == "win" { "won" } else { "open" };
        let mut conn = call.store.conn().await?;
        let id = SqlValue::Int(call.id.parse().unwrap());
        conn.execute("UPDATE deal SET status = ? WHERE id = ?", &[SqlValue::Text(status.into()), id])
            .await?;
        Ok(ActionOutcome::default())
    }
}

async fn build(deal: &str) -> Result<Engine, String> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    for sql in [
        "CREATE TABLE deal (id INTEGER PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL)",
        "CREATE TABLE invoice (id INTEGER PRIMARY KEY, number TEXT NOT NULL)",
        "INSERT INTO deal (title, status) VALUES ('Padaria', 'open')",
        "INSERT INTO invoice (number) VALUES ('NF 1')",
    ] {
        sqlx::query(sql).execute(&pool).await.unwrap();
    }
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(deal)
        .entity(INVOICE)
        .hooks(Rules)
        .build()
        .await
        .map_err(|e| e.to_string())
}

async fn send(engine: &Engine, method: &str, uri: &str, headers: &[(&str, &str)], body: Value) -> (StatusCode, Value) {
    let mut req = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json");
    for (k, v) in headers {
        req = req.header(*k, *v);
    }
    let body = if body.is_null() { String::new() } else { body.to_string() };
    let res = engine.router().oneshot(req.body(Body::from(body)).unwrap()).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

fn version(body: &Value) -> String {
    body["data"]["_version"].as_str().expect("_version").to_owned()
}

#[tokio::test]
async fn versao_velha_nao_grava_e_desfazer_nao_apaga_edicao_de_outro() {
    let e = build(DEAL).await.unwrap();
    let (_, read) = send(&e, "GET", "/deal/1", &[], Value::Null).await;
    let v0 = version(&read);
    let (_, listed) = send(&e, "GET", "/deal", &[], Value::Null).await;
    assert_eq!(listed["data"][0]["_version"], v0.as_str(), "lista e leitura dão a mesma versão");

    // o assistente grava; a versão de depois é a que o Desfazer leva
    let (status, saved) = send(
        &e,
        "PATCH",
        "/deal/1",
        &[("if-match", &format!("\"{v0}\""))],
        json!({ "title": "Padaria Sol" }),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{saved}");
    let v1 = version(&saved);
    assert_ne!(v0, v1);

    // alguém edita depois
    let (status, _) = send(&e, "PATCH", "/deal/1", &[], json!({ "title": "Padaria Sol Ltda" })).await;
    assert_eq!(status, StatusCode::OK);

    // o Desfazer chega com a versão velha: 412, e a edição do outro fica
    let undo = [("if-match", v1.as_str()), ("c3-undo", "true")];
    let (status, body) = send(&e, "PATCH", "/deal/1", &undo, json!({ "title": "Padaria" })).await;
    assert_eq!(status, StatusCode::PRECONDITION_FAILED, "{body}");
    assert_eq!(body["error"]["code"], "stale");
    let (status, _) = send(&e, "DELETE", "/deal/1", &undo, Value::Null).await;
    assert_eq!(status, StatusCode::PRECONDITION_FAILED);
    let (_, now) = send(&e, "GET", "/deal/1", &[], Value::Null).await;
    assert_eq!(now["data"]["title"], "Padaria Sol Ltda");

    // com a versão certa, desfaz
    let fresh = version(&now);
    let (status, body) = send(
        &e,
        "PATCH",
        "/deal/1",
        &[("if-match", &fresh), ("c3-undo", "true")],
        json!({ "title": "Padaria" }),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["data"]["title"], "Padaria");
}

#[tokio::test]
async fn desfazer_de_acao_so_pela_inversa_e_nunca_em_entidade_undoable_false() {
    let e = build(DEAL).await.unwrap();
    let (status, won) = send(&e, "POST", "/deal/1/_actions/win", &[], Value::Null).await;
    assert_eq!(status, StatusCode::OK, "{won}");
    let v = version(&won);
    let undo = [("if-match", v.as_str()), ("c3-undo", "true")];

    // win não desfaz nada; reopen é a inversa de win
    let (status, body) = send(&e, "POST", "/deal/1/_actions/win", &undo, Value::Null).await;
    assert_eq!((status, body["error"]["code"].as_str()), (StatusCode::CONFLICT, Some("conflict")));
    let (status, body) = send(&e, "POST", "/deal/1/_actions/reopen", &undo, Value::Null).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["data"]["status"], "open");
    // de novo com a mesma versão: o registro já mudou
    let (status, _) = send(&e, "POST", "/deal/1/_actions/reopen", &undo, Value::Null).await;
    assert_eq!(status, StatusCode::PRECONDITION_FAILED);

    // sem If-Match, o Desfazer nem começa
    let (status, _) = send(&e, "PATCH", "/deal/1", &[("c3-undo", "true")], json!({ "title": "x" })).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);

    // nota fiscal: Desfazer recusado mesmo com a versão certa; o CRUD normal segue
    let (_, nf) = send(&e, "GET", "/invoice/1", &[], Value::Null).await;
    let nv = version(&nf);
    let (status, _) = send(&e, "DELETE", "/invoice/1", &[("if-match", &nv), ("c3-undo", "true")], Value::Null).await;
    assert_eq!(status, StatusCode::CONFLICT);
    let (status, _) = send(&e, "PATCH", "/invoice/1", &[("if-match", &nv)], json!({ "number": "NF 1-A" })).await;
    assert_eq!(status, StatusCode::OK);
}

#[tokio::test]
async fn inverse_errado_falha_no_boot() {
    let bad = |actions: &str, undoable: &str| {
        DEAL.replace(
            r#""actions": [ { "name": "win", "label": "Ganhar", "inverse": "reopen" }, { "name": "reopen", "label": "Reabrir" } ]"#,
            &format!(r#""undoable": {undoable}, "actions": {actions}"#),
        )
    };
    let cases = [
        (r#"[{ "name": "win", "label": "G", "inverse": "nope" }]"#, "true", "não existe"),
        (r#"[{ "name": "win", "label": "G", "inverse": "win" }]"#, "true", "a si mesma"),
        (
            r#"[{ "name": "win", "label": "G", "inverse": "reopen" }, { "name": "reopen", "label": "R", "input": { "fields": [ { "name": "why", "type": "text" } ] } }]"#,
            "true",
            "não pode ter input",
        ),
        (
            r#"[{ "name": "win", "label": "G", "inverse": "reopen" }, { "name": "reopen", "label": "R" }]"#,
            "false",
            "undoable false",
        ),
    ];
    for (actions, undoable, expected) in cases {
        let err = build(&bad(actions, undoable)).await.err().expect("boot devia falhar");
        assert!(err.contains(expected), "{err}");
    }
}
