//! Conversão entre o formato trafegado (spec/README.md#tipos-de-campo-e-formato-trafegado)
//! e as colunas SQLite usadas pelo c3-engine.
//!
//! Convenção de armazenamento do crate: integer, boolean (0/1), reference e id em INTEGER;
//! decimal em INTEGER escalado por 10^scale; o resto em TEXT.

use std::sync::LazyLock;

use regex::Regex;
use serde_json::{Number, Value};

use crate::spec::{Field, FieldType};

#[derive(Debug, Clone, PartialEq)]
pub enum SqlValue {
    Null,
    Int(i64),
    Text(String),
}

/// Maior inteiro que o JavaScript representa sem perder precisão.
pub const MAX_SAFE_INTEGER: i64 = (1 << 53) - 1;

static DECIMAL: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^(-?)(\d+)(?:\.(\d+))?$").unwrap());
static DATE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^(\d{4})-(\d{2})-(\d{2})$").unwrap());
static DATETIME: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$").unwrap());
static EMAIL: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^[^@\s]+@[^@\s]+\.[^@\s]+$").unwrap());

/// Vazio no sentido da spec: `null`, ausente ou `""`.
pub fn is_empty(v: Option<&Value>) -> bool {
    matches!(v, None | Some(Value::Null)) || v.and_then(Value::as_str) == Some("")
}

/// Código de erro de campo (spec: Error.fields[].code) quando o valor não tem o formato do tipo.
pub type FormatError = &'static str;

pub fn to_sql(field: &Field, v: &Value) -> Result<SqlValue, FormatError> {
    if is_empty(Some(v)) {
        return Ok(SqlValue::Null);
    }
    match field.ty {
        FieldType::String | FieldType::Text | FieldType::Email => v.as_str().map(|s| SqlValue::Text(s.to_owned())).ok_or("invalid_type"),
        FieldType::Enum => {
            let option = match (v, is_int_column(field)) {
                (Value::String(s), false) => SqlValue::Text(s.clone()),
                (Value::Number(n), true) => n.as_i64().map(SqlValue::Int).ok_or("invalid_type")?,
                _ => return Err("invalid_type"),
            };
            if field.options.contains(&option) {
                Ok(option)
            } else {
                Err("invalid_option")
            }
        }
        FieldType::Flags => {
            let n = v.as_i64().filter(|n| (0..=MAX_SAFE_INTEGER).contains(n)).ok_or("invalid_type")?;
            let all = field
                .options
                .iter()
                .fold(0, |acc, o| acc | if let SqlValue::Int(b) = o { *b } else { 0 });
            if n & !all == 0 {
                Ok(SqlValue::Int(n))
            } else {
                Err("invalid_option")
            }
        }
        FieldType::Integer => v
            .as_i64()
            .filter(|n| n.abs() <= MAX_SAFE_INTEGER)
            .map(SqlValue::Int)
            .ok_or("invalid_type"),
        FieldType::Boolean => v.as_bool().map(|b| SqlValue::Int(b as i64)).ok_or("invalid_type"),
        FieldType::Decimal => v
            .as_str()
            .and_then(|s| parse_decimal(s, field.scale))
            .map(SqlValue::Int)
            .ok_or("invalid_type"),
        FieldType::Date => v
            .as_str()
            .filter(|s| valid_date(s))
            .map(|s| SqlValue::Text(s.to_owned()))
            .ok_or("invalid_type"),
        FieldType::Datetime => v
            .as_str()
            .filter(|s| valid_datetime(s))
            .map(|s| SqlValue::Text(s.to_owned()))
            .ok_or("invalid_type"),
        FieldType::Reference => v.as_str().and_then(parse_id).map(SqlValue::Int).ok_or("invalid_type"),
        // não vai ao banco pelo motor: o input de ação chega ao sistema como veio, e na entidade grava o sistema
        FieldType::File => crate::field::file::check(field, v).map(|()| SqlValue::Null),
    }
}

pub fn parse_id(s: &str) -> Option<i64> {
    if s.starts_with('+') || s.starts_with('0') && s.len() > 1 {
        return None;
    }
    s.parse::<i64>().ok().filter(|n| *n > 0)
}

/// `"1234.5"` com scale 2 vira 123450. Mais casas que `scale` é erro, não arredondamento.
pub fn parse_decimal(s: &str, scale: u32) -> Option<i64> {
    let caps = DECIMAL.captures(s)?;
    let frac = caps.get(3).map_or("", |m| m.as_str());
    let frac = frac.trim_end_matches('0');
    if frac.len() > scale as usize {
        return None;
    }
    let digits = format!("{}{:0<width$}", &caps[2], frac, width = scale as usize);
    let n: i64 = digits.parse().ok()?;
    Some(if &caps[1] == "-" { -n } else { n })
}

pub fn format_decimal(n: i64, scale: u32) -> String {
    if scale == 0 {
        return n.to_string();
    }
    let factor = 10u64.pow(scale);
    let abs = n.unsigned_abs();
    let sign = if n < 0 { "-" } else { "" };
    format!("{sign}{}.{:0width$}", abs / factor, abs % factor, width = scale as usize)
}

fn days_in_month(y: u32, m: u32) -> u32 {
    match m {
        2 if (y.is_multiple_of(4) && !y.is_multiple_of(100)) || y.is_multiple_of(400) => 29,
        2 => 28,
        4 | 6 | 9 | 11 => 30,
        _ => 31,
    }
}

