//! Arquivo como campo da entidade (`type: file`). O contrato HTTP está na suíte de conformidade; aqui fica a
//! conferência da subida: quem grava o arquivo é o sistema, e filha `with_parent` ainda não tem arquivo.

use c3_engine::{Engine, Hooks};
use sqlx::sqlite::SqlitePoolOptions;

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
        .app(APP)
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
