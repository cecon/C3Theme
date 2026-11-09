//! Condição em SQL (listagem). Cada folha vale sempre 0 ou 1, nunca NULL, para concordar com `eval`.

use serde_json::Value;

use super::{Condition, Op};
use crate::value::SqlValue;

impl Op {
    fn sql(self) -> &'static str {
        match self {
            Op::Eq => "=",
            Op::Ne => "<>",
            Op::Lt => "<",
            Op::Lte => "<=",
            Op::Gt => ">",
            Op::Gte => ">=",
            _ => unreachable!(),
        }
    }
}

impl Condition {
    /// SQL que sempre vale 0 ou 1. `table` é o alias da tabela na consulta.
    pub fn to_sql(&self, table: &str, params: &mut Vec<SqlValue>) -> String {
        match self {
            Condition::And(cs) => format!("({})", cs.iter().map(|c| c.to_sql(table, params)).collect::<Vec<_>>().join(" AND ")),
            Condition::Or(cs) => format!("({})", cs.iter().map(|c| c.to_sql(table, params)).collect::<Vec<_>>().join(" OR ")),
            Condition::Not(c) => format!("(NOT {})", c.to_sql(table, params)),
            Condition::Leaf {
                field,
                int_col,
                op,
                values,
                arg,
            } => {
                let col = format!("{table}.\"{field}\"");
                let empty = empty_sql(&col, *int_col);
                match op {
                    Op::Null if arg == &Value::Bool(true) => empty,
                    Op::Null => format!("(NOT {empty})"),
                    Op::Ne => {
                        params.push(values[0].clone());
                        format!("({empty} OR {col} <> ?)")
                    }
                    Op::In => {
                        params.extend(values.iter().cloned());
                        format!("(NOT {empty} AND {col} IN ({}))", vec!["?"; values.len()].join(", "))
                    }
                    Op::Contains => {
                        params.push(contains_pattern(arg.as_str().unwrap_or_default()));
                        format!("(NOT {empty} AND {col} REGEXP ?)")
                    }
                    _ => {
                        params.push(values[0].clone());
                        format!("(NOT {empty} AND {col} {} ?)", op.sql())
                    }
                }
            }
        }
    }
}

/// Padrão para `REGEXP` (registrado na conexão pelo adaptador do `Store`): Unicode, sem diferenciar maiúsculas.
pub fn contains_pattern(needle: &str) -> SqlValue {
    SqlValue::Text(format!("(?i){}", regex::escape(needle)))
}

fn empty_sql(col: &str, int_col: bool) -> String {
    if int_col {
        format!("({col} IS NULL)")
    } else {
        format!("({col} IS NULL OR {col} = '')")
    }
}
