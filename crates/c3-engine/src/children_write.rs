//! Validação e gravação das listas `with_parent` (ver `children.rs`). A lista enviada substitui a gravada:
//! linha com `id` altera, sem `id` inclui, linha gravada que não veio é excluída.

use std::collections::HashSet;

use serde_json::{Map, Value};

use crate::children::{owner_cols, rows, Child, Sent};
use crate::crud::{writable, Owner};
use crate::error::{ApiError, FieldErrors};
use crate::locked;
use crate::org::Ctx;
use crate::spec::Entity;
use crate::store::Conn;
use crate::validation::{check_fields, map_write_error, normalize_refs};
use crate::value::{self, SqlValue};
use crate::write::{self, ChildRow, ChildWrite, WriteOp};

type Result<T> = std::result::Result<T, ApiError>;

/// Uma linha validada, pronta para o SQL do motor ou para o `write` do sistema.
pub(crate) struct Planned {
    row: ChildRow,
    /// Colunas graváveis na ordem de `writable()` (alterar e incluir).
    sql: Vec<SqlValue>,
}

/// Linhas de cada seção enviada (índice em `Children::of`), na ordem excluir, alterar, incluir.
pub(crate) type Plan = Vec<(usize, Vec<Planned>)>;

/// Valida as listas enviadas. Erro de formato (chave desconhecida, id repetido) é 400 na hora; erro de
/// valor vai para `errors` com o prefixo da linha, junto com os do pai, para a resposta trazer todos.
/// `parent` traz o registro do pai já completo: seção escondida pelo `visibleWhen` dela vale como lista vazia
/// (exclui o que estava gravado, mesmo que a lista não tenha vindo), como o campo escondido vale null.
pub(crate) async fn plan(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    (parent, record): (&Entity, &Map<String, Value>),
    owner: Owner,
    parent_id: Option<i64>,
    mut payload: Sent,
    errors: &mut FieldErrors,
) -> Result<Plan> {
    let children = ctx.engine.0.children.of(&parent.name);
    let hidden = |c: &Child| c.visible_when.as_ref().is_some_and(|w| !w.eval(record, parent));
    for (ci, _) in children.iter().enumerate().filter(|(_, c)| hidden(c)) {
        payload.retain(|(i, _)| *i != ci);
        if parent_id.is_some() {
            payload.push((ci, Vec::new()));
        }
    }
    let mut plan = Vec::new();
    for (ci, sent) in payload {
        let child = &children[ci];
        let current = match parent_id {
            Some(id) => rows(conn, ctx, child, id).await?,
            None => Vec::new(),
        };
        if sent.len() > child.max {
            errors.add(&child.key, "too_many", format!("Use no máximo {} linhas.", child.max));
        } else if sent.len() < child.min && !hidden(child) {
            errors.add(&child.key, "too_few", format!("Informe pelo menos {} linha(s).", child.min));
        }
        let (mut seen, mut kept, mut created) = (HashSet::new(), Vec::new(), Vec::new());
        // checklist: a mesma opção marcada duas vezes
        let mut options = HashSet::new();
        for (i, row) in sent.into_iter().enumerate() {
            let prefix = format!("{}.{i}.", child.key);
            let id = row_id(child, &row, &prefix)?;
            if id.is_some_and(|id| !seen.insert(id)) {
                return Err(ApiError::bad_request(format!("'{prefix}id' repetido na lista.")));
            }
            let before = id.and_then(|id| current.iter().find(|r| r["id"] == Value::String(id.to_string())));
            if id.is_some() && before.is_none() {
                errors.add(
                    &format!("{prefix}id"),
                    "not_found",
                    "Esta linha não existe mais: outra pessoa pode tê-la removido.",
                );
                continue;
            }
            let mut record = match before {
                Some(b) => b.clone(),
                None => writable(&child.entity)
                    .map(|f| (f.name.clone(), f.default.clone().unwrap_or(Value::Null)))
                    .collect(),
            };
            normalize_refs(&child.entity, &mut record);
            let mut errs = FieldErrors::default();
            if id.is_some() {
                locked::check(&child.entity, &record, &row, "", &mut errs);
            }
            record.extend(row.into_iter().filter(|(k, _)| child.entity.field(k).is_some_and(|f| !f.read_only)));
            let sql = check_fields(conn, ctx, &child.entity, owner, &record, id.is_some(), &mut errs).await?;
            if errs.is_empty() {
                let rc = ctx.request_context();
                ctx.engine.0.hooks.validate(&rc, &child.key, &record, conn, &mut errs).await;
            }
            if let Some(opt) = child.option.as_ref().and_then(|o| record.get(o)).filter(|v| !v.is_null()) {
                if !options.insert(opt.to_string()) {
                    errs.add(
                        child.option.as_deref().unwrap_or_default(),
                        "duplicate",
                        "Esta opção já está marcada.",
                    );
                }
            }
            errors.absorb(&prefix, errs);
            let row = ChildRow {
                op: if id.is_some() { WriteOp::Update } else { WriteOp::Create },
                id,
                index: Some(i),
                before: before.cloned(),
                values: write::values(&child.entity, &record),
            };
            let target = if id.is_some() { &mut kept } else { &mut created };
            target.push(Planned { row, sql });
        }
        let mut list: Vec<Planned> = current
            .into_iter()
            .filter(|r| !r["id"].as_str().and_then(value::parse_id).is_some_and(|id| seen.contains(&id)))
            .map(deletion)
            .collect();
        list.extend(kept);
        list.extend(created);
        plan.push((ci, list));
    }
    Ok(plan)
}

