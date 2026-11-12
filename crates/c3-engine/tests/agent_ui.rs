//! Partes de interface do assistente (`Engine::check_agent_part`, `Engine::check_agent_answer`).

use c3_engine::{Engine, Hooks};
use serde_json::{json, Map, Value};
use sqlx::sqlite::SqlitePoolOptions;

const APP: &str = r#"{ "specVersion": "0", "name": "t", "entities": ["customer"], "layout": { "menu": [] } }"#;
const CUSTOMER: &str = r#"{
  "specVersion": "0", "name": "customer", "label": { "singular": "Cliente", "plural": "Clientes" }, "titleField": "name",
  "fields": [ { "name": "name", "type": "string", "required": true },
              { "name": "credit", "type": "decimal", "scale": 2, "aiReview": true },
              { "name": "code", "type": "string", "createOnly": true },
              { "name": "pin", "type": "string", "writeOnly": true },
              { "name": "created", "type": "datetime", "readOnly": true } ],
  "actions": [ { "name": "block", "label": "Bloquear", "tone": "danger",
                 "input": { "fields": [ { "name": "reason", "type": "text", "required": true } ] } },
               { "name": "import", "label": "Importar", "target": "list" } ]
}"#;

/// Senha só com escrita delegada (o boot exige); as gravações não rodam nestes testes.
struct Delegates;

#[c3_engine::async_trait]
impl Hooks for Delegates {
    fn delegates_writes(&self, _entity: &str) -> bool {
        true
    }
}

async fn engine() -> Engine {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:").unwrap())
        .await
        .unwrap();
    sqlx::query("CREATE TABLE customer (id INTEGER PRIMARY KEY, name TEXT NOT NULL, credit TEXT, code TEXT, pin TEXT, created TEXT)")
        .execute(&pool)
        .await
        .unwrap();
    Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
        .app(APP)
        .entity(CUSTOMER)
        .hooks(Delegates)
        .build()
        .await
        .unwrap()
}

fn part(kind: &str, payload: Value) -> Value {
    json!({ "id": "p1", "kind": kind, "payload": payload })
}

fn err(e: &Engine, p: Value) -> String {
    e.check_agent_part(&p).unwrap_err()
}

#[tokio::test]
async fn form_aceita_campos_avulsos_e_recusa_senha_e_arquivo() {
    let e = engine().await;
    let ok = json!({ "fields": [ { "name": "reason", "type": "text", "required": true },
                                 { "name": "who", "type": "reference", "entity": "customer" } ],
                     "values": { "reason": "atraso" }, "suggested": { "reason": "do e-mail" } });
    assert_eq!(e.check_agent_part(&part("c3.form", ok)), Ok(()));
    assert!(err(
        &e,
        part(
            "c3.form",
            json!({ "fields": [ { "name": "p", "type": "string", "writeOnly": true } ] })
        )
    )
    .contains("senha"));
    assert!(err(&e, part("c3.form", json!({ "fields": [ { "name": "f", "type": "file" } ] }))).contains("arquivo"));
    assert!(err(
        &e,
        part(
            "c3.form",
            json!({ "fields": [ { "name": "r", "type": "reference", "entity": "x" } ] })
        )
    )
    .contains("desconhecida"));
    assert!(err(
        &e,
        part(
            "c3.form",
            json!({ "fields": [ { "name": "a", "type": "string" } ], "values": { "b": 1 } })
        )
    )
    .contains("'b'"));
    assert!(err(&e, part("c3.form", json!({ "fields": [] }))).contains("fields"));
    assert!(err(&e, part("c3.html", json!({}))).contains("catálogo"));
    assert!(err(&e, json!({ "kind": "c3.form", "payload": {} })).contains("id"));
}

#[tokio::test]
async fn record_so_com_campos_que_o_usuario_editaria() {
    let e = engine().await;
    let new = json!({ "entity": "customer", "values": { "name": "Acme", "credit": "500.00", "code": "A1" }, "suggested": { "credit": "do pedido 12" } });
    assert_eq!(e.check_agent_part(&part("c3.record", new)), Ok(()));
    let edit_create_only = json!({ "entity": "customer", "id": "1", "values": { "code": "A2" } });
    assert!(err(&e, part("c3.record", edit_create_only)).contains("code"));
    assert!(err(&e, part("c3.record", json!({ "entity": "customer", "values": { "pin": "1234" } }))).contains("pin"));
    assert!(err(&e, part("c3.record", json!({ "entity": "customer", "values": { "created": "x" } }))).contains("created"));
    assert!(err(&e, part("c3.record", json!({ "entity": "customer", "values": {} }))).contains("values"));
    assert!(err(&e, part("c3.record", json!({ "entity": "nada", "values": { "a": 1 } }))).contains("desconhecida"));
    let bad_suggested = json!({ "entity": "customer", "values": { "name": "A" }, "suggested": { "credit": "x" } });
    assert!(err(&e, part("c3.record", bad_suggested)).contains("suggested"));
}

