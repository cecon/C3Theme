//! `rowAccess` (spec/README.md, "Permissão por linha, seção e campo"): as linhas que cada código de permissão
//! enxerga. O usuário vê a união dos `where` dos códigos que tem, em toda leitura (entra junto do escopo de filial,
//! em `Ctx::read_scope`), e só grava registro que fica dentro dela (403). Um valor `{"$user": chave}` vem do
//! usuário logado (`Hooks::user_value`): "só os pedidos do vendedor".

use serde_json::{json, Map, Value};

use crate::condition::Condition;
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::Entity;
use crate::value::SqlValue;

/// Um item de `rowAccess`: quem tem `permission` vê as linhas de `where`.
#[derive(Debug, Clone)]
pub struct RowRule {
    pub permission: String,
    /// O `where` como veio; com `$user`, resolvido a cada requisição.
    raw: Value,
    /// Já interpretado, quando não cita o usuário.
    fixed: Option<Condition>,
}

/// Recebe a folha com `$user` e a chave citada; devolve a folha nova (`None` anula a condição).
type UserLeaf<'a> = dyn FnMut(&Map<String, Value>, &str) -> Option<Value> + 'a;

/// Operadores em que `$user` faz sentido (igual, diferente, um de vários).
const USER_OPS: [&str; 3] = ["eq", "ne", "in"];

pub(crate) fn parse_rows(entity: &Entity) -> Result<Vec<RowRule>, String> {
    let rules = entity.raw.get("rowAccess").and_then(Value::as_array);
    let mut out = Vec::new();
    for (i, r) in rules.into_iter().flatten().enumerate() {
        let label = format!("{}.rowAccess[{i}]", entity.name);
        let permission = r
            .get("permission")
            .and_then(Value::as_str)
            .ok_or(format!("{label}: falta permission"))?;
        let raw = r.get("where").cloned().unwrap_or(Value::Null);
        // no boot, cada folha com `$user` vira "campo vazio" só para conferir o resto (campo, tipo, operadores)
        let (mut cites_user, mut bad_op) = (false, false);
        let probe = map_user_leaves(&raw, &mut |leaf, _| {
            cites_user = true;
            bad_op |= !USER_OPS.contains(&leaf.get("op").and_then(Value::as_str).unwrap_or_default());
            Some(json!({ "field": leaf.get("field"), "op": "null", "value": true }))
        });
        if bad_op {
            return Err(format!("{label}.where: $user só vale com eq, ne e in"));
        }
        let cond = Condition::parse(&probe.unwrap_or_default(), entity).map_err(|e| format!("{label}.where: {e}"))?;
        out.push(RowRule {
            permission: permission.to_owned(),
            raw,
            fixed: (!cites_user).then_some(cond),
        });
    }
    Ok(out)
}

/// Copia a condição passando cada folha cujo valor é `{"$user": chave}` por `f`, que devolve a folha nova ou
/// `None`, e aí a condição inteira é `None`.
fn map_user_leaves(c: &Value, f: &mut UserLeaf<'_>) -> Option<Value> {
    let Some(obj) = c.as_object() else { return Some(c.clone()) };
    for k in ["and", "or"] {
        if let Some(Value::Array(list)) = obj.get(k) {
            let items = list.iter().map(|i| map_user_leaves(i, f)).collect::<Option<Vec<_>>>()?;
            return Some(json!({ k: items }));
        }
    }
    if let Some(inner) = obj.get("not") {
        return Some(json!({ "not": map_user_leaves(inner, f)? }));
    }
    match obj.get("value").and_then(|v| v.get("$user")).and_then(Value::as_str) {
        Some(key) => f(obj, key),
        None => Some(c.clone()),
    }
}

impl RowRule {
    /// A condição para o usuário da requisição; `None` = não vê nenhuma linha por esta regra (sem o valor do
    /// usuário, ou valor que não serve para o campo: aí também avisa no log, é erro do sistema).
    fn condition(&self, ctx: &Ctx<'_>, entity: &Entity) -> Option<Condition> {
        if let Some(c) = &self.fixed {
            return Some(c.clone());
        }
        let resolved = map_user_leaves(&self.raw, &mut |leaf, key| {
            let v = ctx.engine.0.hooks.user_value(key, ctx.req).filter(|v| !v.is_null())?;
            let mut leaf = leaf.clone();
            leaf.insert("value".into(), v);
            Some(Value::Object(leaf))
        })?;
        Condition::parse(&resolved, entity)
            .map_err(|e| {
                eprintln!(
                    "c3-engine: {}.rowAccess ({}): valor de $user inválido: {e}",
                    entity.name, self.permission
                )
            })
            .ok()
    }
}

