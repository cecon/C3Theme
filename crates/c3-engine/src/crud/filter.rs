//! Filtro comum de lista e agregação: filiais lidas, acesso por linha, `where` e busca livre (`q`).

use std::collections::HashMap;

use serde_json::Value;

use super::Result;
use crate::condition::{contains_pattern, Condition};
use crate::error::ApiError;
use crate::org::{scope_sql, Branch, Ctx};
use crate::spec::{Entity, Scope};
use crate::store::SqlValue;
use crate::{relative_date, row_access};

/// Filiais lidas por uma lista: `branches=1,2` explícito, ou a ativa, ou todas as permitidas.
fn list_branches(ctx: &Ctx, entity: &Entity, raw: Option<&String>) -> Result<Vec<Branch>> {
    let can = |b: &Branch| ctx.caps(&entity.name, Some(b.id)).list;
    let explicit: Option<Vec<i64>> = match raw {
        Some(s) => Some(
            s.split(',')
                .map(|p| p.trim().parse::<i64>())
                .collect::<std::result::Result<_, _>>()
                .map_err(|_| ApiError::bad_request("'branches' precisa ser ids separados por vírgula."))?,
        ),
        None => ctx.active().map(|a| vec![a.id]),
    };
    match explicit {
        Some(ids) => ids
            .into_iter()
            .map(|id| {
                ctx.allowed()
                    .iter()
                    .find(|b| b.id == id)
                    .copied()
                    .filter(|b| can(b))
                    .ok_or_else(ApiError::forbidden)
            })
            .collect(),
        None => {
            let all: Vec<_> = ctx.allowed().iter().copied().filter(|b| can(b)).collect();
            if all.is_empty() {
                Err(ApiError::forbidden())
            } else {
                Ok(all)
            }
        }
    }
}

/// O `FROM` (a tabela ou a consulta do sistema), o `WHERE` (com o espaço inicial, ou vazio) e os parâmetros dos
/// dois, na ordem dos `?`.
pub(super) struct Filtered {
    pub from: String,
    pub where_sql: String,
    pub params: Vec<SqlValue>,
}

/// `entity` já passou por `access::view`: campo oculto não filtra nem é buscado.
pub(super) async fn filtered(ctx: &Ctx<'_>, entity: &Entity, q: &HashMap<String, String>) -> Result<Filtered> {
    let (from, mut params) = super::source::from_sql(ctx, entity, q).await?;
    let name = &entity.name;
    let mut filters = Vec::new();
    if entity.scope == Scope::Group {
        ctx.allow_active(name, |c| c.list)?;
    } else {
        // por fora de qualquer condição do usuário: entra também no COUNT
        filters.push(scope_sql(entity.scope, &list_branches(ctx, entity, q.get("branches"))?, "t"));
    }
    filters.extend(row_access::row_filter(ctx, entity, "t"));

    if let Some(raw) = q.get("where") {
        let v: Value = serde_json::from_str(raw).map_err(|_| ApiError::bad_request("'where' não é JSON válido."))?;
        let v = relative_date::resolve(&v, entity, &ctx.engine.0.hooks.clock(ctx.req))
            .map_err(|e| ApiError::bad_request(format!("'where' inválido: {e}.")))?;
        let cond = Condition::parse(&v, entity).map_err(|e| ApiError::bad_request(format!("'where' inválido: {e}.")))?;
        filters.push(cond.to_sql("t", &mut params));
    }
    if let Some(text) = q.get("q").filter(|s| !s.trim().is_empty()) {
        if entity.search.is_empty() {
            return Err(ApiError::bad_request("Esta entidade não tem busca livre (views.list.search)."));
        }
        let parts: Vec<_> = entity
            .search
            .iter()
            .map(|f| {
                params.push(contains_pattern(text.trim()));
                format!("(t.\"{f}\" IS NOT NULL AND t.\"{f}\" REGEXP ?)")
            })
            .collect();
        filters.push(format!("({})", parts.join(" OR ")));
    }
    let where_sql = if filters.is_empty() {
        String::new()
    } else {
        format!(" WHERE {}", filters.join(" AND "))
    };

    Ok(Filtered { from, where_sql, params })
}
