//! `Hooks::validate_children`: regra que compara as linhas `with_parent` entre si e com o pai, com os erros
//! na chave da linha e nada gravado.

use axum::body::Body;
use axum::http::Request;
use c3_engine::{ChildWrite, Conn, Engine, FieldErrors, Hooks, RequestContext, WriteOp};
use http_body_util::BodyExt;
use serde_json::{json, Map, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["doc", "line"], "layout": { "menu": [] } }"#;

const DOC: &str = r#"{ "specVersion": "0", "name": "doc", "label": { "singular": "Doc", "plural": "Docs" }, "titleField": "name",
    "fields": [ { "name": "name", "type": "string" }, { "name": "limit", "type": "integer", "required": true } ],
    "views": { "form": { "sections": [ { "rows": [["limit"]] },
        { "related": { "entity": "line", "field": "doc_id", "save": "with_parent" } } ] } } }"#;

const LINE: &str = r#"{ "specVersion": "0", "name": "line", "label": { "singular": "Linha", "plural": "Linhas" },
    "fields": [ { "name": "doc_id", "type": "reference", "entity": "doc", "required": true },
                { "name": "qty", "type": "integer", "required": true } ] }"#;

/// A soma das linhas que ficam não passa do limite do doc; linha com quantidade repetida é recusada.
struct Rules;

#[c3_engine::async_trait]
impl Hooks for Rules {
    async fn validate_children(
        &self,
        _ctx: &RequestContext<'_>,
        entity: &str,
        record: &Map<String, Value>,
        children: &[ChildWrite],
        _conn: &mut dyn Conn,
        errors: &mut FieldErrors,
    ) {
        assert_eq!(entity, "doc");
        let rows: Vec<_> = children[0].rows.iter().filter(|r| r.op != WriteOp::Delete).collect();
        let qty = |r: &&c3_engine::ChildRow| r.values["qty"].as_i64().unwrap();
        if rows.iter().map(qty).sum::<i64>() > record["limit"].as_i64().unwrap() {
            errors.add("limit", "min", "A soma das linhas passa do limite.");
        }
        for (i, r) in rows.iter().enumerate().skip(1) {
            if rows[..i].iter().any(|o| qty(o) == qty(r)) {
                errors.add(&format!("line.{}.qty", r.index.unwrap()), "unique", "Quantidade repetida.");
            }
        }
    }
}

async fn engine() -> Engine {
    let path = std::env::temp_dir().join(format!("c3-children-rules-{}.db", std::process::id()));
    let _ = std::fs::remove_file(&path);
    let url = format!("sqlite://{}", path.display());
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options(&url).unwrap())
        .await
        .unwrap();
    for sql in [
        "CREATE TABLE doc (id INTEGER PRIMARY KEY, name TEXT, \"limit\" INTEGER NOT NULL)",
        "CREATE TABLE line (id INTEGER PRIMARY KEY, doc_id INTEGER NOT NULL REFERENCES doc (id), qty INTEGER NOT NULL)",
    ] {
        sqlx::query(sql).execute(&pool).await.unwrap();
    }
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(DOC)
        .entity(LINE)
        .hooks(Rules)
        .build()
        .await
        .unwrap()
}

async fn post(e: &Engine, body: Value) -> (u16, Value) {
    let req = Request::post("/doc")
        .header("content-type", "application/json")
        .body(Body::from(body.to_string()))
        .unwrap();
    let res = e.router().oneshot(req).await.unwrap();
    let status = res.status().as_u16();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

#[tokio::test]
async fn rules_between_rows_block_the_save() {
    let e = engine().await;
    let (status, body) = post(&e, json!({ "limit": 5, "line": [{ "qty": 2 }, { "qty": 2 }, { "qty": 3 }] })).await;
    assert_eq!(status, 422);
    let fields = &body["error"]["fields"];
    assert_eq!(fields["limit"][0]["code"], "min");
    assert_eq!(fields["line.1.qty"][0]["code"], "unique");
    assert!(fields.get("line.0.qty").is_none());

    let (status, body) = post(&e, json!({ "limit": 5, "line": [{ "qty": 2 }, { "qty": 3 }] })).await;
    assert_eq!(status, 201, "{body}");
}
