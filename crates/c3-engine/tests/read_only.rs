//! Modo só leitura: o motor recusa subir sobre uma conexão que grava.

use c3_engine::{Engine, Hooks};
use sqlx::sqlite::SqlitePoolOptions;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["item"], "layout": { "menu": [] } }"#;
const ITEM: &str = r#"{
  "specVersion": "0", "name": "item", "label": { "singular": "Item", "plural": "Itens" },
  "fields": [ { "name": "code", "type": "string", "required": true, "maxLength": 10 } ]
}"#;

#[tokio::test]
async fn read_only_refuses_a_connection_that_writes() {
    struct All;
    impl Hooks for All {
        fn delegates_writes(&self, _entity: &str) -> bool {
            true
        }
    }
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE item (id INTEGER PRIMARY KEY, code TEXT NOT NULL)")
        .execute(&pool)
        .await
        .unwrap();
    let err = Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(ITEM)
        .hooks(All)
        .read_only()
        .build()
        .await
        .err()
        .unwrap();
    assert!(err.0.contains("query_only"), "{}", err.0);
}
