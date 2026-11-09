//! Consulta do sistema (`source: system`): os parâmetros vêm na URL (`p.<nome>=valor`), são validados como o input de
//! uma ação (400/422) e o `Hooks::source` devolve o SELECT que entra no lugar da tabela: `FROM (sql) t`, com os valores
//! dele antes dos do `where`. Lista, busca, filtros, totais e exportação seguem iguais.

use std::collections::HashMap;

use serde_json::{Map, Value};

use super::{Owner, Result};
use crate::action::parse_input;
use crate::error::{ApiError, FieldErrors};
use crate::org::Ctx;
use crate::relative_date::{value_of, Clock};
use crate::spec::{Entity, FieldType, Source};
use crate::store::SqlValue;
use crate::validation::check_fields;
use crate::value;

/// Prefixo dos parâmetros na URL, para não colidir com `page`, `where`, `q`.
const PREFIX: &str = "p.";

/// Pedido de `Hooks::source`: a entidade e os parâmetros já validados, no formato trafegado (todos presentes; vazio
/// vem `null`).
pub struct SourceCall<'a> {
    pub entity: &'a str,
    pub params: &'a Map<String, Value>,
    /// Requisição e filial ativa.
    pub ctx: &'a crate::RequestContext<'a>,
}

/// O SELECT da consulta, pronto para o `FROM`. Os valores entram antes dos do `where`.
pub struct SourceSql {
    pub sql: String,
    pub values: Vec<SqlValue>,
}

/// Consulta do sistema é só leitura pela lista: criar, alterar, excluir e abrir uma linha são 405.
pub(crate) fn guard_rows(entity: &Entity) -> Result<()> {
    match entity.source {
        Some(_) => Err(ApiError::method_not_allowed(
            "Consulta do sistema: só a lista (com os parâmetros) e as ações de lista.",
        )),
        None => Ok(()),
    }
}

/// `FROM` de uma leitura: a tabela, ou `(SELECT do sistema)` com os valores dele.
pub(super) async fn from_sql(ctx: &Ctx<'_>, entity: &Entity, q: &HashMap<String, String>) -> Result<(String, Vec<SqlValue>)> {
    let Some(src) = &entity.source else {
        return Ok((format!("\"{}\"", entity.name), Vec::new()));
    };
    let engine = ctx.engine;
    let clock = engine.0.hooks.clock(ctx.req);
    let mut raw = defaults(src, &clock)?;
    raw.extend(from_query(src, q)?);
    let params = parse_input(&src.params, &raw)?;
    let mut conn = engine.0.store.conn().await?;
    let mut errors = FieldErrors::default();
    check_fields(&mut *conn, ctx, &src.params, Owner::default(), &params, false, &mut errors).await?;
    drop(conn);
    if !errors.is_empty() {
        return Err(ApiError::validation(errors));
    }
    let rc = ctx.request_context();
    let out = engine
        .0
        .hooks
        .source(SourceCall {
            entity: &entity.name,
            params: &params,
            ctx: &rc,
        })
        .await?;
    Ok((format!("({})", out.sql), out.values))
}

/// `default` de cada parâmetro no formato trafegado, com as datas relativas já resolvidas: o `/_meta` manda para a
/// faixa de parâmetros da shell, e a consulta usa quando a URL não traz o parâmetro.
pub(crate) fn defaults(src: &Source, clock: &Clock) -> Result<Map<String, Value>> {
    let mut out = Map::new();
    for f in &src.params.fields {
        if let Some(d) = &f.default {
            out.insert(f.name.clone(), d.clone());
        }
    }
    for (name, rel) in &src.relative_defaults {
        let datetime = src.params.field(name).is_some_and(|f| f.ty == FieldType::Datetime);
        let v = value_of(rel, datetime, clock).map_err(|e| ApiError::bad_request(format!("default de '{name}': {e}")))?;
        out.insert(name.clone(), Value::String(v));
    }
    Ok(out)
}

/// `p.data=2026-11-05` → `{ "data": "2026-11-05" }`, no tipo trafegado do campo. Vazio = sem valor.
fn from_query(src: &Source, q: &HashMap<String, String>) -> Result<Map<String, Value>> {
    let mut out = Map::new();
    for (key, raw) in q {
        let Some(name) = key.strip_prefix(PREFIX) else {
            continue;
        };
        let f = src
            .params
            .field(name)
            .ok_or_else(|| ApiError::bad_request(format!("Parâmetro desconhecido '{name}'.")))?;
        let v = if raw.is_empty() {
            Value::Null
        } else {
            match f.ty {
                FieldType::Boolean => Value::Bool(raw == "true"),
                FieldType::Integer | FieldType::Flags => int(name, raw)?,
                FieldType::Enum if value::is_int_column(f) => int(name, raw)?,
                _ => Value::String(raw.clone()),
            }
        };
        out.insert(name.to_owned(), v);
    }
    Ok(out)
}

fn int(name: &str, raw: &str) -> Result<Value> {
    raw.parse::<i64>()
        .map(Value::from)
        .map_err(|_| ApiError::bad_request(format!("Parâmetro '{name}' precisa ser inteiro.")))
}
