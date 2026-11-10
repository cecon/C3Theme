//! Agregação para painéis e totais da lista: contagem ou soma (uma ou várias medidas numa chamada),
//! opcionalmente agrupada por um campo, sobre o mesmo filtro da lista (filiais, acesso por linha, `where`, `q`).
//! Campo oculto ao usuário não agrupa nem soma.

use std::collections::HashMap;

use axum::http::request::Parts;
use serde_json::{json, Map, Value};

use super::filter::{filtered, Filtered};
use super::read::title_sql;
use super::Result;
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::{Entity, Field, FieldType};
use crate::store::RowExt;
use crate::{access, value, Engine};

/// Grupos devolvidos no máximo; o resto não vem (painel mostra os maiores).
pub(crate) const MAX_GROUPS: usize = 100;
/// Medidas numa chamada só (`measure=sum:total,sum:desconto`): os totais do rodapé da lista.
const MAX_MEASURES: usize = 10;

enum Measure<'e> {
    Count,
    Sum(&'e Field),
}

fn measure<'e>(entity: &'e Entity, raw: &str) -> Result<Measure<'e>> {
    if raw == "count" {
        return Ok(Measure::Count);
    }
    let name = raw
        .strip_prefix("sum:")
        .ok_or_else(|| ApiError::bad_request("'measure' precisa ser 'count' ou 'sum:<campo>'."))?;
    entity
        .readable_field(name)
        .filter(|f| matches!(f.ty, FieldType::Integer | FieldType::Decimal))
        .map(Measure::Sum)
        .ok_or_else(|| ApiError::bad_request(format!("'measure': '{name}' não é campo integer ou decimal.")))
}

/// `measure` é uma lista separada por vírgula; sem ele, contagem.
fn measures<'e>(entity: &'e Entity, raw: Option<&String>) -> Result<Vec<Measure<'e>>> {
    let Some(raw) = raw.filter(|s| !s.is_empty()) else {
        return Ok(vec![Measure::Count]);
    };
    let list: Vec<_> = raw.split(',').map(|m| measure(entity, m.trim())).collect::<Result<_>>()?;
    if list.len() > MAX_MEASURES {
        return Err(ApiError::bad_request(format!("'measure': no máximo {MAX_MEASURES} medidas.")));
    }
    Ok(list)
}

fn measure_sql(m: &Measure) -> String {
    match m {
        Measure::Count => "COUNT(*)".to_owned(),
        Measure::Sum(f) => format!("COALESCE(SUM(t.\"{}\"), 0)", f.name),
    }
}

/// Tamanho do prefixo de data/hora que forma o grupo (`2026`, `2026-10`, `2026-10-30`).
fn interval_len(raw: Option<&String>) -> Result<usize> {
    match raw.map(String::as_str) {
        None | Some("month") => Ok(7),
        Some("day") => Ok(10),
        Some("year") => Ok(4),
        Some(_) => Err(ApiError::bad_request("'interval' precisa ser day, month ou year.")),
    }
}

fn group_field<'e>(entity: &'e Entity, name: &str) -> Result<&'e Field> {
    entity
        .readable_field(name)
        .filter(|f| {
            matches!(
                f.ty,
                FieldType::Enum | FieldType::Boolean | FieldType::Reference | FieldType::Date | FieldType::Datetime
            )
        })
        .ok_or_else(|| ApiError::bad_request(format!("'groupBy': '{name}' não é campo enum, boolean, reference ou data.")))
}

fn is_date(f: &Field) -> bool {
    matches!(f.ty, FieldType::Date | FieldType::Datetime)
}

/// Valor agregado no formato trafegado: decimal vai como string escalada, igual ao campo.
fn measure_wire(m: &Measure, n: Option<i64>) -> Value {
    let n = n.unwrap_or_default();
    match m {
        Measure::Sum(f) if f.ty == FieldType::Decimal => Value::String(value::format_decimal(n, f.scale)),
        _ => json!(n),
    }
}

