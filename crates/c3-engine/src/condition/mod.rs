//! Condições da spec (spec/README.md#condições): parse validado contra a entidade,
//! avaliação em memória (visibleWhen/requiredWhen) e tradução para SQL (listagem).
//!
//! As duas implementações precisam concordar com spec/v0/conformance/conditions.json,
//! inclusive em campo vazio: `ne` é verdadeiro e o resto é falso. Por isso cada folha SQL
//! devolve sempre 0 ou 1, nunca NULL, e `NOT` funciona igual nos dois lados.

use serde_json::{Map, Value};

use crate::spec::{Entity, Field, FieldType};
use crate::value::{self, SqlValue};

mod sql;

pub use sql::contains_pattern;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Op {
    Eq,
    Ne,
    Lt,
    Lte,
    Gt,
    Gte,
    In,
    Contains,
    Null,
}

impl Op {
    fn parse(s: &str) -> Option<Op> {
        Some(match s {
            "eq" => Op::Eq,
            "ne" => Op::Ne,
            "lt" => Op::Lt,
            "lte" => Op::Lte,
            "gt" => Op::Gt,
            "gte" => Op::Gte,
            "in" => Op::In,
            "contains" => Op::Contains,
            "null" => Op::Null,
            _ => return None,
        })
    }

    fn allowed(self, ty: FieldType) -> bool {
        use FieldType::*;
        match self {
            Op::Eq | Op::Ne | Op::Null => self == Op::Null || ty != File,
            Op::Lt | Op::Lte | Op::Gt | Op::Gte => {
                matches!(ty, Integer | Decimal | Date | Datetime)
            }
            Op::In => !matches!(ty, Boolean | File),
            Op::Contains => ty.is_textual(),
        }
    }
}

#[derive(Debug, Clone)]
pub enum Condition {
    And(Vec<Condition>),
    Or(Vec<Condition>),
    Not(Box<Condition>),
    Leaf {
        field: String,
        /// Coluna INTEGER: vazio é só NULL.
        int_col: bool,
        op: Op,
        /// Valores já convertidos para a coluna (um só, exceto em `in`). Vazio em `null` e `contains`.
        values: Vec<SqlValue>,
        /// `null`: true/false. `contains`: o texto procurado.
        arg: Value,
    },
}

impl Condition {
    pub fn parse(v: &Value, entity: &Entity) -> Result<Condition, String> {
        let obj = v.as_object().ok_or("condição precisa ser um objeto")?;
        let list = |items: &Value| -> Result<Vec<Condition>, String> {
            let items = items
                .as_array()
                .filter(|a| !a.is_empty())
                .ok_or("and/or precisam de uma lista não vazia")?;
            items.iter().map(|c| Condition::parse(c, entity)).collect()
        };
        if obj.len() == 1 {
            if let Some(items) = obj.get("and") {
                return Ok(Condition::And(list(items)?));
            }
            if let Some(items) = obj.get("or") {
                return Ok(Condition::Or(list(items)?));
            }
            if let Some(inner) = obj.get("not") {
                return Ok(Condition::Not(Box::new(Condition::parse(inner, entity)?)));
            }
        }
        if obj.len() != 3 {
            return Err("condição deve ser {and}, {or}, {not} ou {field, op, value}".into());
        }
        let name = obj.get("field").and_then(Value::as_str).ok_or("'field' ausente")?;
        let field = entity.condition_field(name).ok_or_else(|| format!("campo inexistente '{name}'"))?;
        let op_name = obj.get("op").and_then(Value::as_str).ok_or("'op' ausente")?;
        let op = Op::parse(op_name).ok_or_else(|| format!("operador desconhecido '{op_name}'"))?;
        if !op.allowed(field.ty) {
            return Err(format!("operador '{op_name}' não vale para '{name}' ({:?})", field.ty).to_lowercase());
        }
        let value = obj.get("value").ok_or("'value' ausente")?;
        let bad = || format!("valor de '{name}' fora do formato do tipo");
        let (values, arg) = match op {
            Op::Null => (vec![], Value::Bool(value.as_bool().ok_or("'null' espera true/false")?)),
            Op::Contains => (
                vec![],
                Value::String(value.as_str().filter(|s| !s.is_empty()).ok_or_else(bad)?.to_owned()),
            ),
            Op::In => {
                let items = value
                    .as_array()
                    .filter(|a| !a.is_empty())
                    .ok_or("'in' espera uma lista não vazia")?;
                (
                    items.iter().map(|v| convert(field, v)).collect::<Option<_>>().ok_or_else(bad)?,
                    Value::Null,
                )
            }
            _ => (vec![convert(field, value).ok_or_else(bad)?], Value::Null),
        };
        Ok(Condition::Leaf {
            field: name.to_owned(),
            int_col: value::is_int_column(field),
            op,
            values,
            arg,
        })
    }

    /// Avalia sobre um registro no formato trafegado (estado do formulário ou registro lido).
    pub fn eval(&self, record: &Map<String, Value>, entity: &Entity) -> bool {
        match self {
            Condition::And(cs) => cs.iter().all(|c| c.eval(record, entity)),
            Condition::Or(cs) => cs.iter().any(|c| c.eval(record, entity)),
            Condition::Not(c) => !c.eval(record, entity),
            Condition::Leaf {
                field, op, values, arg, ..
            } => {
                let raw = record.get(field).map(|v| match v {
                    Value::Object(o) => o.get("id").cloned().unwrap_or(Value::Null), // reference lido vem { id, title }
                    v => v.clone(),
                });
                if *op == Op::Null {
                    return value::is_empty(raw.as_ref()) == (arg == &Value::Bool(true));
                }
                if value::is_empty(raw.as_ref()) {
                    return *op == Op::Ne;
                }
                let f = entity.condition_field(field).expect("campo validado no parse");
                let Some(actual) = convert(f, raw.as_ref().unwrap()) else {
                    return false;
                };
                match op {
                    Op::Contains => {
                        let SqlValue::Text(text) = actual else {
                            return false;
                        };
                        text.to_lowercase().contains(&arg.as_str().unwrap_or_default().to_lowercase())
                    }
                    Op::In => values.contains(&actual),
                    Op::Eq => actual == values[0],
                    Op::Ne => actual != values[0],
                    _ => {
                        let ord = match (&actual, &values[0]) {
                            (SqlValue::Int(a), SqlValue::Int(b)) => a.cmp(b),
                            (SqlValue::Text(a), SqlValue::Text(b)) => a.cmp(b),
                            _ => return false,
                        };
                        match op {
                            Op::Lt => ord.is_lt(),
                            Op::Lte => ord.is_le(),
                            Op::Gt => ord.is_gt(),
                            Op::Gte => ord.is_ge(),
                            _ => unreachable!(),
                        }
                    }
                }
            }
        }
    }
}

fn convert(field: &Field, v: &Value) -> Option<SqlValue> {
    match value::to_sql(field, v) {
        Ok(SqlValue::Null) | Err(_) => None,
        Ok(v) => Some(v),
    }
}

#[cfg(test)]
mod tests;
