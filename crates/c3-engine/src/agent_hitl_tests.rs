use serde_json::{json, Value};

use super::*;

fn obj(v: Value) -> Obj {
    v.as_object().unwrap().clone()
}

fn err(r: Result<(), String>) -> String {
    r.expect_err("devia recusar")
}

fn tool() -> Value {
    json!({ "tool": { "name": "enviar_email", "label": "Enviar e-mail", "description": "Cobra." },
            "args": { "para": "a@b.com", "copias": 1 },
            "fields": [ { "name": "para", "type": "string", "required": true, "label": "Para" },
                        { "name": "modo", "type": "enum", "options": [ { "value": "a", "label": "A" } ], "readOnly": false } ],
            "risk": "medium", "allow": { "edit": true, "always": false } })
}

#[test]
fn tool_valida() {
    assert_eq!(check_tool(&obj(tool())), Ok(()));
    assert_eq!(check_tool(&obj(json!({ "tool": { "name": "t" }, "args": {} }))), Ok(()));
}

#[test]
fn tool_recusa() {
    let with = |k: &str, v: Value| {
        let mut t = obj(tool());
        t.insert(k.into(), v);
        check_tool(&t)
    };
    assert!(err(with("extra", json!(1))).contains("'extra' desconhecida"));
    assert!(err(with("tool", json!("x"))).contains("precisa de tool"));
    assert!(err(with("tool", json!({ "name": " " }))).contains("'name'"));
    assert!(err(with("tool", json!({ "name": "x".repeat(129) }))).contains("'name'"));
    assert!(err(with("tool", json!({ "name": "t", "label": 1 }))).contains("'label'"));
    assert!(err(with("tool", json!({ "name": "t", "description": "x".repeat(1001) }))).contains("'description'"));
    assert!(err(with("tool", json!({ "name": "t", "x": 1 }))).contains("tool: chave 'x'"));
    assert!(err(with("args", json!([]))).contains("args"));
    assert!(err(with("fields", json!("x"))).contains("'fields'"));
    assert!(err(with("fields", json!(vec![json!({ "name": "a", "type": "string" }); 51]))).contains("até 50"));
    assert!(err(with("fields", json!([1]))).contains("objeto"));
    assert!(err(with("fields", json!([{ "name": "a", "type": "date" }]))).contains("type fora"));
    assert!(err(with("fields", json!([{ "name": "a" }]))).contains("type fora"));
    assert!(err(with("fields", json!([{ "type": "string" }]))).contains("'name'"));
    assert!(err(with("fields", json!([{ "name": "a", "type": "string", "required": "sim" }]))).contains("required e readOnly"));
    assert!(err(with("fields", json!([{ "name": "a", "type": "string", "readOnly": 1 }]))).contains("required e readOnly"));
    assert!(err(with(
        "fields",
        json!([{ "name": "a", "type": "enum", "options": [{ "label": "x" }] }])
    ))
    .contains("opção"));
    assert!(err(with("fields", json!([{ "name": "a", "type": "enum", "options": ["x"] }]))).contains("opção"));
    assert!(err(with("fields", json!([{ "name": "a", "type": "string", "label": 3 }]))).contains("'label'"));
    assert!(err(with("fields", json!([{ "name": "a", "type": "string", "x": 3 }]))).contains("campo: chave 'x'"));
    assert!(err(with("risk", json!("max"))).contains("risk"));
    assert!(err(with("allow", json!(true))).contains("allow precisa"));
    assert!(err(with("allow", json!({ "reorder": true }))).contains("allow: chave 'reorder'"));
    assert!(err(with("allow", json!({ "edit": "sim" }))).contains("allow.edit"));
}

fn plan() -> Value {
    json!({ "title": "Fechar", "steps": [ { "id": "a", "text": "Ler", "detail": "120", "required": true }, { "id": "b", "text": "Gravar" } ],
            "allow": { "reorder": false } })
}

#[test]
fn plan_valida() {
    assert_eq!(check_plan(&obj(plan())), Ok(()));
}

