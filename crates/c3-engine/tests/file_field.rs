//! Arquivo como campo da entidade (`type: file`). O contrato HTTP está na suíte de conformidade; aqui fica a
//! conferência da subida: quem grava o arquivo é o sistema, e filha `with_parent` ainda não tem arquivo.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use c3_engine::{Engine, Hooks};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["doc", "page"], "layout": { "menu": [] } }"#;
const PAGE: &str = r#"{ "specVersion": "0", "name": "page", "label": { "singular": "Página", "plural": "Páginas" },
  "fields": [ { "name": "doc_id", "type": "reference", "entity": "doc", "required": true }, { "name": "scan", "type": "file" } ] }"#;

fn doc(related: &str) -> String {
    format!(
        r#"{{ "specVersion": "0", "name": "doc", "label": {{ "singular": "Doc", "plural": "Docs" }},
            "fields": [ {{ "name": "title", "type": "string" }}, {{ "name": "attachment", "type": "file", "accept": [".pdf"] }} ]
            {related} }}"#
    )
}

struct System(bool);

impl Hooks for System {
    fn delegates_writes(&self, _entity: &str) -> bool {
        self.0
    }
}

async fn build(doc: &str, delegates: bool) -> Result<Engine, c3_engine::BuildError> {
    build_app(APP, doc, delegates).await
}

async fn build_app(app: &str, doc: &str, delegates: bool) -> Result<Engine, c3_engine::BuildError> {
    let n = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let url = format!("sqlite://{}", std::env::temp_dir().join(format!("c3-file-{n}.db")).display());
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options(&url).unwrap())
        .await
        .unwrap();
    for sql in [
        "CREATE TABLE doc (id INTEGER PRIMARY KEY, title TEXT, attachment TEXT)",
        "CREATE TABLE page (id INTEGER PRIMARY KEY, doc_id INTEGER NOT NULL REFERENCES doc (id), scan TEXT)",
    ] {
        sqlx::query(sql).execute(&pool).await.unwrap();
    }
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(app)
        .entity(doc)
        .entity(PAGE)
        .hooks(System(delegates))
        .build()
        .await
}

#[tokio::test]
async fn arquivo_exige_escrita_delegada() {
    let err = build(&doc(""), false).await.err().unwrap();
    assert!(err.0.contains("campo file exige escrita delegada"), "{}", err.0);
    assert!(build(&doc(""), true).await.is_ok());
}

#[tokio::test]
async fn filha_with_parent_ainda_nao_tem_arquivo() {
    let related = r#", "views": { "form": { "sections": [ { "rows": [["title"]] },
        { "related": { "entity": "page", "field": "doc_id", "save": "with_parent" } } ] } }"#;
    let err = build(&doc(related), true).await.err().unwrap();
    assert!(err.0.contains("type file ainda não vale em filha with_parent"), "{}", err.0);
}

fn big_doc(max: usize) -> String {
    format!(
        r#"{{ "specVersion": "0", "name": "doc", "label": {{ "singular": "Doc", "plural": "Docs" }},
            "fields": [ {{ "name": "title", "type": "string" }}, {{ "name": "attachment", "type": "file", "maxSize": {max} }} ] }}"#
    )
}

fn app_with(max: &str) -> String {
    APP.replace(r#""name": "t","#, &format!(r#""name": "t", "maxUploadSize": {max},"#))
}

/// Status de um POST com corpo de `bytes` bytes (o limite do corpo vem antes de qualquer regra).
async fn post_status(engine: &Engine, bytes: usize) -> StatusCode {
    let body = format!(r#"{{ "title": "{}" }}"#, "x".repeat(bytes));
    let req = Request::post("/doc")
        .header("content-type", "application/json")
        .body(Body::from(body))
        .unwrap();
    engine.router().oneshot(req).await.unwrap().status()
}

#[tokio::test]
async fn teto_de_upload_vem_do_app() {
    let four = (4 << 20).to_string();
    // sem maxUploadSize, o teto é 1 MB
    let err = build(&big_doc(2 << 20), true).await.err().unwrap();
    assert!(err.0.contains("acima do maxUploadSize do app"), "{}", err.0);
    let engine = build_app(&app_with(&four), &big_doc(4 << 20), true).await.unwrap();
    // o corpo acompanha: 4 MB em base64 cabem; acima de 1 MB × 4/3 + folga, o padrão recusa
    assert_ne!(post_status(&engine, 5 << 20).await, StatusCode::PAYLOAD_TOO_LARGE);
    let small = build(&doc(""), true).await.unwrap();
    assert_eq!(post_status(&small, 3 << 20).await, StatusCode::PAYLOAD_TOO_LARGE);
    for bad in ["1000", &(64 << 20).to_string()] {
        let err = build_app(&app_with(bad), &doc(""), true).await.err().unwrap();
        assert!(err.0.contains("maxUploadSize entre"), "{}", err.0);
    }
}
