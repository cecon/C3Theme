//! Datas relativas em condições de filtro (`where` da lista e do `_aggregate`, presets, widgets do painel):
//! `{"$date": "monthStart"}` e `{"$now": true, "offset": -24, "unit": "hour"}` viram o valor trafegado na hora
//! da consulta, pelo relógio do sistema (`Hooks::clock`). Assim o SQL, a contagem e os totais usam o mesmo
//! "hoje", e o preset "Este mês" continua certo no mês que vem.

use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::{Map, Value};

use crate::spec::{Entity, FieldType};

const DAY: i64 = 86_400;
/// Operadores em que um valor relativo faz sentido.
const OPS: [&str; 6] = ["eq", "ne", "lt", "lte", "gt", "gte"];

/// O relógio das datas relativas. `today` é o dia operacional do sistema (a loja que fecha o caixa às 2h ainda está
/// "ontem"); sem ele, é a data de `now` no fuso `utc_offset_minutes`.
#[derive(Debug, Clone)]
pub struct Clock {
    /// Agora, em segundos desde 1970-01-01 UTC.
    pub now: i64,
    /// Fuso do sistema em minutos a partir do UTC (Brasília: -180). Início do dia em campo datetime usa ele.
    pub utc_offset_minutes: i32,
    /// `YYYY-MM-DD`; `None` = a data de `now` no fuso.
    pub today: Option<String>,
}

impl Clock {
    /// Relógio do servidor, em UTC.
    pub fn system() -> Clock {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).map_or(0, |d| d.as_secs() as i64);
        Clock {
            now,
            utc_offset_minutes: 0,
            today: None,
        }
    }

    fn offset_secs(&self) -> i64 {
        i64::from(self.utc_offset_minutes) * 60
    }

    /// Dias desde 1970-01-01 do "hoje".
    fn today_days(&self) -> Result<i64, String> {
        match &self.today {
            Some(t) => parse_date(t).ok_or_else(|| format!("Hooks::clock devolveu today inválido '{t}'")),
            None => Ok((self.now + self.offset_secs()).div_euclid(DAY)),
        }
    }
}

/// Copia a condição trocando cada valor relativo pelo valor trafegado do campo. Valor relativo só vale em campo
/// date (`$date`) ou datetime (`$date` = início do dia no fuso, `$now`), com eq, ne, lt, lte, gt e gte.
pub(crate) fn resolve(cond: &Value, entity: &Entity, clock: &Clock) -> Result<Value, String> {
    let Some(obj) = cond.as_object() else {
        return Ok(cond.clone());
    };
    let mut out = Map::new();
    for (k, v) in obj {
        let v = match (k.as_str(), v) {
            ("and" | "or", Value::Array(items)) => Value::Array(items.iter().map(|c| resolve(c, entity, clock)).collect::<Result<_, _>>()?),
            ("not", inner) => resolve(inner, entity, clock)?,
            ("value", Value::Object(rel)) if is_relative(rel) => leaf(obj, rel, entity, clock)?,
            _ => v.clone(),
        };
        out.insert(k.clone(), v);
    }
    Ok(Value::Object(out))
}

pub(crate) fn is_relative(v: &Map<String, Value>) -> bool {
    v.contains_key("$date") || v.contains_key("$now")
}

fn leaf(obj: &Map<String, Value>, rel: &Map<String, Value>, entity: &Entity, clock: &Clock) -> Result<Value, String> {
    let name = obj.get("field").and_then(Value::as_str).unwrap_or_default();
    let ty = entity.readable_field(name).map(|f| f.ty);
    let op = obj.get("op").and_then(Value::as_str).unwrap_or_default();
    if !OPS.contains(&op) {
        return Err(format!("data relativa em '{name}' só vale com eq, ne, lt, lte, gt e gte"));
    }
    let datetime = match ty {
        Some(FieldType::Date) => false,
        Some(FieldType::Datetime) => true,
        _ => return Err(format!("data relativa só vale em campo date ou datetime ('{name}')")),
    };
    value_of(rel, datetime, clock)
        .map(Value::String)
        .map_err(|e| format!("'{name}': {e}"))
}

