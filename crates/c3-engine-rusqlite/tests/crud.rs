//! O CRUD do motor sobre rusqlite: o mesmo contrato do adaptador sqlx (a suíte de conformidade roda
//! com o sqlx). Aqui fica o que depende do adaptador: tipos lidos, REGEXP, erros de constraint,
//! transação desfeita e conexão sem `prepare` recusada no boot.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use c3_engine::Engine;
use c3_engine_rusqlite::RusqliteStore;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["category", "item"], "layout": { "menu": [] } }"#;
const CATEGORY: &str = r#"{
  "specVersion": "0", "name": "category", "label": { "singular": "Categoria", "plural": "Categorias" },
  "titleField": "name",
  "fields": [ { "name": "name", "type": "string", "required": true } ]
}"#;
const ITEM: &str = r#"{
  "specVersion": "0", "name": "item", "label": { "singular": "Item", "plural": "Itens" },
  "titleField": "code",
  "fields": [ { "name": "code", "type": "string", "required": true, "unique": true },
              { "name": "price", "type": "decimal", "scale": 2 },
              { "name": "active", "type": "boolean", "default": true },
              { "name": "category", "type": "reference", "entity": "category" } ],
  "views": { "list": { "columns": ["code"], "search": ["code"] } }
}"#;

struct Db(std::path::PathBuf);

impl Drop for Db {
    fn drop(&mut self) {
        for ext in ["", "-wal", "-shm", "-journal"] {
            let _ = std::fs::remove_file(format!("{}{ext}", self.0.display()));
        }
    }
}

fn db(name: &str) -> Db {
    let path = std::env::temp_dir().join(format!("c3-rusqlite-{name}-{}.db", std::process::id()));
    let _ = std::fs::remove_file(&path);
    rusqlite::Connection::open(&path)
        .unwrap()
        .execute_batch(
            "CREATE TABLE category (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
             CREATE TABLE item (id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, price INTEGER,
                                active INTEGER, category INTEGER REFERENCES category (id) ON DELETE RESTRICT);
             INSERT INTO category (name) VALUES ('Bebidas');",
        )
        .unwrap();
    Db(path)
}

async fn engine(db: &Db) -> Engine {
    Engine::builder(RusqliteStore::open(&db.0))
        .app(APP)
        .entity(CATEGORY)
        .entity(ITEM)
        .build()
        .await
        .unwrap()
}