/// `value` com a primeira medida; com mais de uma, `values` com todas, na ordem pedida.
fn put_values(item: &mut Map<String, Value>, ms: &[Measure], row: &crate::store::Row, first: usize) -> Result<()> {
    let values = ms
        .iter()
        .enumerate()
        .map(|(i, m)| Ok(measure_wire(m, row.int(first + i)?)))
        .collect::<Result<Vec<_>>>()?;
    item.insert("value".into(), values[0].clone());
    if values.len() > 1 {
        item.insert("values".into(), Value::Array(values));
    }
    Ok(())
}

/// `q`: `measure`, `groupBy`, `interval` e o filtro da lista (`where`, `q`, `branches`), já decodificados.
pub(crate) async fn aggregate(engine: &Engine, req: &Parts, name: &str, q: &HashMap<String, String>) -> Result<Vec<Value>> {
    let ctx = Ctx::new(engine, req).await?;
    let view = access::view(&ctx, engine.entity(name)?);
    let entity = &*view;
    let ms = measures(entity, q.get("measure"))?;
    let group = q.get("groupBy").map(|g| group_field(entity, g)).transpose()?;
    if q.contains_key("interval") && !group.is_some_and(is_date) {
        return Err(ApiError::bad_request("'interval' só vale com 'groupBy' de data."));
    }
    let len = interval_len(q.get("interval"))?;
    let Filtered {
        from, where_sql, params, ..
    } = filtered(&ctx, entity, q).await?;

    let values_sql = ms.iter().map(measure_sql).collect::<Vec<_>>().join(", ");
    let mut conn = engine.0.store_of(entity).conn().await?;
    let Some(g) = group else {
        let sql = format!("SELECT {values_sql} FROM {from} t{where_sql}");
        let rows = conn.query(&sql, &params).await?;
        let mut item = Map::new();
        item.insert("key".into(), Value::Null);
        match rows.first() {
            Some(r) => put_values(&mut item, &ms, r, 0)?,
            None => return Err(ApiError::internal()),
        }
        return Ok(vec![Value::Object(item)]);
    };

    let col = format!("t.\"{}\"", g.name);
    let key_sql = if is_date(g) {
        format!("substr({col}, 1, {len})")
    } else {
        col.clone()
    };
    let title = title_sql(&ctx, g).map(|t| format!(", {t}")).unwrap_or_default();
    // data: em ordem de tempo; o resto: maiores primeiro (pela primeira medida). Vazio sempre por último.
    let first_sql = measure_sql(&ms[0]);
    let order = if is_date(g) {
        format!("{key_sql} IS NULL, {key_sql} ASC")
    } else {
        format!("{key_sql} IS NULL, {first_sql} DESC, {key_sql} ASC")
    };
    let sql =
        format!("SELECT {key_sql}, {values_sql}{title} FROM {from} t{where_sql} GROUP BY {key_sql} ORDER BY {order} LIMIT {MAX_GROUPS}");
    let rows = conn.query(&sql, &params).await?;
    drop(conn);

    rows.iter()
        .map(|r| {
            let key = if is_date(g) {
                r.text(0)?.map_or(Value::Null, Value::String)
            } else if g.ty == FieldType::Reference {
                r.int(0)?.map_or(Value::Null, |id| Value::String(id.to_string()))
            } else if value::is_int_column(g) {
                value::int_to_wire(g, r.int(0)?)
            } else {
                r.text(0)?.map_or(Value::Null, Value::String)
            };
            let mut item = Map::new();
            item.insert("key".into(), key);
            put_values(&mut item, &ms, r, 1)?;
            if g.ty == FieldType::Reference {
                item.insert("title".into(), r.text(1 + ms.len())?.map_or(Value::Null, Value::String));
            }
            Ok(Value::Object(item))
        })
        .collect()
}