#[tokio::test]
async fn action_do_registro_com_input_conhecido() {
    let e = engine().await;
    let ok = json!({ "entity": "customer", "id": "1", "action": "block", "input": { "reason": "atraso" } });
    assert_eq!(e.check_agent_part(&part("c3.action", ok)), Ok(()));
    assert!(err(
        &e,
        part("c3.action", json!({ "entity": "customer", "id": "1", "action": "import" }))
    )
    .contains("lista"));
    assert!(err(&e, part("c3.action", json!({ "entity": "customer", "id": "1", "action": "x" }))).contains("desconhecida"));
    let extra = json!({ "entity": "customer", "id": "1", "action": "block", "input": { "other": 1 } });
    assert!(err(&e, part("c3.action", extra)).contains("other"));
}

#[tokio::test]
async fn partes_de_hitl_entram_pelo_mesmo_check() {
    let e = engine().await;
    let tool = json!({ "tool": { "name": "enviar" }, "args": { "para": "a@b.com" } });
    assert_eq!(e.check_agent_part(&part("c3.tool", tool)), Ok(()));
    let plan = json!({ "steps": [ { "id": "a", "text": "Ler" } ] });
    assert_eq!(e.check_agent_part(&part("c3.plan", plan)), Ok(()));
    let page = json!({ "url": "https://a.com", "intent": "Pagar" });
    assert_eq!(e.check_agent_part(&part("c3.browser", page)), Ok(()));
    assert!(err(&e, part("c3.browser", json!({ "url": "javascript:1", "intent": "x" }))).contains("url"));
    assert!(err(&e, part("c3.view", json!({}))).contains("fora do catálogo"));
}

#[tokio::test]
async fn resposta_do_form_valida_como_input_de_acao() {
    let e = engine().await;
    let payload = json!({ "fields": [ { "name": "reason", "type": "text", "required": true },
                                      { "name": "qty", "type": "integer", "min": 1 } ] });
    let values = |v: Value| -> Map<String, Value> { v.as_object().unwrap().clone() };
    let ok = e
        .check_agent_answer(&payload, &values(json!({ "reason": "atraso", "qty": 2 })))
        .unwrap();
    assert_eq!(Value::Object(ok), json!({ "reason": "atraso", "qty": 2 }));
    let missing = e.check_agent_answer(&payload, &values(json!({ "qty": 0 }))).unwrap_err();
    assert_eq!(missing.status.as_u16(), 422);
    let unknown = e
        .check_agent_answer(&payload, &values(json!({ "reason": "x", "zzz": 1 })))
        .unwrap_err();
    assert_eq!(unknown.status.as_u16(), 400);
}

#[test]
fn so_uma_parte_pendente_por_conversa() {
    let mut parts = vec![
        json!({ "id": "a", "kind": "c3.form", "payload": {}, "state": "submitted" }),
        json!({ "id": "b", "kind": "c3.form", "payload": {} }),
        json!({ "id": "c", "kind": "c3.form", "payload": {}, "state": "pending" }),
    ];
    assert_eq!(c3_engine::supersede_agent_parts(&mut parts), vec!["b".to_string()]);
    assert_eq!(parts[1]["state"], "cancelled");
    assert_eq!(parts[1]["reason"], "superseded");
    assert_eq!(parts[0]["state"], "submitted");
    assert!(parts[2].get("reason").is_none());
    assert!(c3_engine::supersede_agent_parts(&mut parts).is_empty());
}

#[test]
fn resposta_a_parte_fechada_ou_velha_da_409() {
    use c3_engine::check_agent_reply;
    let pending = json!({ "id": "p", "kind": "c3.form", "payload": {}, "version": 2 });
    assert!(check_agent_reply(&pending, "accept", Some(2)).is_ok());
    assert!(check_agent_reply(&pending, "decline", None).is_ok());
    assert_eq!(check_agent_reply(&pending, "accept", Some(1)).unwrap_err().status.as_u16(), 409);
    assert_eq!(check_agent_reply(&pending, "undo", None).unwrap_err().status.as_u16(), 409);
    let superseded = json!({ "id": "p", "kind": "c3.form", "payload": {}, "state": "cancelled", "reason": "superseded" });
    assert_eq!(check_agent_reply(&superseded, "accept", None).unwrap_err().status.as_u16(), 409);
    let saved = json!({ "id": "p", "kind": "c3.record", "payload": {}, "state": "submitted" });
    assert!(check_agent_reply(&saved, "undo", None).is_ok());
    assert_eq!(check_agent_reply(&saved, "zzz", None).unwrap_err().status.as_u16(), 400);
}