async fn send(engine: &Engine, method: &str, uri: &str, body: Value) -> (StatusCode, Value) {
    let req = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .body(Body::from(if body.is_null() { String::new() } else { body.to_string() }))
        .unwrap();
    let res = engine.router().oneshot(req).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

#[tokio::test]
async fn crud_round_trip() {
    let db = db("crud");
    let engine = engine(&db).await;

    let (status, created) = send(
        &engine,
        "POST",
        "/item",
        json!({ "code": "Água-1", "price": "3.50", "category": "1" }),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "{created}");
    assert_eq!(created["data"]["price"], "3.50");
    assert_eq!(created["data"]["active"], true);
    assert_eq!(created["data"]["category"], json!({ "id": "1", "title": "Bebidas" }));
    let id = created["data"]["id"].as_str().unwrap().to_owned();

    // busca livre usa REGEXP, sem diferenciar maiúsculas Unicode
    let (status, list) = send(&engine, "GET", "/item?q=%C3%81GUA", Value::Null).await;
    assert_eq!(status, StatusCode::OK, "{list}");
    assert_eq!(list["meta"]["total"], 1);

    let (status, updated) = send(&engine, "PATCH", &format!("/item/{id}"), json!({ "price": "4" })).await;
    assert_eq!(status, StatusCode::OK, "{updated}");
    assert_eq!(updated["data"]["price"], "4.00");

    let (status, _) = send(&engine, "DELETE", &format!("/item/{id}"), Value::Null).await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _) = send(&engine, "GET", &format!("/item/{id}"), Value::Null).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn constraint_errors_keep_the_contract() {
    let db = db("constraints");
    let engine = engine(&db).await;

    let (status, _) = send(&engine, "POST", "/item", json!({ "code": "A", "category": "1" })).await;
    assert_eq!(status, StatusCode::CREATED);

    let (status, err) = send(&engine, "POST", "/item", json!({ "code": "A" })).await;
    assert_eq!(status, StatusCode::CONFLICT, "{err}");
    assert_eq!(err["error"]["fields"]["code"][0]["code"], "unique");

    // ON DELETE RESTRICT: categoria em uso não sai
    let (status, err) = send(&engine, "DELETE", "/category/1", Value::Null).await;
    assert_eq!(status, StatusCode::CONFLICT, "{err}");

    // a transação recusada foi desfeita e soltou o lock: a próxima gravação passa
    let (status, _) = send(&engine, "POST", "/item", json!({ "code": "B" })).await;
    assert_eq!(status, StatusCode::CREATED);
    let (_, list) = send(&engine, "GET", "/item", Value::Null).await;
    assert_eq!(list["meta"]["total"], 2);
}

#[tokio::test]
async fn connection_without_prepare_is_refused_at_boot() {
    struct Raw(std::path::PathBuf);
    impl c3_engine_rusqlite::Connections for Raw {
        type Conn = Box<rusqlite::Connection>;
        fn get(&self) -> Result<Self::Conn, c3_engine_rusqlite::BoxError> {
            Ok(Box::new(rusqlite::Connection::open(&self.0)?))
        }
    }
    let db = db("raw");
    let err = Engine::builder(RusqliteStore::new(Raw(db.0.clone())))
        .app(APP)
        .entity(CATEGORY)
        .entity(ITEM)
        .build()
        .await
        .err()
        .unwrap();
    assert!(err.0.contains("REGEXP"), "{err}");
}

/// Modo só leitura (`EngineBuilder::read_only`), como no Nati: o motor lê pela conexão `query_only` e o
/// sistema grava pela conexão dele.
struct Writer(std::path::PathBuf);

#[c3_engine::async_trait]
impl c3_engine::Hooks for Writer {
    fn delegates_writes(&self, _entity: &str) -> bool {
        true
    }

    async fn write(&self, call: c3_engine::WriteCall<'_>) -> Result<i64, c3_engine::ApiError> {
        assert_eq!((call.entity, call.op), ("category", c3_engine::WriteOp::Create));
        let name = call.values["name"].as_str().unwrap().to_owned();
        let path = self.0.clone();
        tokio::task::spawn_blocking(move || {
            let conn = rusqlite::Connection::open(path).unwrap();
            conn.execute("INSERT INTO category (name) VALUES (?1)", [name]).unwrap();
            conn.last_insert_rowid()
        })
        .await
        .map_err(|_| c3_engine::ApiError::internal())
    }
}

async fn read_only(store: RusqliteStore<impl c3_engine_rusqlite::Connections>, hooks: impl c3_engine::Hooks) -> Result<Engine, String> {
    Engine::builder(store)
        .app(APP)
        .entity(CATEGORY)
        .entity(ITEM)
        .hooks(hooks)
        .read_only()
        .build()
        .await
        .map_err(|e| e.0)
}

#[tokio::test]
async fn read_only_reads_and_the_system_writes() {
    let db = db("read-only");
    let engine = read_only(RusqliteStore::open_read_only(&db.0), Writer(db.0.clone())).await.unwrap();
    let (status, body) = send(&engine, "POST", "/category", json!({ "name": "Lanches" })).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    assert_eq!(body["data"]["name"], "Lanches");
    let (_, list) = send(&engine, "GET", "/category", Value::Null).await;
    assert_eq!(list["meta"]["total"], 2);
}

#[tokio::test]
async fn read_only_refuses_writer_connection_and_undelegated_entities() {
    let db = db("read-only-refused");
    let err = read_only(RusqliteStore::open(&db.0), Writer(db.0.clone())).await.err().unwrap();
    assert!(err.contains("query_only"), "{err}");

    struct OnlyItem;
    impl c3_engine::Hooks for OnlyItem {
        fn delegates_writes(&self, entity: &str) -> bool {
            entity == "item"
        }
    }
    let err = read_only(RusqliteStore::open_read_only(&db.0), OnlyItem).await.err().unwrap();
    assert!(err.contains("delegates_writes): category"), "{err}");
}