/// `rowAccess` como SQL sobre `alias`, com os valores literais (entra junto do escopo de filial, em subconsultas).
/// `None` = entidade sem `rowAccess`; sem nenhum código, nenhuma linha.
pub(crate) fn row_filter(ctx: &Ctx<'_>, entity: &Entity, alias: &str) -> Option<String> {
    let rules = ctx.engine.0.row_access.get(&entity.name).filter(|r| !r.is_empty())?;
    let parts: Vec<String> = rules
        .iter()
        .filter(|r| ctx.permitted(&r.permission))
        .filter_map(|r| r.condition(ctx, entity))
        .map(|c| literal_sql(&c, alias))
        .collect();
    Some(if parts.is_empty() {
        "0".into()
    } else {
        format!("({})", parts.join(" OR "))
    })
}

/// O registro gravado (no formato trafegado) fica dentro do `rowAccess` do usuário? Fora dele, 403: ele não
/// enxergaria o que acabou de gravar.
pub(crate) fn check_row(ctx: &Ctx<'_>, entity: &Entity, record: &Map<String, Value>) -> Result<(), ApiError> {
    let Some(rules) = ctx.engine.0.row_access.get(&entity.name).filter(|r| !r.is_empty()) else {
        return Ok(());
    };
    let inside = |r: &RowRule| ctx.permitted(&r.permission) && r.condition(ctx, entity).is_some_and(|c| c.eval(record, entity));
    if rules.iter().any(inside) {
        return Ok(());
    }
    Err(ApiError {
        message: "Você não tem permissão para gravar um registro assim.".into(),
        ..ApiError::forbidden()
    })
}

/// O SQL da condição com cada `?` trocado pelo valor literal. O SQL gerado só tem identificadores e `?`; todo
/// texto vem dos parâmetros, então trocar em ordem é seguro.
fn literal_sql(c: &Condition, alias: &str) -> String {
    let mut params = Vec::new();
    let sql = c.to_sql(alias, &mut params);
    let mut values = params.into_iter();
    let mut out = String::with_capacity(sql.len());
    for ch in sql.chars() {
        match ch {
            '?' => out.push_str(&match values.next() {
                Some(SqlValue::Int(n)) => n.to_string(),
                Some(SqlValue::Text(t)) => format!("'{}'", t.replace('\'', "''")),
                _ => "NULL".into(),
            }),
            c => out.push(c),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::spec;

    fn entity() -> Entity {
        let fields = json!([{ "name": "name", "type": "string" }, { "name": "age", "type": "integer" }]);
        spec::parse_entity(&json!({ "name": "t", "fields": fields }).to_string()).unwrap().0
    }

    #[test]
    fn literal_sql_troca_cada_parametro_e_escapa_aspas() {
        let where_ = json!({ "and": [
            { "field": "name", "op": "eq", "value": "D'Ávila ?" },
            { "field": "age", "op": "gte", "value": 18 }
        ] });
        let sql = literal_sql(&Condition::parse(&where_, &entity()).unwrap(), "t");
        assert!(sql.contains("'D''Ávila ?'"), "{sql}");
        assert!(sql.contains("18"), "{sql}");
        assert_eq!(sql.matches('?').count(), 1, "só o ? de dentro do texto sobra: {sql}");
    }

    fn rule(where_: Value) -> Result<Vec<RowRule>, String> {
        let mut e = entity();
        e.raw = json!({ "rowAccess": [{ "permission": "p", "where": where_ }] });
        parse_rows(&e)
    }

    #[test]
    fn user_no_boot_confere_campo_e_operador() {
        let user = json!({ "$user": "k" });
        let ok = rule(json!({ "not": { "field": "age", "op": "in", "value": user } })).unwrap();
        assert!(ok[0].fixed.is_none(), "cita o usuário: resolve por requisição");
        assert!(rule(json!({ "field": "age", "op": "gt", "value": user }))
            .unwrap_err()
            .contains("eq, ne e in"));
        assert!(rule(json!({ "field": "nope", "op": "eq", "value": user })).is_err());
        assert!(rule(json!({ "field": "age", "op": "eq", "value": 1 })).unwrap()[0].fixed.is_some());
    }

    #[test]
    fn sem_valor_do_usuario_a_regra_inteira_cai() {
        let c = json!({ "or": [{ "field": "age", "op": "eq", "value": 1 }, { "field": "age", "op": "eq", "value": { "$user": "k" } }] });
        assert_eq!(map_user_leaves(&c, &mut |_, _| None), None, "nunca alarga: sem o valor, nada");
        let got = map_user_leaves(&c, &mut |leaf, _| {
            let mut l = leaf.clone();
            l.insert("value".into(), json!(7));
            Some(Value::Object(l))
        });
        assert_eq!(got.unwrap()["or"][1]["value"], json!(7));
    }
}
