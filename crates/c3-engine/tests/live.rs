//! Tempo real (`live`): `GET /{entity}/_events` em SSE avisa criação, alteração, exclusão e ação, só do que o
//! assinante enxerga; entidade sem `live` não tem canal; `Live::notify` avisa o que o sistema grava por fora.

use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;

use axum::body::Body;
use axum::http::request::Parts;
use axum::http::{Request, StatusCode};
use c3_engine::{ActionCall, ActionOutcome, ApiError, Capabilities, Change, Engine, Hooks, Live};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["ticket", "note"], "layout": { "menu": [] } }"#;
const TICKET: &str = r#"{
  "specVersion": "0", "name": "ticket", "label": { "singular": "Pedido", "plural": "Pedidos" },
  "live": { "sound": { "on": ["created"] } },
  "fields": [ { "name": "station", "type": "string", "required": true },
              { "name": "status", "type": "string", "readOnly": true, "default": "new" } ],
  "actions": [ { "name": "ready", "label": "Pronto" } ],
  "rowAccess": [ { "permission": "grill", "where": { "field": "station", "op": "eq", "value": "grill" } },
                 { "permission": "all", "where": { "field": "station", "op": "null", "value": false } } ]
}"#;
const NOTE: &str = r#"{
  "specVersion": "0", "name": "note", "label": { "singular": "Nota", "plural": "Notas" },
  "fields": [ { "name": "text", "type": "string" } ]
}"#;

/// Permissões do cabeçalho `x-perm` (separadas por vírgula); `x-noread` tira a lista. `revoked` tira a lista de
/// todos no meio da assinatura (permissão retirada pelo administrador).
#[derive(Default, Clone)]
struct Rules {
    revoked: Arc<AtomicBool>,
}

#[c3_engine::async_trait]
impl Hooks for Rules {
    fn capabilities(&self, _entity: &str, _branch: Option<&str>, req: &Parts) -> Capabilities {
        let list = !req.headers.contains_key("x-noread") && !self.revoked.load(Ordering::Relaxed);
        Capabilities { list, ..Capabilities::ALL }
    }

    fn permitted(&self, code: &str, _branch: Option<&str>, req: &Parts) -> bool {
        let perms = req.headers.get("x-perm").and_then(|v| v.to_str().ok()).unwrap_or("");
        perms.split(',').any(|p| p == code)
    }

    async fn run_action(&self, call: ActionCall<'_>) -> Result<ActionOutcome, ApiError> {
        let mut conn = call.store.conn().await?;
        let id = c3_engine::SqlValue::Int(call.id.parse().unwrap());
        conn.execute("UPDATE ticket SET status = 'ready' WHERE id = ?", &[id]).await?;
        Ok(ActionOutcome::default())
    }
}

async fn build(live: Live) -> Engine {
    build_with(live, Rules::default()).await
}

async fn build_with(live: Live, rules: Rules) -> Engine {
    // banco em memória compartilhado entre as conexões do pool (o SSE relê enquanto outra requisição grava)
    static N: AtomicUsize = AtomicUsize::new(0);
    let n = N.fetch_add(1, Ordering::Relaxed);
    let url = format!("sqlite:file:live{n}?mode=memory&cache=shared");
    let pool = SqlitePoolOptions::new()
        .max_connections(4)
        .connect_with(c3_engine::sqlx::sqlite_options(&url).unwrap())
        .await
        .unwrap();
    for sql in [
        "CREATE TABLE ticket (id INTEGER PRIMARY KEY, station TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new')",
        "CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)",
    ] {
        sqlx::query(sql).execute(&pool).await.unwrap();
    }
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(TICKET)
        .entity(NOTE)
        .hooks(rules)
        .live(live)
        .build()
        .await
        .unwrap()
}

fn request(method: &str, uri: &str, perm: &str, body: Value) -> Request<Body> {
    let body = if body.is_null() { String::new() } else { body.to_string() };
    Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .header("x-perm", perm)
        .body(Body::from(body))
        .unwrap()
}

