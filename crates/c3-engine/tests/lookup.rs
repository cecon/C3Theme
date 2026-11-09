//! Consultar e preencher (`lookups`). O contrato HTTP está na suíte de conformidade; aqui ficam as conferências
//! da subida e o formato do que o sistema devolve para um `reference`.

use std::sync::Mutex;

use axum::body::Body;
use axum::http::Request;
use c3_engine::{ApiError, Engine, Hooks, LookupCall};
use serde_json::{json, Map, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["place"], "layout": { "menu": [] } }"#;

#[derive(Default)]
struct System(Mutex<Value>);

#[c3_engine::async_trait]
impl Hooks for System {
    async fn lookup(&self, _call: LookupCall<'_>) -> Result<Map<String, Value>, ApiError> {
        Ok(self.0.lock().unwrap().as_object().cloned().unwrap_or_default())
    }
}

fn place(lookups: &str) -> String {
    format!(
        r#"{{ "specVersion": "0", "name": "place", "label": {{ "singular": "Lugar", "plural": "Lugares" }},
            "fields": [ {{ "name": "zip", "type": "string" }}, {{ "name": "street", "type": "string", "maxLength": 5 }},
                        {{ "name": "n", "type": "integer" }}, {{ "name": "code", "type": "string", "readOnly": true }},
                        {{ "name": "near_id", "type": "reference", "entity": "place" }} ],
            "lookups": {lookups} }}"#
    )
}

async fn build(lookups: &str, hooks: System) -> Result<Engine, c3_engine::BuildError> {
    let n = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let url = format!("sqlite://{}", std::env::temp_dir().join(format!("c3-lookup-{n}.db")).display());
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options(&url).unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE place (id INTEGER PRIMARY KEY, zip TEXT, street TEXT, n INTEGER, code TEXT, near_id INTEGER)")
        .execute(&pool)
        .await
        .unwrap();
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(&place(lookups))
        .hooks(hooks)
        .build()
        .await
}

#[tokio::test]
async fn boot_recusa_lookup_mal_declarado() {
    let cases = [
        (
            r#"[{ "name": "a", "field": "n", "fills": ["street"] }]"#,
            "field 'n' precisa ser campo string",
        ),
        (
            r#"[{ "name": "a", "field": "zip", "fills": ["code"] }]"#,
            "'code' não pode ser preenchido",
        ),
        (
            r#"[{ "name": "a", "field": "zip", "fills": ["zip"] }]"#,
            "'zip' não pode ser preenchido",
        ),
        (
            r#"[{ "name": "a", "field": "zip", "fills": ["nope"] }]"#,
            "'nope' não pode ser preenchido",
        ),
        (
            r#"[{ "name": "a", "field": "zip", "fills": ["street"] }, { "name": "a", "field": "zip", "fills": ["n"] }]"#,
            "nome repetido",
        ),
        (r#"[{ "name": "a", "field": "zip" }]"#, "lookups mal formado"),
    ];
    for (lookups, msg) in cases {
        let err = build(lookups, System::default()).await.err().unwrap();
        assert!(err.0.contains(msg), "{lookups}: {}", err.0);
    }
}

#[tokio::test]
async fn resposta_do_sistema_confere_formato_de_cada_campo() {
    let lookups = r#"[{ "name": "a", "field": "zip", "fills": ["street", "near_id"] }]"#;
    for (data, status) in [
        (json!({ "near_id": { "id": "1", "title": "Centro" }, "street": null }), 200),
        (json!({ "near_id": "1" }), 500),
        (json!({ "near_id": { "title": "sem id" } }), 500),
        (json!({ "street": "comprida demais" }), 500),
        (json!({ "street": 5 }), 500),
    ] {
        let engine = build(lookups, System(Mutex::new(data.clone()))).await.unwrap();
        let req = Request::post("/place/_lookups/a")
            .header("content-type", "application/json")
            .body(Body::from(r#"{ "value": "01310100" }"#))
            .unwrap();
        let res = engine.router().oneshot(req).await.unwrap();
        assert_eq!(res.status().as_u16(), status, "{data}");
    }
}