fn valid_ymd(y: &str, m: &str, d: &str) -> bool {
    let (y, m, d): (u32, u32, u32) = (y.parse().unwrap(), m.parse().unwrap(), d.parse().unwrap());
    (1..=12).contains(&m) && d >= 1 && d <= days_in_month(y, m)
}

pub fn valid_date(s: &str) -> bool {
    DATE.captures(s).is_some_and(|c| valid_ymd(&c[1], &c[2], &c[3]))
}

pub fn valid_datetime(s: &str) -> bool {
    DATETIME.captures(s).is_some_and(|c| {
        let (h, mi, se): (u32, u32, u32) = (c[4].parse().unwrap(), c[5].parse().unwrap(), c[6].parse().unwrap());
        valid_ymd(&c[1], &c[2], &c[3]) && h < 24 && mi < 60 && se < 60
    })
}

pub fn valid_email(s: &str) -> bool {
    EMAIL.is_match(s)
}

/// Valor lido do banco → JSON trafegado. `reference` é montado pelo chamador (precisa do título).
pub fn int_to_wire(field: &Field, n: Option<i64>) -> Value {
    match n {
        None => Value::Null,
        Some(n) => match field.ty {
            FieldType::Boolean => Value::Bool(n != 0),
            FieldType::Decimal => Value::String(format_decimal(n, field.scale)),
            _ => Value::Number(Number::from(n)),
        },
    }
}

/// Coluna guardada como INTEGER? Enum depende das opções: número vai em INTEGER, texto em TEXT.
pub fn is_int_column(field: &Field) -> bool {
    match field.ty {
        FieldType::Integer | FieldType::Decimal | FieldType::Boolean | FieldType::Reference | FieldType::Flags => true,
        FieldType::Enum => matches!(field.options.first(), Some(SqlValue::Int(_))),
        _ => false,
    }
}

/// `options[].value` de um enum é o valor gravado no banco, sem tradução: string não vazia ou inteiro
/// (faixa i53), todos do mesmo tipo e sem repetir.
pub fn parse_options(values: impl IntoIterator<Item = Value>) -> Result<Vec<SqlValue>, String> {
    let mut out: Vec<SqlValue> = Vec::new();
    for v in values {
        let option = match &v {
            Value::String(s) if !s.is_empty() => SqlValue::Text(s.clone()),
            Value::Number(n) => match n.as_i64().filter(|n| n.abs() <= MAX_SAFE_INTEGER) {
                Some(n) => SqlValue::Int(n),
                None => return Err(format!("opção {v}: use string não vazia ou inteiro")),
            },
            _ => return Err(format!("opção {v}: use string não vazia ou inteiro")),
        };
        if out
            .first()
            .is_some_and(|first| std::mem::discriminant(first) != std::mem::discriminant(&option))
        {
            return Err("opções misturam texto e número".into());
        }
        if out.contains(&option) {
            return Err(format!("opção {v} repetida"));
        }
        out.push(option);
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decimal_round_trip() {
        assert_eq!(parse_decimal("1234.5", 2), Some(123450));
        assert_eq!(parse_decimal("10.50", 2), Some(1050));
        assert_eq!(parse_decimal("-0.01", 2), Some(-1));
        assert_eq!(parse_decimal("7", 2), Some(700));
        assert_eq!(parse_decimal("1.234", 2), None);
        assert_eq!(parse_decimal("1.", 2), None);
        assert_eq!(parse_decimal("abc", 2), None);
        assert_eq!(format_decimal(123450, 2), "1234.50");
        assert_eq!(format_decimal(-1, 2), "-0.01");
        assert_eq!(format_decimal(5, 0), "5");
    }

    #[test]
    fn dates() {
        assert!(valid_date("2024-02-29"));
        assert!(!valid_date("2023-02-29"));
        assert!(!valid_date("2026-13-01"));
        assert!(valid_datetime("2026-10-17T02:55:17Z"));
        assert!(!valid_datetime("2026-10-17T02:55:17.123Z"));
        assert!(!valid_datetime("2026-10-17T02:55:17-03:00"));
    }

    #[test]
    fn enum_options_are_the_stored_values() {
        let opts = |v: Value| parse_options(v.as_array().unwrap().clone());
        assert_eq!(
            opts(serde_json::json!(["SEM BALANCA", "SP"])),
            Ok(vec![SqlValue::Text("SEM BALANCA".into()), SqlValue::Text("SP".into())])
        );
        assert_eq!(opts(serde_json::json!([0, 5102])), Ok(vec![SqlValue::Int(0), SqlValue::Int(5102)]));
        for bad in [
            serde_json::json!(["SP", 1]),
            serde_json::json!(["SP", "SP"]),
            serde_json::json!([""]),
            serde_json::json!([1.5]),
            serde_json::json!([true]),
        ] {
            assert!(opts(bad.clone()).is_err(), "{bad} deveria falhar");
        }
    }

    #[test]
    fn ids() {
        assert_eq!(parse_id("7"), Some(7));
        assert_eq!(parse_id("07"), None);
        assert_eq!(parse_id("0"), None);
        assert_eq!(parse_id("x"), None);
    }
}