fn row_id(child: &Child, row: &Map<String, Value>, prefix: &str) -> Result<Option<i64>> {
    if let Some(k) = row.keys().find(|k| *k != "id" && child.entity.field(k).is_none()) {
        return Err(ApiError::bad_request(format!("Campo desconhecido '{prefix}{k}'.")));
    }
    match row.get("id") {
        None | Some(Value::Null) => Ok(None),
        Some(Value::String(s)) => value::parse_id(s)
            .map(Some)
            .ok_or_else(|| ApiError::bad_request(format!("'{prefix}id' inválido."))),
        Some(_) => Err(ApiError::bad_request(format!("'{prefix}id' precisa ser string."))),
    }
}

fn deletion(before: Map<String, Value>) -> Planned {
    let id = before["id"].as_str().and_then(value::parse_id);
    Planned {
        row: ChildRow {
            op: WriteOp::Delete,
            id,
            index: None,
            before: Some(before),
            values: Map::new(),
        },
        sql: Vec::new(),
    }
}

/// Excluir o pai leva os filhos junto: todas as linhas viram exclusão.
pub(crate) async fn plan_delete_all(conn: &mut dyn Conn, ctx: &Ctx<'_>, parent: &Entity, parent_id: i64) -> Result<Plan> {
    let mut plan = Vec::new();
    for (ci, child) in ctx.engine.0.children.of(&parent.name).iter().enumerate() {
        let list = rows(conn, ctx, child, parent_id).await?.into_iter().map(deletion).collect();
        plan.push((ci, list));
    }
    Ok(plan)
}

/// As listas como vão ficar, para o `Hooks::validate_children` (o plano segue para a gravação).
pub(crate) fn view(ctx: &Ctx<'_>, parent: &Entity, plan: &Plan) -> Vec<ChildWrite> {
    let children = ctx.engine.0.children.of(&parent.name);
    plan.iter()
        .map(|(ci, list)| ChildWrite {
            entity: children[*ci].key.clone(),
            field: children[*ci].fk.clone(),
            rows: list.iter().map(|p| p.row.clone()).collect(),
        })
        .collect()
}

/// O que o `write` do sistema recebe.
pub(crate) fn to_writes(ctx: &Ctx<'_>, parent: &Entity, plan: Plan) -> Vec<ChildWrite> {
    let children = ctx.engine.0.children.of(&parent.name);
    plan.into_iter()
        .map(|(ci, list)| ChildWrite {
            entity: children[ci].key.clone(),
            field: children[ci].fk.clone(),
            rows: list.into_iter().map(|p| p.row).collect(),
        })
        .collect()
}

/// Grava as linhas na transação do pai (escrita pelo motor).
pub(crate) async fn apply(conn: &mut dyn Conn, ctx: &Ctx<'_>, parent: &Entity, plan: Plan, parent_id: i64, owner: Owner) -> Result<()> {
    for (ci, list) in plan {
        let child = &ctx.engine.0.children.of(&parent.name)[ci];
        for p in list {
            apply_row(conn, child, p, parent_id, owner).await?;
        }
    }
    Ok(())
}

async fn apply_row(conn: &mut dyn Conn, child: &Child, p: Planned, parent_id: i64, owner: Owner) -> Result<()> {
    let (table, fk) = (&child.key, &child.fk);
    let cols: Vec<String> = writable(&child.entity).map(|f| format!("\"{}\"", f.name)).collect();
    let mut params = p.sql;
    let sql = match p.row.op {
        WriteOp::Delete => format!("DELETE FROM \"{table}\" WHERE \"id\" = ? AND \"{fk}\" = ?"),
        WriteOp::Update if cols.is_empty() => return Ok(()),
        WriteOp::Update => {
            let sets: Vec<_> = cols.iter().map(|c| format!("{c} = ?")).collect();
            format!("UPDATE \"{table}\" SET {} WHERE \"id\" = ? AND \"{fk}\" = ?", sets.join(", "))
        }
        WriteOp::Create => {
            let mut cols = cols;
            cols.push(format!("\"{fk}\""));
            params.push(SqlValue::Int(parent_id));
            for (col, id) in owner_cols(owner) {
                cols.push(format!("\"{col}\""));
                params.push(SqlValue::Int(id));
            }
            let marks = vec!["?"; cols.len()].join(", ");
            format!("INSERT INTO \"{table}\" ({}) VALUES ({marks})", cols.join(", "))
        }
    };
    if p.row.op != WriteOp::Create {
        params.push(SqlValue::Int(p.row.id.unwrap_or_default()));
        params.push(SqlValue::Int(parent_id));
    }
    conn.execute(&sql, &params).await.map_err(|e| {
        let mut err = map_write_error(e, &child.entity);
        if let Some(mut fields) = err.fields.take() {
            // a coluna do pai entra no índice único (`UNIQUE (company_id, email)`), mas não é da linha
            fields.remove(fk);
            let mut prefixed = FieldErrors::default();
            prefixed.absorb(&p.row.index.map_or(format!("{table}."), |i| format!("{table}.{i}.")), fields);
            err.fields = Some(prefixed);
        } else if p.row.op == WriteOp::Delete {
            err.message = "Uma das linhas removidas está em uso por outros registros.".into();
        }
        err
    })?;
    Ok(())
}
