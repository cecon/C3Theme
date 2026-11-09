//! Filhos gravados junto com o pai (`related` com `save: with_parent`). O contrato HTTP está na suíte de
//! conformidade; aqui fica o que só se vê por dentro: `minItems`, o que o escritor delegado recebe e as
//! conferências do boot (o scope igual ao do pai é conferido pelo `pnpm spec:check` e pelo boot).

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use axum::body::Body;
use axum::http::Request;
use c3_engine::{ApiError, ChildWrite, Engine, Hooks, WriteCall, WriteOp};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["doc", "line"], "layout": { "menu": [] } }"#;

fn doc(related: &str) -> String {
    format!(
        r#"{{ "specVersion": "0", "name": "doc", "label": {{ "singular": "Doc", "plural": "Docs" }},
            "fields": [ {{ "name": "title", "type": "string", "required": true }} ],
            "views": {{ "form": {{ "sections": [ {{ "rows": [["title"]] }}, {{ "related": {related} }} ] }} }} }}"#
    )
}

fn line(scope: &str) -> String {
    format!(
        r#"{{ "specVersion": "0", "name": "line", "label": {{ "singular": "Linha", "plural": "Linhas" }}, "scope": "{scope}",
            "fields": [ {{ "name": "doc_id", "type": "reference", "entity": "doc", "required": true }},
                        {{ "name": "text", "type": "string", "required": true }} ] }}"#
    )
}

const RELATED: &str = r#"{ "entity": "line", "field": "doc_id", "save": "with_parent", "minItems": 1 }"#;

/// Grava pelo motor até `delegate` ligar; depois só registra o que o escritor receberia e recusa.
#[derive(Default)]
struct System {
    delegate: AtomicBool,
    seen: Mutex<Vec<(WriteOp, Vec<ChildWrite>)>>,
}

#[c3_engine::async_trait]
impl Hooks for System {
    fn delegates_writes(&self, _entity: &str) -> bool {
        self.delegate.load(Ordering::SeqCst)
    }

    async fn write(&self, call: WriteCall<'_>) -> Result<i64, ApiError> {
        self.seen.lock().unwrap().push((call.op, call.children.to_vec()));
        Err(ApiError::conflict("parado no teste", None))
    }
}

async fn build(app: &str, doc: &str, line: &str, hooks: Arc<System>) -> Result<Engine, c3_engine::BuildError> {
    let path = std::env::temp_dir().join(format!("c3-children-{}-{}.db", std::process::id(), rand_suffix()));
    let url = format!("sqlite://{}", path.display());
    let pool = SqlitePoolOptions::new()
        .connect_with(c3_engine::sqlx::sqlite_options(&url).unwrap())
        .await
        .unwrap();
    for sql in [
        "CREATE TABLE doc (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
        "CREATE TABLE line (id INTEGER PRIMARY KEY, doc_id INTEGER NOT NULL REFERENCES doc (id), other_id INTEGER, text TEXT NOT NULL)",
    ] {
        sqlx::query(sql).execute(&pool).await.unwrap();
    }
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(app)
        .entity(doc)
        .entity(line)
        .hooks(Shared(hooks))
        .build()
        .await
}

/// Nome único por teste: só o relógio colide quando dois testes paralelos abrem o banco no mesmo instante.
fn rand_suffix() -> String {
    static NEXT: AtomicU64 = AtomicU64::new(0);
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{nanos}-{}", NEXT.fetch_add(1, Ordering::Relaxed))
}

struct Shared(Arc<System>);

#[c3_engine::async_trait]
impl Hooks for Shared {
    fn delegates_writes(&self, entity: &str) -> bool {
        self.0.delegates_writes(entity)
    }

    async fn write(&self, call: WriteCall<'_>) -> Result<i64, ApiError> {
        self.0.write(call).await
    }
}

