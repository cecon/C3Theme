//! Datas relativas: os casos de spec/v0/conformance/relative-dates.json (os mesmos que o adaptador em memória do
//! @c3theme/engine roda), mais o que só existe aqui.

use serde_json::{json, Value};

use super::{days, resolve, Clock};
use crate::spec::{self, Entity};

fn entity() -> Entity {
    let def = json!({ "name": "t", "fields": [
        { "name": "date", "type": "date" },
        { "name": "datetime", "type": "datetime" },
        { "name": "string", "type": "string" }
    ]});
    spec::parse_entity(&def.to_string()).unwrap().0
}

/// `YYYY-MM-DDTHH:MM:SSZ` em segundos desde 1970.
fn instant(s: &str) -> i64 {
    let n = |r: std::ops::Range<usize>| s[r].parse::<i64>().unwrap();
    days(n(0..4), n(5..7), n(8..10)) * 86_400 + n(11..13) * 3_600 + n(14..16) * 60 + n(17..19)
}

#[test]
fn conformidade() {
    let suite: Value = serde_json::from_str(include_str!("../../../spec/v0/conformance/relative-dates.json")).unwrap();
    let entity = entity();
    for case in suite["cases"].as_array().unwrap() {
        let c = &case["clock"];
        let clock = Clock {
            now: instant(c["now"].as_str().unwrap()),
            utc_offset_minutes: c["utcOffsetMinutes"].as_i64().unwrap() as i32,
            today: c["today"].as_str().map(String::from),
        };
        // o tipo do caso é o nome do campo na entidade de teste
        let cond = json!({ "and": [{ "field": case["type"], "op": case["op"], "value": case["value"] }] });
        let got = resolve(&cond, &entity, &clock).map(|c| c["and"][0]["value"].clone());
        if case["error"] == json!(true) {
            assert!(got.is_err(), "devia recusar: {case}");
        } else {
            assert_eq!(got.unwrap(), case["expected"], "{case}");
        }
    }
}

#[test]
fn valor_comum_passa_igual() {
    let clock = Clock {
        now: 0,
        utc_offset_minutes: 0,
        today: None,
    };
    let cond = json!({ "not": { "field": "date", "op": "eq", "value": "2026-01-01" } });
    assert_eq!(resolve(&cond, &entity(), &clock).unwrap(), cond);
}
