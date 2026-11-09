//! Consulta do sistema (`source: "system"`): a entidade não tem tabela; as linhas vêm de um SELECT que o sistema monta
//! com os parâmetros pedidos antes (`Hooks::source`). Os parâmetros são uma entidade sem tabela, como o input de ação;
//! `default` pode ser data relativa (`{"$date": "today"}`), resolvida a cada pedido.

use serde::Deserialize;
use serde_json::{Map, Value};

use crate::field::{parse_fields, RawField};
use crate::relative_date::is_relative;
use crate::spec::{resolve_conditions, Entity};

#[derive(Debug, Clone)]
pub struct Source {
    /// Os parâmetros (`params.fields`); a consulta recebe todos, no formato trafegado.
    pub params: Entity,
    /// `default` relativo de cada parâmetro (nome, valor cru), resolvido pelo relógio do sistema.
    pub relative_defaults: Vec<(String, Map<String, Value>)>,
}

#[derive(Deserialize, Default)]
pub(crate) struct RawParams {
    #[serde(default)]
    fields: Vec<Value>,
}

pub(crate) fn parse_source(
    name: &str,
    source: Option<String>,
    params: Option<RawParams>,
    ident: &dyn Fn(&str) -> bool,
) -> Result<Option<Box<Source>>, String> {
    match source.as_deref() {
        None if params.is_some() => return Err(format!("{name}: params só vale com source 'system'")),
        None => return Ok(None),
        Some("system") => {}
        Some(other) => return Err(format!("{name}: source '{other}' desconhecido (só 'system')")),
    }
    let label = format!("{name}.params");
    let mut relative_defaults = Vec::new();
    let mut raw = Vec::new();
    for mut f in params.unwrap_or_default().fields {
        if let Some(Value::Object(rel)) = f.get("default").filter(|d| d.as_object().is_some_and(is_relative)) {
            let field = f.get("name").and_then(Value::as_str).unwrap_or_default().to_owned();
            if !matches!(f.get("type").and_then(Value::as_str), Some("date" | "datetime")) {
                return Err(format!("{label}.{field}: default relativo só em date ou datetime"));
            }
            relative_defaults.push((field, rel.clone()));
            f.as_object_mut().map(|o| o.remove("default"));
        }
        raw.push(serde_json::from_value::<RawField>(f).map_err(|e| format!("{label}: {e}"))?);
    }
    let (fields, conditions) = parse_fields(&label, raw, ident)?;
    if let Some(f) = fields.iter().find(|f| f.only_for_records()) {
        return Err(format!(
            "{label}: '{}' não pode ser readOnly, createOnly nem ter filter ou access",
            f.name
        ));
    }
    let mut params = Entity::fields_only(label, fields);
    resolve_conditions(&mut params, conditions)?;
    Ok(Some(Box::new(Source { params, relative_defaults })))
}
