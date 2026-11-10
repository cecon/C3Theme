//! Criar e alterar: corpo, permissão, validação e gravação (pelo motor numa transação, ou pelo sistema).

use axum::http::request::Parts;
use serde_json::{Map, Value};

use super::read::full_record;
use super::{allow_read, fetch_one, parse_path_id, singleton, writable, Kids, Owner, Result};
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::{Entity, Scope, BRANCH_COL, COMPANY_COL};
use crate::store::{Conn, SqlValue};
use crate::validation::{map_write_error, normalize_refs, validate};
use crate::version::{self, Expect};
use crate::write::{self, WriteOp};
use crate::{access, children, children_write, locked, Capabilities, Engine};

/// `body`: o corpo como veio (`None` se não era JSON).
fn parse_body(ctx: &Ctx, entity: &Entity, body: Option<Value>, creating: bool) -> Result<(Map<String, Value>, Kids)> {
    let Some(Value::Object(mut obj)) = body else {
        return Err(ApiError::bad_request("Corpo precisa ser um objeto JSON."));
    };
    let kids = children::take(ctx, entity, &mut obj, creating)?;
    if creating {
        access::check_write(ctx, entity, None, &obj)?;
    }
    for key in obj.keys() {
        // id e _version que o cliente devolve do registro lido são ignorados (a versão conferida é a do If-Match)
        if key != "id" && key != version::KEY && entity.field(key).is_none() {
            return Err(ApiError::bad_request(format!("Campo desconhecido '{key}'.")));
        }
    }
    // id e _version são ignorados; readOnly enviado é ignorado na criação e, na alteração, fica para o `locked::guard`
    // recusar a mudança (422 `read_only`) antes de [`without_read_only`] tirá-lo (spec: RecordInput)
    let obj = obj
        .into_iter()
        .filter(|(k, _)| entity.field(k).is_some_and(|f| !creating || !f.read_only))
        .collect();
    Ok((obj, kids))
}

/// O patch sem os campos `readOnly` (o mesmo valor do gravado passou pelo `locked::guard` e não se grava).
fn without_read_only(entity: &Entity, patch: Map<String, Value>) -> Map<String, Value> {
    patch
        .into_iter()
        .filter(|(k, _)| entity.field(k).is_some_and(|f| !f.read_only))
        .collect()
}

/// Devolve o registro criado, completo como na leitura.
pub(crate) async fn create(engine: &Engine, req: &Parts, name: &str, body: Option<Value>) -> Result<Map<String, Value>> {
    let entity = engine.entity(name)?;
    super::source::guard_rows(entity)?;
    crate::spec_store::guard_writes(entity)?;
    let ctx = Ctx::new(engine, req).await?;
    // grava sempre na filial ativa; entidade com escopo sem ela não tem dono
    let owner = match (entity.scope, ctx.active()) {
        (Scope::Group, _) => Owner::default(),
        (_, None) => return Err(ApiError::bad_request("Escolha a filial ativa (cabeçalho C3-Branch) para criar.")),
        (_, Some(active)) => Owner::of_new(entity, active),
    };
    ctx.allow_active(name, |c| c.create)?;
    children::guard_direct_write(&ctx, name)?;
    let (mut record, kids) = parse_body(&ctx, entity, body, true)?;
    for f in writable(entity) {
        if !record.contains_key(&f.name) {
            record.insert(f.name.clone(), f.default.clone().unwrap_or(Value::Null));
        }
    }

    if engine.0.hooks.delegates_writes(name) {
        normalize_refs(entity, &mut record);
        let mut conn = engine.0.store.conn().await?;
        singleton::guard_create(&mut *conn, entity, owner).await?;
        let (_, plan) = validate(&mut *conn, &ctx, entity, owner, &record, (None, kids)).await?;
        drop(conn);
        let kids = children_write::to_writes(&ctx, entity, plan);
        let id = write::run(
            &ctx,
            entity,
            WriteOp::Create,
            None,
            None,
            owner,
            &write::values(entity, &record),
            &kids,
        )
        .await?;
        let mut conn = engine.0.store.conn().await?;
        return full_record(&mut *conn, &ctx, entity, id).await;
    }

    let mut tx = engine.0.store.begin().await?;
    singleton::guard_create(&mut *tx, entity, owner).await?;
    let (mut values, plan) = validate(&mut *tx, &ctx, entity, owner, &record, (None, kids)).await?;
    let mut cols: Vec<_> = writable(entity).map(|f| format!("\"{}\"", f.name)).collect();
    for (col, id) in [(COMPANY_COL, owner.company), (BRANCH_COL, owner.branch)] {
        if let Some(id) = id {
            cols.push(format!("\"{col}\""));
            values.push(SqlValue::Int(id));
        }
    }
    let sql = if cols.is_empty() {
        format!("INSERT INTO \"{}\" DEFAULT VALUES", entity.name)
    } else {
        format!(
            "INSERT INTO \"{}\" ({}) VALUES ({})",
            entity.name,
            cols.join(", "),
            vec!["?"; cols.len()].join(", ")
        )
    };
    let done = tx.execute(&sql, &values).await.map_err(|e| map_write_error(e, entity))?;
    children_write::apply(&mut *tx, &ctx, entity, plan, done.last_insert_id, owner).await?;
    let created = full_record(&mut *tx, &ctx, entity, done.last_insert_id).await?;
    tx.commit().await?;
    Ok(created)
}

