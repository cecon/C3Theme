//! `visibleWhen` numa seção do formulário (spec/README.md, "Seção condicional"): a seção some quando a condição
//! não vale para o registro, e tudo o que ela mostra vale como escondido. Os campos das linhas herdam a condição
//! (escondido não é validado e grava null); a lista `with_parent` vale vazia (ver `children_write::plan`).
//! O `access` da seção também passa para os campos dela (ver `access.rs`).

use serde_json::Value;

use crate::access::Access;
use crate::condition::Condition;
use crate::spec::Entity;

/// Junta o `visibleWhen` de cada seção de linhas ao `visibleWhen` dos campos dela. Recusa a condição que cita
/// campo da própria seção (escondida, ninguém mais consegue mostrá-la) e campo de seção condicional que aparece
/// em outra seção (ficaria visível e escondido ao mesmo tempo).
pub(crate) fn apply(entity: &mut Entity) -> Result<(), String> {
    let sections = entity
        .raw
        .pointer("/views/form/sections")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let names: Vec<Vec<String>> = sections.iter().map(row_fields).collect();
    for (i, s) in sections.iter().enumerate() {
        // `access` da seção vale para cada campo dela (somado ao do campo)
        let access = Access::parse(s.get("access"));
        for f in entity.fields.iter_mut().filter(|f| names[i].contains(&f.name)) {
            f.access.add(&access);
        }
        let Some(v) = s.get("visibleWhen") else { continue };
        let label = format!("{}.views.form.sections[{i}].visibleWhen", entity.name);
        let cond = Condition::parse(v, entity).map_err(|e| format!("{label}: {e}"))?;
        if let Some(f) = cited(&cond).into_iter().find(|f| names[i].contains(f)) {
            return Err(format!("{label}: cita '{f}', que está na própria seção"));
        }
        for name in &names[i] {
            if names.iter().enumerate().any(|(j, other)| j != i && other.contains(name)) {
                return Err(format!("{label}: '{name}' está numa seção condicional e também em outra seção"));
            }
            let Some(f) = entity.fields.iter_mut().find(|f| &f.name == name) else {
                continue;
            };
            f.visible_when = Some(match f.visible_when.take() {
                Some(own) => Condition::And(vec![cond.clone(), own]),
                None => cond.clone(),
            });
        }
    }
    Ok(())
}

fn row_fields(section: &Value) -> Vec<String> {
    let rows = section.get("rows").and_then(Value::as_array);
    rows.into_iter()
        .flatten()
        .filter_map(Value::as_array)
        .flatten()
        .filter_map(|item| item.as_str().or_else(|| item.get("field").and_then(Value::as_str)))
        .map(str::to_owned)
        .collect()
}

/// Campos citados numa condição.
fn cited(c: &Condition) -> Vec<String> {
    match c {
        Condition::And(list) | Condition::Or(list) => list.iter().flat_map(cited).collect(),
        Condition::Not(inner) => cited(inner),
        Condition::Leaf { field, .. } => vec![field.clone()],
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::spec;

    fn entity(sections: serde_json::Value) -> Result<spec::Entity, String> {
        let raw = json!({
            "specVersion": "0", "name": "p", "label": { "singular": "P", "plural": "Ps" },
            "fields": [{ "name": "nome", "type": "string" }, { "name": "fornecedor", "type": "boolean" },
                       { "name": "prazo", "type": "integer", "visibleWhen": { "field": "nome", "op": "null", "value": false } }],
            "views": { "form": { "sections": sections } }
        });
        let (mut e, pending) = spec::parse_entity(&raw.to_string())?;
        spec::resolve_entity(&mut e, pending)?;
        super::apply(&mut e)?;
        Ok(e)
    }

    #[test]
    fn campo_herda_a_condicao_da_secao_junto_com_a_propria() {
        let when = json!({ "field": "fornecedor", "op": "eq", "value": true });
        let e = entity(json!([{ "rows": [["nome", "fornecedor"]] }, { "visibleWhen": when, "rows": [["prazo"]] }])).unwrap();
        let prazo = e.field("prazo").unwrap().visible_when.as_ref().unwrap();
        let rec = |f: bool, nome: &str| json!({ "fornecedor": f, "nome": nome }).as_object().unwrap().clone();
        assert!(prazo.eval(&rec(true, "x"), &e));
        assert!(!prazo.eval(&rec(false, "x"), &e), "seção escondida");
        assert!(!prazo.eval(&rec(true, ""), &e), "a condição do campo continua valendo");
    }

    #[test]
    fn recusa_condicao_sobre_a_propria_secao_e_campo_repetido() {
        let when = json!({ "field": "fornecedor", "op": "eq", "value": true });
        let own = entity(json!([{ "visibleWhen": when, "rows": [["fornecedor", "prazo"]] }])).unwrap_err();
        assert!(own.contains("própria seção"), "{own}");
        let twice = entity(json!([{ "rows": [["fornecedor", "prazo"]] }, { "visibleWhen": when, "rows": [["prazo"]] }])).unwrap_err();
        assert!(twice.contains("também em outra seção"), "{twice}");
    }
}
