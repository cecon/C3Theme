//! Leitura: o SELECT de uma entidade (com títulos de reference e dono), um registro e o registro completo.

use axum::http::request::Parts;
use serde_json::{json, Map, Value};

use super::Result;
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::{Entity, Field, FieldType, Scope, BRANCH_COL, COMPANY_COL};
use crate::store::{Conn, RowExt};
use crate::value::{self, SqlValue};
use crate::{children, Engine};

// ---------- leitura ----------

/// SELECT com todas as colunas na ordem dos campos; reference traz também o título do registro apontado.
/// Entidade com escopo traz no fim a empresa (e a filial) dona, com título.
/// `from`: a tabela entre aspas, ou a consulta do sistema entre parênteses.
pub(super) fn select_sql(ctx: &Ctx, entity: &Entity, from: &str) -> String {
    let engine = ctx.engine;
    let mut cols = vec!["t.\"id\"".to_owned()];
    for f in &entity.fields {
        cols.push(if f.write_only { "NULL".into() } else { format!("t.\"{}\"", f.name) });
        if let Some(sub) = title_sql(ctx, f) {
            cols.push(sub);
        }
    }
    if let Some(o) = &engine.0.app.organization {
        let owner = |col: &str, target: &str| {
            let title = engine.0.entities[target].title_field().map(|f| f.name.clone()).unwrap_or_default();
            format!("t.\"{col}\", (SELECT o.\"{title}\" FROM \"{target}\" o WHERE o.\"id\" = t.\"{col}\")")
        };
        if entity.scope != Scope::Group {
            cols.push(owner(COMPANY_COL, &o.company));
        }
        if entity.scope == Scope::Branch {
            cols.push(owner(BRANCH_COL, &o.branch));
        }
    }
    format!("SELECT {} FROM {from} t", cols.join(", "))
}

/// Título do registro apontado. Fora do escopo de leitura do usuário vem NULL: o nome não vaza.
pub(super) fn title_sql(ctx: &Ctx, f: &Field) -> Option<String> {
    let target = &ctx.engine.0.entities[f.reference.as_ref()?];
    let title = target.title_field()?;
    let scope = ctx.read_scope(target, "r").map(|s| format!(" AND {s}")).unwrap_or_default();
    Some(format!(
        "(SELECT r.\"{}\" FROM \"{}\" r WHERE r.\"id\" = t.\"{}\"{scope})",
        title.name, target.name, f.name
    ))
}

pub(super) fn row_to_json(entity: &Entity, row: &[SqlValue]) -> Result<Map<String, Value>> {
    let mut out = Map::new();
    let id = row.int(0)?.unwrap_or_default();
    out.insert("id".into(), Value::String(id.to_string()));
    let mut i = 1;
    for f in &entity.fields {
        let v = if f.ty == FieldType::Reference {
            let id = row.int(i)?;
            let title = row.text(i + 1)?;
            i += 1;
            match id {
                Some(id) => json!({ "id": id.to_string(), "title": title }),
                None => Value::Null,
            }
        } else if f.ty == FieldType::File {
            crate::field::file::to_wire(row.text(i)?)
        } else if value::is_int_column(f) {
            value::int_to_wire(f, row.int(i)?)
        } else {
            row.text(i)?.map_or(Value::Null, Value::String)
        };
        i += 1;
        out.insert(f.name.clone(), v);
    }
    let owners: &[&str] = match entity.scope {
        Scope::Group => &[],
        Scope::Company => &["_company"],
        Scope::Branch => &["_company", "_branch"],
    };
    for key in owners {
        let id = row.int(i)?.unwrap_or_default();
        let title = row.text(i + 1)?;
        i += 2;
        out.insert((*key).into(), json!({ "id": id.to_string(), "title": title }));
    }
    Ok(out)
}

/// Um registro, dentro do escopo de leitura do usuário (fora dele, None: vira 404, não 403).
pub(crate) async fn fetch_one(conn: &mut dyn Conn, ctx: &Ctx<'_>, entity: &Entity, id: i64) -> Result<Option<Map<String, Value>>> {
    let scope = ctx.read_scope(entity, "t").map(|s| format!(" AND {s}")).unwrap_or_default();
    let rows = fetch_rows(conn, ctx, entity, &format!("t.\"id\" = ?{scope}"), &[SqlValue::Int(id)]).await?;
    Ok(rows.into_iter().next())
}

/// Registros no formato trafegado; `filter` é o resto do SQL depois do WHERE (alias `t`).
pub(crate) async fn fetch_rows(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    entity: &Entity,
    filter: &str,
    params: &[SqlValue],
) -> Result<Vec<Map<String, Value>>> {
    let sql = format!("{} WHERE {filter}", select_sql(ctx, entity, &format!("\"{}\"", entity.name)));
    conn.query(&sql, params).await?.iter().map(|r| row_to_json(entity, r)).collect()
}

/// Registro lido com as listas `with_parent` e o `_can`: a resposta de ler, criar e alterar.
pub(super) async fn full_record(conn: &mut dyn Conn, ctx: &Ctx<'_>, entity: &Entity, id: i64) -> Result<Map<String, Value>> {
    let mut record = fetch_one(conn, ctx, entity, id)
        .await?
        .ok_or_else(|| ApiError::not_found("Registro não encontrado."))?;
    children::attach(conn, ctx, entity, &mut record).await?;
    ctx.attach_can(entity, &mut record);
    Ok(record)
}

pub(crate) async fn read(engine: &Engine, req: &Parts, name: &str, id: &str) -> Result<Map<String, Value>> {
    let entity = engine.entity(name)?;
    super::source::guard_rows(entity)?;
    let ctx = Ctx::new(engine, req).await?;
    super::allow_read(&ctx, entity, |c| c.read)?;
    let id = super::parse_path_id(id)?;
    let mut conn = engine.0.store.conn().await?;
    full_record(&mut *conn, &ctx, entity, id).await
}
