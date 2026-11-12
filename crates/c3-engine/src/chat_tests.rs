//! Regras puras do pedido de chat: conversa, limite e corpos.

use serde_json::{json, Map, Value};

use super::*;

fn obj(v: Value) -> Map<String, Value> {
    v.as_object().unwrap().clone()
}

#[test]
fn conversa_e_limite() {
    for ok in ["assistant", "a", "Conv_1-x", &"a".repeat(64)] {
        assert!(check_conversation(ok).is_ok(), "{ok}");
    }
    for bad in ["", "com espaço", "a/b", "ç", &"a".repeat(65)] {
        assert!(check_conversation(bad).is_err(), "{bad}");
    }
    assert_eq!(parse_limit(None).unwrap(), 30);
    assert_eq!(parse_limit(Some("1")).unwrap(), 1);
    assert_eq!(parse_limit(Some("100")).unwrap(), 100);
    for bad in ["0", "101", "x", "-1"] {
        assert!(parse_limit(Some(bad)).is_err(), "{bad}");
    }
    assert!(check_id("m1", "Mensagem").is_ok());
    assert_eq!(check_id("", "Parte").unwrap_err().body()["message"], "Parte vazio.");
}

#[test]
fn envio_exige_client_id_e_texto() {
    let part = json!({ "messageId": "m1", "partId": "p1", "kind": "c3.form", "version": 2 });
    let out = parse_outgoing(&obj(
        json!({ "clientId": "c1", "text": "oi", "replyTo": "m0", "pendingPart": part }),
    ))
    .unwrap();
    assert_eq!(
        out,
        Outgoing {
            client_id: "c1".into(),
            text: "oi".into(),
            reply_to: Some("m0".into()),
            pending_part: Some(part),
            steer: false,
        }
    );
    let plain = parse_outgoing(&obj(json!({ "clientId": "c1", "text": "oi", "replyTo": null }))).unwrap();
    assert_eq!((plain.reply_to, plain.pending_part), (None, None));
    let msg = |v: Value| parse_outgoing(&obj(v)).unwrap_err().body()["message"].as_str().unwrap().to_owned();
    assert_eq!(msg(json!({ "text": "oi" })), "clientId é obrigatório.");
    assert_eq!(msg(json!({ "clientId": "c1" })), "text é obrigatório.");
    assert_eq!(
        msg(json!({ "clientId": "c1", "text": "" })),
        "text precisa ser texto de 1 a 20000 caracteres."
    );
    assert!(parse_outgoing(&obj(json!({ "clientId": "c1", "text": "x".repeat(MAX_TEXT) }))).is_ok());
    assert!(parse_outgoing(&obj(json!({ "clientId": "c1", "text": "x".repeat(MAX_TEXT + 1) }))).is_err());
    assert!(parse_outgoing(&obj(json!({ "clientId": "x".repeat(101), "text": "oi" }))).is_err());
    assert_eq!(
        msg(json!({ "clientId": "c1", "text": "oi", "files": [] })),
        "'files' não vale no envio."
    );
    assert_eq!(
        msg(json!({ "clientId": "c1", "text": "oi", "pendingPart": { "messageId": "m1", "partId": "p1" } })),
        "pendingPart precisa de messageId, partId e kind."
    );
    assert!(parse_outgoing(&obj(json!({ "clientId": "c1", "text": "oi", "pendingPart": "p1" }))).is_err());
}

#[test]
fn envio_que_orienta() {
    let steer = |v: Value| parse_outgoing(&obj(json!({ "clientId": "c1", "text": "oi", "steer": v })));
    assert!(steer(json!(true)).unwrap().steer);
    assert!(!steer(json!(false)).unwrap().steer);
    assert!(!steer(Value::Null).unwrap().steer);
    assert_eq!(
        steer(json!("sim")).unwrap_err().body()["message"],
        "steer precisa ser verdadeiro ou falso."
    );
}

#[test]
fn resposta_de_pergunta_e_de_parte() {
    let a = obj(json!({ "optionIds": ["a"], "text": "x", "dismissed": false }));
    assert_eq!(parse_answer(a.clone()).unwrap(), a);
    assert!(parse_answer(Map::new()).is_ok());
    for bad in [
        json!({ "optionIds": [1] }),
        json!({ "optionIds": "a" }),
        json!({ "text": 1 }),
        json!({ "dismissed": "sim" }),
        json!({ "outro": 1 }),
    ] {
        assert!(parse_answer(obj(bad.clone())).is_err(), "{bad}");
    }
    for action in ["accept", "decline", "cancel", "undo"] {
        let ok = obj(json!({ "action": action, "values": {}, "version": 3, "reason": "r" }));
        assert_eq!(parse_ui_answer(ok.clone()).unwrap(), ok);
    }
    for bad in [
        json!({}),
        json!({ "action": "talvez" }),
        json!({ "action": "accept", "values": [] }),
        json!({ "action": "accept", "version": "1" }),
        json!({ "action": "accept", "version": -1 }),
        json!({ "action": "decline", "reason": 1 }),
    ] {
        assert!(parse_ui_answer(obj(bad.clone())).is_err(), "{bad}");
    }
}