/// O valor trafegado de `{"$date": ...}` ou `{"$now": true}` para um campo date (ou datetime, com `datetime`).
/// Também resolve o `default` relativo dos parâmetros de consulta (`source: system`).
pub(crate) fn value_of(rel: &Map<String, Value>, datetime: bool, clock: &Clock) -> Result<String, String> {
    if let Some(k) = rel.keys().find(|k| !["$date", "$now", "offset", "unit"].contains(&k.as_str())) {
        return Err(format!("data relativa com chave desconhecida '{k}'"));
    }
    let offset = match rel.get("offset") {
        None => 0,
        Some(v) => v.as_i64().ok_or("'offset' precisa ser inteiro")?,
    };
    let unit = rel.get("unit").map(|u| u.as_str().ok_or("'unit' precisa ser texto")).transpose()?;
    if rel.contains_key("$now") {
        if rel.contains_key("$date") || rel.get("$now") != Some(&Value::Bool(true)) {
            return Err("use {\"$now\": true} ou {\"$date\": ...}, não os dois".into());
        }
        if !datetime {
            return Err("'$now' só vale em campo datetime; em date, use '$date'".into());
        }
        let step = match unit.unwrap_or("hour") {
            "minute" => 60,
            "hour" => 3_600,
            "day" => DAY,
            u => return Err(format!("'unit' de '$now' precisa ser minute, hour ou day (veio '{u}')")),
        };
        return Ok(format_datetime(clock.now + offset * step));
    }
    let today = clock.today_days()?;
    let base = match rel.get("$date").and_then(Value::as_str) {
        Some("today") => today,
        Some("weekStart") => today - (today + 3).rem_euclid(7), // 1970-01-01 foi quinta; semana começa na segunda
        Some("monthStart") => {
            let (y, m, _) = civil(today);
            days(y, m, 1)
        }
        Some("yearStart") => days(civil(today).0, 1, 1),
        _ => return Err("'$date' precisa ser today, weekStart, monthStart ou yearStart".into()),
    };
    let day = match unit.unwrap_or("day") {
        "day" => base + offset,
        "week" => base + offset * 7,
        "month" => add_months(base, offset),
        "year" => add_months(base, offset * 12),
        u => return Err(format!("'unit' de '$date' precisa ser day, week, month ou year (veio '{u}')")),
    };
    Ok(if datetime {
        format_datetime(day * DAY - clock.offset_secs())
    } else {
        format_date(day)
    })
}

/// Soma meses mantendo o dia, ou o último do mês quando ele não existe (31/01 + 1 mês = 28/02).
fn add_months(day: i64, n: i64) -> i64 {
    let (y, m, d) = civil(day);
    let total = y * 12 + (m - 1) + n;
    let (y, m) = (total.div_euclid(12), total.rem_euclid(12) + 1);
    let last = days(y + (m / 12), m % 12 + 1, 1) - days(y, m, 1);
    days(y, m, d.min(last))
}

/// Dias desde 1970-01-01 (algoritmo de Howard Hinnant, calendário gregoriano proléptico).
fn days(y: i64, m: i64, d: i64) -> i64 {
    let y = if m <= 2 { y - 1 } else { y };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let doy = (153 * ((m + 9) % 12) + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146_097 + doe - 719_468
}

fn civil(z: i64) -> (i64, i64, i64) {
    let z = z + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (yoe + era * 400 + i64::from(m <= 2), m, d)
}

fn parse_date(s: &str) -> Option<i64> {
    let b = s.as_bytes();
    if s.len() != 10 || b[4] != b'-' || b[7] != b'-' {
        return None;
    }
    let n = |r: std::ops::Range<usize>| s.get(r)?.parse::<i64>().ok();
    let (y, m, d) = (n(0..4)?, n(5..7)?, n(8..10)?);
    let z = days(y, m, d);
    (civil(z) == (y, m, d)).then_some(z)
}

fn format_date(day: i64) -> String {
    let (y, m, d) = civil(day);
    format!("{y:04}-{m:02}-{d:02}")
}

fn format_datetime(secs: i64) -> String {
    let rem = secs.rem_euclid(DAY);
    format!(
        "{}T{:02}:{:02}:{:02}Z",
        format_date(secs.div_euclid(DAY)),
        rem / 3_600,
        rem % 3_600 / 60,
        rem % 60
    )
}

#[cfg(test)]
#[path = "relative_date_tests.rs"]
mod tests;