async fn send(engine: &Engine, method: &str, uri: &str, body: Value) -> (u16, Value) {
    let req = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .body(Body::from(body.to_string()))
        .unwrap();
    let res = engine.router().oneshot(req).await.unwrap();
    let status = res.status().as_u16();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

#[tokio::test]
async fn min_items_conta_lista_ausente_como_vazia() {
    let engine = build(APP, &doc(RELATED), &line("group"), Arc::default()).await.unwrap();
    let (status, body) = send(&engine, "POST", "/doc", json!({ "title": "a" })).await;
    assert_eq!(status, 422, "{body}");
    assert_eq!(body["error"]["fields"]["line"][0]["code"], "too_few");
}

#[tokio::test]
async fn escritor_delegado_recebe_excluir_alterar_incluir_com_posicao() {
    let system = Arc::new(System::default());
    let engine = build(APP, &doc(RELATED), &line("group"), system.clone()).await.unwrap();
    let (status, body) = send(
        &engine,
        "POST",
        "/doc",
        json!({ "title": "a", "line": [{ "text": "x" }, { "text": "y" }] }),
    )
    .await;
    assert_eq!(status, 201, "{body}");
    let id = body["data"]["id"].as_str().unwrap().to_owned();
    let (x, y) = (body["data"]["line"][0]["id"].clone(), body["data"]["line"][1]["id"].clone());

    system.delegate.store(true, Ordering::SeqCst);
    let patch = json!({ "line": [{ "text": "novo" }, { "id": y, "text": "y2" }] });
    let (status, _) = send(&engine, "PATCH", &format!("/doc/{id}"), patch).await;
    assert_eq!(status, 409, "o escritor do teste recusa");
    let seen = system.seen.lock().unwrap();
    let (op, children) = &seen[0];
    assert_eq!(*op, WriteOp::Update);
    assert_eq!((children[0].entity.as_str(), children[0].field.as_str()), ("line", "doc_id"));
    let rows: Vec<_> = children[0]
        .rows
        .iter()
        .map(|r| (r.op, r.id.map(|i| i.to_string()), r.index, r.values.get("text").cloned()))
        .collect();
    assert_eq!(
        rows,
        vec![
            (WriteOp::Delete, x.as_str().map(str::to_owned), None, None),
            (WriteOp::Update, y.as_str().map(str::to_owned), Some(1), Some(json!("y2"))),
            (WriteOp::Create, None, Some(0), Some(json!("novo"))),
        ]
    );
    assert!(children[0].rows[0].before.is_some() && children[0].rows[1].before.is_some());
    assert!(
        !children[0].rows[2].values.contains_key("doc_id"),
        "a coluna do pai não vai em values"
    );
}

#[tokio::test]
async fn boot_recusa_filha_sem_reference_para_o_pai_ou_acima_do_teto() {
    let wrong = RELATED.replace("doc_id", "text");
    let err = build(APP, &doc(&wrong), &line("group"), Arc::default()).await.err().unwrap();
    assert!(err.0.contains("precisa ser reference para 'doc'"), "{}", err.0);

    let big = RELATED.replace(r#""minItems": 1"#, r#""maxItems": 501"#);
    let err = build(APP, &doc(&big), &line("group"), Arc::default()).await.err().unwrap();
    assert!(err.0.contains("maxItems"), "{}", err.0);
}

#[tokio::test]
async fn boot_recusa_checklist_mal_declarado() {
    let loose = RELATED.replace(r#""minItems": 1"#, r#""groupBy": "text""#);
    let err = build(APP, &doc(&loose), &line("group"), Arc::default()).await.err().unwrap();
    assert!(err.0.contains("só valem com display 'checklist'"), "{}", err.0);

    let not_ref = RELATED.replace(r#""minItems": 1"#, r#""display": "checklist", "option": "text""#);
    let err = build(APP, &doc(&not_ref), &line("group"), Arc::default()).await.err().unwrap();
    assert!(err.0.contains("checklist precisa de 'option'"), "{}", err.0);

    // checklist válido (option é outra reference da filha), mas o groupBy não existe na entidade das opções
    let two_refs = line("group").replace(
        r#"{ "name": "text""#,
        r#"{ "name": "other_id", "type": "reference", "entity": "doc" }, { "name": "text""#,
    );
    let checklist = RELATED.replace(r#""minItems": 1"#, r#""display": "checklist", "option": "other_id""#);
    assert!(
        build(APP, &doc(&checklist), &two_refs, Arc::default()).await.is_ok(),
        "sem groupBy sobe"
    );
    let grouped = checklist.replace(r#""option": "other_id""#, r#""option": "other_id", "groupBy": "nope""#);
    let err = build(APP, &doc(&grouped), &two_refs, Arc::default()).await.err().unwrap();
    assert!(err.0.contains("groupBy 'nope' não é campo de 'doc'"), "{}", err.0);
}

#[tokio::test]
async fn boot_recusa_max_items_em_separately() {
    // ignorado em silêncio, o maxItems 1 deixava gravar a 2ª linha pelo CRUD da filha
    let cases = [
        (r#""maxItems": 1"#, "maxItems"),
        (r#""minItems": 1"#, "minItems"),
        (r#""option": "text""#, "option"),
        (r#""groupBy": "text""#, "groupBy"),
        (r#""display": "checklist""#, "display"),
    ];
    for (keys, key) in cases {
        let loose = RELATED.replace(r#""save": "with_parent", "minItems": 1"#, keys);
        let err = build(APP, &doc(&loose), &line("group"), Arc::default()).await.err().unwrap();
        assert!(err.0.contains(&format!("'{key}' só vale com save 'with_parent'")), "{}", err.0);
    }
    let table = RELATED.replace(r#""save": "with_parent", "minItems": 1"#, r#""display": "table""#);
    assert!(build(APP, &doc(&table), &line("group"), Arc::default()).await.is_ok());
}