async fn send(engine: &Engine, method: &str, uri: &str, body: Value) -> (StatusCode, Value) {
    let res = engine.router().oneshot(request(method, uri, "all", body)).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

/// Lê o SSE aos pedaços e devolve cada evento como (nome, dado).
struct Events {
    body: Body,
    buf: String,
    /// O servidor fechou a conexão (e não só ficou quieto até o prazo).
    closed: bool,
}

impl Events {
    async fn next(&mut self) -> Option<(String, Value)> {
        loop {
            if let Some(end) = self.buf.find("\n\n") {
                let block: String = self.buf.drain(..end + 2).collect();
                let (mut name, mut data) = (String::new(), Value::Null);
                for line in block.lines() {
                    if let Some(v) = line.strip_prefix("event: ") {
                        name = v.to_owned();
                    } else if let Some(v) = line.strip_prefix("data: ") {
                        data = serde_json::from_str(v).unwrap();
                    }
                }
                if name.is_empty() {
                    continue; // keep-alive
                }
                return Some((name, data));
            }
            let Some(frame) = tokio::time::timeout(Duration::from_millis(500), self.body.frame()).await.ok()? else {
                self.closed = true;
                return None;
            };
            let frame = frame.ok()?;
            self.buf.push_str(&String::from_utf8_lossy(&frame.into_data().ok()?));
        }
    }
}

async fn subscribe(engine: &Engine, perm: &str) -> Events {
    let res = engine
        .router()
        .oneshot(request("GET", "/ticket/_events", perm, Value::Null))
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    assert!(res.headers()["content-type"].to_str().unwrap().starts_with("text/event-stream"));
    let mut events = Events {
        body: res.into_body(),
        buf: String::new(),
        closed: false,
    };
    assert_eq!(events.next().await.map(|e| e.0).as_deref(), Some("ready"));
    events
}

#[tokio::test]
async fn avisa_so_o_que_o_assinante_enxerga() {
    let engine = build(Live::new()).await;
    let mut grill = subscribe(&engine, "grill").await;
    let mut all = subscribe(&engine, "all").await;

    let (st, bar) = send(&engine, "POST", "/ticket", json!({ "station": "bar" })).await;
    assert_eq!(st, StatusCode::CREATED);
    let (_, mine) = send(&engine, "POST", "/ticket", json!({ "station": "grill" })).await;
    let (bar_id, mine_id) = (bar["data"]["id"].clone(), mine["data"]["id"].clone());

    // quem vê tudo recebe os dois; a chapa só o dela
    assert_eq!(all.next().await.unwrap().1, json!({ "change": "created", "id": bar_id }));
    assert_eq!(all.next().await.unwrap().1, json!({ "change": "created", "id": mine_id }));
    assert_eq!(grill.next().await.unwrap().1, json!({ "change": "created", "id": mine_id }));

    let id = mine_id.as_str().unwrap();
    send(&engine, "POST", &format!("/ticket/{id}/_actions/ready"), json!({})).await;
    assert_eq!(grill.next().await.unwrap().1, json!({ "change": "updated", "id": mine_id }));
    send(&engine, "PATCH", &format!("/ticket/{id}"), json!({ "station": "grill" })).await;
    assert_eq!(grill.next().await.unwrap().1, json!({ "change": "updated", "id": mine_id }));
    let (st, _) = send(&engine, "DELETE", &format!("/ticket/{id}"), Value::Null).await;
    assert_eq!(st, StatusCode::NO_CONTENT);
    assert_eq!(grill.next().await.unwrap().1, json!({ "change": "deleted", "id": mine_id }));

    // gravação do sistema por fora do motor
    engine.notify("ticket", Some("99"), Change::Changed);
    assert_eq!(grill.next().await.unwrap().1, json!({ "change": "changed", "id": null }));
    assert!(grill.next().await.is_none(), "nada além do que a chapa enxerga");
}

#[tokio::test]
async fn notify_pelo_canal_criado_antes_do_motor() {
    let live = Live::new();
    let engine = build(live.clone()).await;
    let mut all = subscribe(&engine, "all").await;
    let (_, created) = send(&engine, "POST", "/ticket", json!({ "station": "bar" })).await;
    let id = created["data"]["id"].as_str().unwrap().to_owned();
    all.next().await.unwrap();
    // o sistema avisa uma alteração própria; outra entidade não chega aqui
    live.notify("note", Some("1"), Change::Updated);
    live.notify("ticket", Some(&id), Change::Updated);
    assert_eq!(all.next().await.unwrap().1, json!({ "change": "updated", "id": id }));
}

#[tokio::test]
async fn sem_live_ou_sem_lista_nao_assina() {
    let engine = build(Live::new()).await;
    let res = engine
        .router()
        .oneshot(request("GET", "/note/_events", "all", Value::Null))
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
    let mut req = request("GET", "/ticket/_events", "all", Value::Null);
    req.headers_mut().insert("x-noread", "1".parse().unwrap());
    let res = engine.router().oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn quem_ficou_para_tras_recebe_changed() {
    let engine = build(Live::new()).await;
    let mut slow = subscribe(&engine, "all").await;
    // mais avisos do que o canal guarda, sem o assinante ler nenhum
    for i in 0..1100 {
        engine.notify("ticket", Some(&i.to_string()), Change::Deleted);
    }
    assert_eq!(slow.next().await.unwrap().1, json!({ "change": "changed", "id": null }));
}

#[tokio::test]
async fn permissao_retirada_fecha_a_assinatura() {
    let rules = Rules::default();
    let engine = build_with(Live::new(), rules.clone()).await;
    let mut sub = subscribe(&engine, "all").await;
    rules.revoked.store(true, Ordering::Relaxed);
    // o próximo aviso refaz o contexto, não acha mais `list` e encerra em vez de entregar
    engine.notify("ticket", Some("1"), Change::Deleted);
    assert!(sub.next().await.is_none());
    assert!(sub.closed, "a conexão foi fechada pelo servidor, não ficou pendurada");
}