/// Carrega o registro dentro do escopo de leitura (fora dele: 404), confere a capability na filial
/// dona dele (sem ela: 403) e a versão do `If-Match` (mudou: 412). Devolve o registro e o filtro de escopo para o
/// próprio UPDATE/DELETE.
pub(super) async fn load_for_write(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    entity: &Entity,
    id: i64,
    pick: impl Fn(&Capabilities) -> bool + Copy,
    expect: &Expect,
) -> Result<(Map<String, Value>, String)> {
    allow_read(ctx, entity, |c| c.read || pick(c))?;
    let record = fetch_one(conn, ctx, entity, id)
        .await?
        .ok_or_else(|| ApiError::not_found("Registro não encontrado."))?;
    if !ctx.can_write(entity, Owner::of(&record), pick) {
        return Err(ApiError::forbidden());
    }
    expect.check(ctx, entity, &record)?;
    let table = format!("\"{}\"", entity.name);
    let scope = ctx.read_scope(entity, &table).map(|s| format!(" AND {s}")).unwrap_or_default();
    Ok((record, scope))
}

/// Devolve o registro alterado, completo como na leitura.
pub(crate) async fn update(engine: &Engine, req: &Parts, name: &str, id: &str, body: Option<Value>) -> Result<Map<String, Value>> {
    let entity = engine.entity(name)?;
    super::source::guard_rows(entity)?;
    crate::spec_store::guard_writes(entity)?;
    let ctx = Ctx::new(engine, req).await?;
    let id = parse_path_id(id)?;
    let expect = Expect::from(req)?;
    expect.allow_undo(entity, None)?;
    children::guard_direct_write(&ctx, name)?;
    let (patch, kids) = parse_body(&ctx, entity, body, false)?;

    if engine.0.hooks.delegates_writes(name) {
        let mut conn = engine.0.store.conn().await?;
        let (before, _) = load_for_write(&mut *conn, &ctx, entity, id, |c| c.update, &expect).await?;
        let owner = Owner::of(&before);
        let mut record = before.clone();
        normalize_refs(entity, &mut record);
        locked::guard(&ctx, entity, &record, &patch)?;
        record.extend(without_read_only(entity, patch));
        let (_, plan) = validate(&mut *conn, &ctx, entity, owner, &record, (Some(id), kids)).await?;
        drop(conn);
        let values = write::values(entity, &record);
        let kids = children_write::to_writes(&ctx, entity, plan);
        write::run(&ctx, entity, WriteOp::Update, Some(id), Some(&before), owner, &values, &kids).await?;
        let mut conn = engine.0.store.conn().await?;
        return full_record(&mut *conn, &ctx, entity, id).await;
    }

    // ler, validar e gravar na mesma transação: ninguém muda o registro no meio
    let mut tx = engine.0.store.begin().await?;
    let (mut record, scope) = load_for_write(&mut *tx, &ctx, entity, id, |c| c.update, &expect).await?;
    let owner = Owner::of(&record);
    normalize_refs(entity, &mut record);
    locked::guard(&ctx, entity, &record, &patch)?;
    record.extend(without_read_only(entity, patch));
    let (values, plan) = validate(&mut *tx, &ctx, entity, owner, &record, (Some(id), kids)).await?;

    let sets: Vec<_> = writable(entity).map(|f| format!("\"{}\" = ?", f.name)).collect();
    if !sets.is_empty() {
        let sql = format!("UPDATE \"{}\" SET {} WHERE \"id\" = ?{scope}", entity.name, sets.join(", "));
        let mut params = values;
        params.push(SqlValue::Int(id));
        let done = tx.execute(&sql, &params).await.map_err(|e| map_write_error(e, entity))?;
        if done.rows_affected == 0 {
            return Err(ApiError::not_found("Registro não encontrado."));
        }
    }
    children_write::apply(&mut *tx, &ctx, entity, plan, id, owner).await?;
    let updated = full_record(&mut *tx, &ctx, entity, id).await?;
    tx.commit().await?;
    Ok(updated)
}
