//! Filtro no reference (spec/README.md, "Filtro no reference"): `filter` num campo reference é uma condição sobre
//! a entidade apontada. A lista de opções da shell e a validação do backend usam a mesma condição, então a
//! opção que não vale nem aparece, e a que vier mesmo assim é 422 `not_allowed`.
//!
//! O valor de uma folha pode ser `{"$field": "cliente_id"}`: o valor desse campo no registro de quem aponta (ou
//! `id`, o próprio registro). Vazio, a folha não restringe nada (no registro novo, `id ne {"$field": "id"}` vale
//! para todos); por isso a variável não entra em `not`, `in`, `contains` nem `null`.

use serde_json::{Map, Value};

use crate::condition::Condition;
use crate::spec::{Entity, Field, FieldType};
use crate::value;

const VAR: &str = "$field";

/// Boot: o filtro do campo `f` de `source`, que aponta para `target`, é uma condição válida sobre `target`, e
/// cada variável cita um campo de `source` do mesmo tipo do campo filtrado.
pub(crate) fn check(source: &Entity, f: &Field, target: &Entity) -> Result<(), String> {
    let Some(raw) = &f.ref_filter else { return Ok(()) };
    let label = format!("{}.{}.filter", source.name, f.name);
    check_vars(raw, source, target, false).map_err(|e| format!("{label}: {e}"))?;
    if let Some(fixed) = resolve(raw, &Map::new()) {
        Condition::parse(&fixed, target).map_err(|e| format!("{label}: {e}"))?;
    }
    Ok(())
}

fn check_vars(c: &Value, source: &Entity, target: &Entity, negated: bool) -> Result<(), String> {
    for key in ["and", "or"] {
        if let Some(items) = c.get(key).and_then(Value::as_array) {
            return items.iter().try_for_each(|i| check_vars(i, source, target, negated));
        }
    }
    if let Some(inner) = c.get("not") {
        return check_vars(inner, source, target, true);
    }
    let Some(var) = c.get("value").and_then(|v| v.get(VAR)) else {
        return Ok(());
    };
    let var = var.as_str().ok_or("'$field' precisa ser o nome de um campo")?;
    let name = c.get("field").and_then(Value::as_str).unwrap_or_default();
    let op = c.get("op").and_then(Value::as_str).unwrap_or_default();
    if negated {
        return Err(format!("'$field' não vale dentro de 'not' (use 'ne'): '{name}'"));
    }
    if !["eq", "ne", "lt", "lte", "gt", "gte"].contains(&op) {
        return Err(format!("'$field' só vale com eq, ne, lt, lte, gt e gte: '{name}' usa '{op}'"));
    }
    let t = target.condition_field(name).ok_or_else(|| format!("campo inexistente '{name}'"))?;
    let s = source
        .condition_field(var)
        .ok_or_else(|| format!("'$field' cita campo inexistente '{var}'"))?;
    let points = |f: &Field, owner: &Entity| f.reference.clone().unwrap_or_else(|| owner.name.clone());
    let same = s.ty == t.ty && (t.ty != FieldType::Reference || points(s, source) == points(t, target));
    let ordered = matches!(
        t.ty,
        FieldType::Integer | FieldType::Decimal | FieldType::Date | FieldType::Datetime
    );
    if !same {
        return Err(format!(
            "'{var}' e '{name}' precisam ser do mesmo tipo (e apontar para a mesma entidade)"
        ));
    }
    if op.starts_with(['l', 'g']) && !ordered {
        return Err(format!("operador '{op}' não vale para '{name}'"));
    }
    Ok(())
}

/// A condição concreta para o registro de quem aponta: variáveis trocadas pelo valor, folhas com variável vazia
/// tiradas. `None` = nada restringe.
pub(crate) fn resolve(c: &Value, record: &Map<String, Value>) -> Option<Value> {
    if let Some(items) = c.get("and").and_then(Value::as_array) {
        let kept: Vec<_> = items.iter().filter_map(|i| resolve(i, record)).collect();
        return (!kept.is_empty()).then(|| serde_json::json!({ "and": kept }));
    }
    if let Some(items) = c.get("or").and_then(Value::as_array) {
        // uma alternativa sem restrição libera tudo
        let kept: Option<Vec<_>> = items.iter().map(|i| resolve(i, record)).collect();
        return kept.map(|k| serde_json::json!({ "or": k }));
    }
    if let Some(inner) = c.get("not") {
        return resolve(inner, record).map(|i| serde_json::json!({ "not": i }));
    }
    let Some(var) = c.get("value").and_then(|v| v.get(VAR)).and_then(Value::as_str) else {
        return Some(c.clone());
    };
    let v = match record.get(var) {
        Some(Value::Object(o)) => o.get("id").cloned(), // reference lido vem { id, title }
        other => other.cloned(),
    };
    if value::is_empty(v.as_ref()) {
        return None;
    }
    let mut leaf = c.clone();
    leaf["value"] = v.unwrap();
    Some(leaf)
}

/// O filtro do campo para este registro, já como condição sobre `target`. Valor do registro fora do formato
/// (que já é erro do próprio campo) não filtra.
pub(crate) fn condition(f: &Field, record: &Map<String, Value>, target: &Entity) -> Option<Condition> {
    let raw = resolve(f.ref_filter.as_ref()?, record)?;
    Condition::parse(&raw, target).ok()
}
