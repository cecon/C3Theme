//! Consulta do sistema (`source: system`): os parâmetros vêm na URL (`p.<nome>=valor`), são validados como o input de
//! uma ação (400/422) e o `Hooks::source` devolve o SELECT que entra no lugar da tabela: `FROM (sql) t`, com os valores
//! dele antes dos do `where`. Lista, busca, filtros, totais e exportação seguem iguais.

use std::collections::HashMap;

use serde::Serialize;
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

/// Coluna que a consulta mostra (`Hooks::source_columns`, #60): o campo da entidade e, se quiser, o rótulo do
/// cabeçalho naquela consulta (o mês do período: `out/26`). Sem rótulo, fica o do campo.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SourceColumn {
    pub field: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

impl SourceColumn {
    pub fn new(field: impl Into<String>) -> Self {
        Self {
            field: field.into(),
            label: None,
        }
    }
    pub fn label(mut self, label: impl Into<String>) -> Self {
        self.label = Some(label.into());
        self
    }
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

/// `FROM` de uma leitura: a tabela, ou `(SELECT do sistema)` com os valores dele e os parâmetros validados.
pub(super) async fn from_sql(ctx: &Ctx<'_>, entity: &Entity, q: &HashMap<String, String>) -> Result<From> {
    match &entity.source {
        None => Ok((format!("\"{}\"", entity.name), Vec::new(), None)),
        Some(src) => {
            let ((from, values), params) = source_sql(ctx, entity, src, q).await?;
            Ok((from, values, Some(params)))
        }
    }
}

type From = (String, Vec<SqlValue>, Option<Map<String, Value>>);

/// Colunas da lista pedidas pelo sistema para estes parâmetros, na ordem dele. Campo que o usuário não vê (fora de
/// `view`) sai calado; campo que a entidade não tem, ou repetido, é erro do sistema (500).
pub(super) async fn columns(ctx: &Ctx<'_>, view: &Entity, params: &Map<String, Value>) -> Result<Option<Vec<SourceColumn>>> {
    let rc = ctx.request_context();
    let call = SourceCall {
        entity: &view.name,
        params,
        ctx: &rc,
    };
    let Some(cols) = ctx.engine.0.hooks.source_columns(call).await? else {
        return Ok(None);
    };
    let full = ctx.engine.entity(&view.name)?;
    let mut seen = std::collections::HashSet::new();
    for c in &cols {
        if full.field(&c.field).is_none() || !seen.insert(c.field.as_str()) {
            eprintln!(
                "c3-engine: {}: source_columns com '{}' fora da entidade ou repetido",
                view.name, c.field
            );
            return Err(ApiError::internal());
        }
    }
    Ok(Some(cols.into_iter().filter(|c| view.readable_field(&c.field).is_some()).collect()))
}

/// Linhas marcadas de uma consulta do sistema, para a ação em conjunto: a consulta roda com os parâmetros da URL
/// (`p.<nome>`, os mesmos da lista na tela), uma vez, e cada id é procurado nela, no escopo de leitura. Devolve as
/// linhas achadas (por id) e os parâmetros validados, que o sistema recebe junto.
pub(crate) async fn picked_rows(
    ctx: &Ctx<'_>,
    entity: &Entity,
    src: &Source,
    q: &HashMap<String, String>,
    ids: &[i64],
) -> Result<(HashMap<i64, Map<String, Value>>, Map<String, Value>)> {
    let ((from, mut values), params) = source_sql(ctx, entity, src, q).await?;
    if ids.is_empty() {
        return Ok((HashMap::new(), params));
    }
    let marks = vec!["?"; ids.len()].join(", ");
    let scope = ctx.read_scope(entity, "t").map(|s| format!(" AND {s}")).unwrap_or_default();
    let sql = format!("{} WHERE t.\"id\" IN ({marks}){scope}", super::read::select_sql(ctx, entity, &from));
    values.extend(ids.iter().map(|id| SqlValue::Int(*id)));
    let mut conn = ctx.engine.0.store.conn().await?;
    let mut found = HashMap::new();
    for row in conn.query(&sql, &values).await?.iter() {
        let rec = super::read::row_to_json(entity, row)?;
        if let Some(id) = rec.get("id").and_then(|v| v.as_str()).and_then(|s| s.parse().ok()) {
            found.insert(id, rec);
        }
    }
    Ok((found, params))
}

/// O SELECT do sistema com os parâmetros validados (400/422), e os parâmetros.
async fn source_sql(
    ctx: &Ctx<'_>,
    entity: &Entity,
    src: &Source,
    q: &HashMap<String, String>,
) -> Result<((String, Vec<SqlValue>), Map<String, Value>)> {
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
    Ok(((format!("({})", out.sql), out.values), params))
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
