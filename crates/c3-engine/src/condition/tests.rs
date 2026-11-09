//! Condições contra os casos da spec.

use serde_json::{json, Value};

use super::Condition;
use crate::spec;

/// Os mesmos casos que a shell e todo backend precisam passar (spec/v0/conformance/conditions.json).
#[test]
fn conformance_cases() {
    let suite: Value = serde_json::from_str(include_str!("../../../../spec/v0/conformance/conditions.json")).unwrap();
    let fields: Vec<Value> = suite["types"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(name, ty)| match ty.as_str().unwrap() {
            t @ ("enum" | "flags") => json!({ "name": name, "type": t, "options": suite["enumOptions"][name] }),
            "reference" => json!({ "name": name, "type": "reference", "entity": "company" }),
            t => json!({ "name": name, "type": t }),
        })
        .collect();
    let (entity, _) = spec::parse_entity(&json!({ "name": "t", "fields": fields }).to_string()).unwrap();

    let mut failures = Vec::new();
    for case in suite["cases"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let cond = Condition::parse(&case["where"], &entity).unwrap_or_else(|e| panic!("{name}: {e}"));
        let got = cond.eval(case["record"].as_object().unwrap(), &entity);
        if got != case["expected"].as_bool().unwrap() {
            failures.push(name.to_owned());
        }
    }
    assert!(failures.is_empty(), "casos divergentes: {failures:?}");
}

#[test]
fn rejects_invalid() {
    let (entity, _) =
        spec::parse_entity(r#"{"name":"t","fields":[{"name":"vip","type":"boolean"},{"name":"n","type":"string"}]}"#).unwrap();
    for bad in [
        json!({ "field": "vip", "op": "gt", "value": true }),
        json!({ "field": "nope", "op": "eq", "value": "a" }),
        json!({ "field": "n", "op": "eq", "value": 1 }),
        json!({ "field": "n", "op": "in", "value": [] }),
        json!({ "and": [] }),
        json!({ "field": "n", "op": "eq", "value": "a", "extra": 1 }),
    ] {
        assert!(Condition::parse(&bad, &entity).is_err(), "{bad} deveria falhar");
    }
}