#[test]
fn plan_recusa() {
    let with = |k: &str, v: Value| {
        let mut p = obj(plan());
        p.insert(k.into(), v);
        check_plan(&p)
    };
    assert!(err(with("x", json!(1))).contains("chave 'x'"));
    assert!(err(with("title", json!("x".repeat(201)))).contains("'title'"));
    assert!(err(with("steps", json!([]))).contains("precisa de steps"));
    assert!(err(check_plan(&obj(json!({})))).contains("precisa de steps"));
    assert!(err(with("steps", json!([1]))).contains("objeto"));
    assert!(err(with("steps", json!([{ "id": "a" }]))).contains("'text'"));
    assert!(err(with("steps", json!([{ "text": "a" }]))).contains("'id'"));
    assert!(err(with("steps", json!([{ "id": "a", "text": "x".repeat(501) }]))).contains("'text'"));
    assert!(err(with("steps", json!([{ "id": "a", "text": "a", "detail": 1 }]))).contains("'detail'"));
    assert!(err(with("steps", json!([{ "id": "a", "text": "a", "required": "s" }]))).contains("required"));
    assert!(err(with("steps", json!([{ "id": "a", "text": "a", "y": 1 }]))).contains("chave 'y'"));
    assert!(err(with("steps", json!([{ "id": "a", "text": "a" }, { "id": "a", "text": "b" }]))).contains("'a' repetido"));
    assert!(err(with("allow", json!({ "always": true }))).contains("chave 'always'"));
}

fn page() -> Value {
    json!({ "url": "https://banco.example.com/pagar", "title": "Pagar", "frame": "data:image/png;base64,AAA", "intent": "Pagar o boleto",
            "target": { "x": 0, "y": 100 }, "risk": "high", "allowTakeover": false })
}

#[test]
fn browser_valida() {
    assert_eq!(check_browser(&obj(page())), Ok(()));
    assert_eq!(
        check_browser(&obj(json!({ "url": "HTTP://a.com", "intent": "x", "frame": "https://cdn/x.jpg" }))),
        Ok(())
    );
}

#[test]
fn browser_recusa() {
    let with = |k: &str, v: Value| {
        let mut p = obj(page());
        p.insert(k.into(), v);
        check_browser(&p)
    };
    assert!(err(with("x", json!(1))).contains("chave 'x'"));
    for bad in [
        json!("javascript:alert(1)"),
        json!("https://"),
        json!("ftp://a"),
        json!(3),
        json!("hé://ação.com"),
    ] {
        assert!(err(with("url", bad)).contains("url"));
    }
    for bad in [json!("data:text/html;base64,AAA"), json!("data:image/svg+xml;base64,AAA"), json!(1)] {
        assert!(err(with("frame", bad)).contains("frame"));
    }
    assert!(err(with("intent", json!(""))).contains("'intent'"));
    assert!(err(with("title", json!(1))).contains("'title'"));
    for bad in [
        json!({ "x": 101, "y": 1 }),
        json!({ "x": -1, "y": 1 }),
        json!({ "x": 1 }),
        json!({ "x": 1, "y": 1, "z": 1 }),
        json!("1"),
    ] {
        assert!(err(with("target", bad)).contains("target"));
    }
    assert!(err(with("allowTakeover", json!("sim"))).contains("allowTakeover"));
    assert!(err(with("risk", json!(1))).contains("risk"));
}

#[test]
fn endereco_e_captura() {
    assert!(is_web_url("https://a"));
    assert!(!is_web_url("http://"));
    assert!(!is_web_url("httpsé://a"));
    for t in ["png", "jpeg", "webp", "gif"] {
        assert!(is_frame(&format!("data:image/{t};base64,A")));
    }
    assert!(!is_frame("data:image/png,A"));
    assert!(is_frame("/capturas/1.png"));
    assert!(!is_frame("//outro.com/x.png"));
    assert!(!is_frame("/\\outro.com"));
}
