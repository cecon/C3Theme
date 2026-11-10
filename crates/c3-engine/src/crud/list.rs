//! Lista paginada: o filtro comum (`filter.rs`), ordenação e página.

use std::collections::HashMap;

use axum::http::request::Parts;
use serde_json::{Map, Value};

use super::filter::{filtered, Filtered};
use super::read::{row_to_json, select_sql, title_sql};
use super::Result;
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::FieldType;
use crate::store::{self, SqlValue};
use crate::{access, value, Engine};

const PAGE_SIZES: [i64; 4] = [10, 25, 50, 100];

/// Uma página da lista, com o total que o filtro alcança.
pub(crate) struct Page {
    pub data: Vec<Map<String, Value>>,
    pub page: i64,
    pub page_size: i64,
    pub total: i64,
    /// Consulta do sistema: colunas que o sistema pediu para estes parâmetros (#60); `None` usa as da view.
    pub columns: Option<Vec<super::source::SourceColumn>>,
}

/// `q`: os parâmetros da lista (`page`, `pageSize`, `where`, `q`, `sort`, `branches`), já decodificados.
pub(crate) async fn list(engine: &Engine, req: &Parts, name: &str, q: &HashMap<String, String>) -> Result<Page> {
    let ctx = Ctx::new(engine, req).await?;
    // campo que o usuário não vê não é lido, filtrado, buscado nem ordenado
    let view = access::view(&ctx, engine.entity(name)?);
    let entity = &*view;
    let Filtered {
        from,
        where_sql,
        mut params,
        source_params,
    } = filtered(&ctx, entity, q).await?;

    let page = match q.get("page") {
        None => 1,
        Some(p) => p
            .parse::<i64>()
            .ok()
            .filter(|p| *p >= 1)
            .ok_or_else(|| ApiError::bad_request("'page' precisa ser inteiro >= 1."))?,
    };
    let page_size = match q.get("pageSize") {
        None => 25,
        Some(p) => p
            .parse::<i64>()
            .ok()
            .filter(|p| PAGE_SIZES.contains(p))
            .ok_or_else(|| ApiError::bad_request("'pageSize' precisa ser 10, 25, 50 ou 100."))?,
    };

    let mut order = Vec::new();
    for key in q.get("sort").map(|s| s.split(',').collect::<Vec<_>>()).unwrap_or_default() {
        let (desc, fname) = match key.strip_prefix('-') {
            Some(f) => (true, f),
            None => (false, key),
        };
        let dir = if desc { "DESC" } else { "ASC" };
        if fname == "id" {
            order.push(format!("t.\"id\" {dir}"));
            continue;
        }
        let f = entity
            .readable_field(fname)
            .filter(|f| f.ty != FieldType::File)
            .ok_or_else(|| ApiError::bad_request(format!("'sort': campo inexistente '{fname}'.")))?;
        // reference ordena pelo título; vazio sempre por último, nos dois sentidos (igual ao Postgres com NULLS LAST)
        let expr = title_sql(&ctx, f).unwrap_or_else(|| format!("t.\"{}\"", f.name));
        let empty = if value::is_int_column(f) && f.ty != FieldType::Reference {
            format!("{expr} IS NULL")
        } else {
            format!("({expr} IS NULL OR {expr} = '')")
        };
        order.push(format!("{empty}, {expr} {dir}"));
    }
    order.push("t.\"id\" ASC".into());

    let count_sql = format!("SELECT COUNT(*) FROM {from} t{where_sql}");
    let mut conn = engine.0.store_of(entity).conn().await?;
    let total = store::scalar_int(&mut *conn, &count_sql, &params).await?.unwrap_or_default();

    let sql = format!(
        "{}{where_sql} ORDER BY {} LIMIT ? OFFSET ?",
        select_sql(&ctx, entity, &from),
        order.join(", ")
    );
    params.push(SqlValue::Int(page_size));
    params.push(SqlValue::Int((page - 1) * page_size));
    let rows = conn.query(&sql, &params).await?;
    drop(conn);
    let mut data = rows.iter().map(|r| row_to_json(entity, r)).collect::<Result<Vec<_>>>()?;
    for r in &mut data {
        ctx.attach_can(entity, r);
    }

    let columns = match &source_params {
        Some(p) => super::source::columns(&ctx, entity, p).await?,
        None => None,
    };
    Ok(Page {
        data,
        page,
        page_size,
        total,
        columns,
    })
}
