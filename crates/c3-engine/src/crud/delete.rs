//! Excluir: o registro e as filhas gravadas com ele.

use axum::http::request::Parts;
use serde_json::Map;

use super::write::load_for_write;
use super::{parse_path_id, Owner, Result};
use crate::error::ApiError;
use crate::org::Ctx;
use crate::store::SqlValue;
use crate::validation::map_write_error;
use crate::version::Expect;
use crate::write::{self, WriteOp};
use crate::{children, children_write, Engine};

pub(crate) async fn delete(engine: &Engine, req: &Parts, name: &str, id: &str) -> Result<()> {
    let entity = engine.entity(name)?;
    super::source::guard_rows(entity)?;
    crate::spec_store::guard_writes(entity)?;
    if entity.singleton {
        return Err(ApiError::method_not_allowed(
            "Configuração de registro único não se exclui: altere os valores.",
        ));
    }
    let ctx = Ctx::new(engine, req).await?;
    let id = parse_path_id(id)?;
    let expect = Expect::from(req)?;
    expect.allow_undo(entity, None)?;
    children::guard_direct_write(&ctx, name)?;
    if engine.0.hooks.delegates_writes(name) {
        let mut conn = engine.0.store.conn().await?;
        let (before, _) = load_for_write(&mut *conn, &ctx, entity, id, |c| c.delete, &expect).await?;
        let kids = children_write::to_writes(&ctx, entity, children_write::plan_delete_all(&mut *conn, &ctx, entity, id).await?);
        drop(conn);
        write::run(
            &ctx,
            entity,
            WriteOp::Delete,
            Some(id),
            Some(&before),
            Owner::of(&before),
            &Map::new(),
            &kids,
        )
        .await?;
        return Ok(());
    }
    let mut tx = engine.0.store.begin().await?;
    let (before, scope) = load_for_write(&mut *tx, &ctx, entity, id, |c| c.delete, &expect).await?;
    let plan = children_write::plan_delete_all(&mut *tx, &ctx, entity, id).await?;
    children_write::apply(&mut *tx, &ctx, entity, plan, id, Owner::of(&before)).await?;
    let sql = format!("DELETE FROM \"{}\" WHERE \"id\" = ?{scope}", entity.name);
    let done = tx
        .execute(&sql, &[SqlValue::Int(id)])
        .await
        .map_err(|e| match map_write_error(e, entity) {
            e if e.code == "conflict" => ApiError::conflict("Este registro está em uso por outros registros.", None),
            e => e,
        })?;
    if done.rows_affected == 0 {
        return Err(ApiError::not_found("Registro não encontrado."));
    }
    tx.commit().await?;
    Ok(())
}
