//! Ações de registro: `POST /{entity}/{id}/_actions/{action}` e, em lote, `POST /{entity}/_actions/{action}`
//! (spec/README.md#ações).
//!
//! O motor confere permissão, escopo, `visibleWhen` e input; a execução é do sistema (`Hooks::run_action`),
//! porque cancelar uma venda ou reemitir uma nota nunca é um UPDATE genérico.

use axum::http::request::Parts;
use serde_json::{json, Map, Value};

pub(crate) use crate::action_input::{check_input, parse_input};
use crate::action_reply::{reply, ActionReply};
use crate::crud::{allow_read, fetch_one, parse_path_id, Owner};
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::{Action, Entity, Scope};
use crate::validation::normalize_refs;
use crate::version::Expect;
use crate::{Change, Conn, Engine, RequestContext, Store};

/// O que o sistema recebe para executar uma ação.
pub struct ActionCall<'a> {
    pub entity: &'a str,
    pub action: &'a str,
    /// Id do registro, como veio na URL (já conferido: existe e está no escopo do usuário).
    pub id: &'a str,
    /// Registro antes da ação, no formato trafegado (reference lido vem `{ id, title }`).
    pub record: &'a Map<String, Value>,
    /// Input validado, no formato trafegado: todo campo do input presente, escondido ou vazio vem `null`.
    pub input: &'a Map<String, Value>,
    /// Requisição e filial ativa (o usuário está em `ctx.req.extensions`, posto pelo middleware do sistema).
    pub ctx: &'a RequestContext<'a>,
    /// Banco do motor, para o sistema que grava pelo mesmo `Store`. Quem tem escritor próprio ignora.
    pub store: &'a dyn Store,
}

/// Máximo de registros num pedido em lote: a fila de pendências pagina, e o sistema roda um por um.
pub const BULK_LIMIT: usize = 100;

/// Corpo do pedido já lido como objeto; o erro de leitura só vale depois das conferências de rota e permissão.
pub(crate) type Body = Result<Map<String, Value>, ApiError>;

/// `{ data, message }`: o registro relido depois da ação e o aviso do sistema.
pub(crate) async fn run(
    engine: &Engine,
    req: &Parts,
    name: &str,
    id: &str,
    action_name: &str,
    body: Body,
) -> Result<ActionReply, ApiError> {
    let entity = engine.entity(name)?;
    let action = find(entity, action_name)?;
    if action.list {
        return Err(ApiError::not_found(format!(
            "Ação '{action_name}' é da lista: POST /{name}/_actions/{action_name}."
        )));
    }
    let ctx = Ctx::new(engine, req).await?;
    allow_read(&ctx, entity, |c| c.read)?;
    let row_id = parse_path_id(id)?;
    let expect = Expect::from(req)?;
    expect.allow_undo(entity, Some(action_name))?;

    let mut conn = engine.0.store.conn().await?;
    let (record, owner) = check_record(&mut *conn, &ctx, req, entity, action, row_id, &expect).await?;
    let input = crate::action_grid::parse(action, &body?)?;
    let input = check_input(&mut *conn, &ctx, action, owner, input).await?;
    // a conexão é solta antes da regra do sistema, que pode precisar dela (ou do lock de escrita)
    drop(conn);

    let reply = if action.together {
        crate::action_grid::check_selection(&action.grids, &input, std::slice::from_ref(&id.to_owned()))?;
        crate::action_together::run_one(&ctx, entity, action, id, row_id, record, &input).await?
    } else {
        execute(&ctx, entity, action, id, row_id, &record, &input).await?
    };
    // a ação pode ter mudado, tirado do escopo ou apagado o registro: quem está com a tela aberta relê
    engine.emit(name, Some(id), Change::Updated);
    Ok(reply)
}

/// `POST /{entity}/_actions/{action}` com `{ ids, input }`: a mesma ação, com o mesmo input, em cada registro.
/// Cada registro é independente: o que falha volta com o erro dele e não desfaz os outros. Com
/// `bulk: "together"`, é um fato só sobre todos (`action_together`).
/// Ação da lista (`target: list`) também chega por aqui: mesma rota, sem `ids`.
pub(crate) async fn run_bulk(engine: &Engine, req: &Parts, name: &str, action_name: &str, body: Body) -> Result<ActionReply, ApiError> {
    let entity = engine.entity(name)?;
    let action = find(entity, action_name)?;
    if action.list {
        let reply = crate::action_list::run(engine, entity, action, req, body).await?;
        engine.emit(name, None, Change::Changed);
        return Ok(reply);
    }
    if !action.bulk {
        return Err(ApiError::not_found(format!("Ação '{action_name}' não roda em lote.")));
    }
    let ctx = Ctx::new(engine, req).await?;
    allow_read(&ctx, entity, |c| c.read)?;

    let (ids, input) = bulk_body(body?)?;
    // o input é um só: erro nele vale para todos e volta como 422, antes de tocar em qualquer registro
    let raw_input = crate::action_grid::parse(action, &input)?;
    let mut conn = engine.0.store.conn().await?;
    check_input(&mut *conn, &ctx, action, Owner::default(), raw_input.clone()).await?;
    drop(conn);
    if action.together {
        let reply = crate::action_together::run(&ctx, req, entity, action, &ids, &raw_input).await?;
        engine.emit(name, None, Change::Changed);
        return Ok(reply);
    }

    let mut results = Vec::with_capacity(ids.len());
    let mut done = 0;
    for id in &ids {
        let one = async {
            let row_id = parse_path_id(id)?;
            let mut conn = engine.0.store.conn().await?;
            let (record, owner) = check_record(&mut *conn, &ctx, req, entity, action, row_id, &Expect::default()).await?;
            // reference no input confere de novo contra a empresa/filial de cada registro
            let input = check_input(&mut *conn, &ctx, action, owner, raw_input.clone()).await?;
            drop(conn);
            execute(&ctx, entity, action, id, row_id, &record, &input).await?.into_json()
        };
        match one.await {
            Ok(mut v) => {
                // em lote a shell fica na lista: `open` não vale
                if let Some(o) = v.as_object_mut() {
                    o.remove("open");
                }
                done += 1;
                engine.emit(name, Some(id), Change::Updated);
                v["id"] = json!(id);
                v["ok"] = json!(true);
                results.push(v);
            }
            Err(e) => results.push(json!({ "id": id, "ok": false, "error": e.body() })),
        }
    }
    Ok(ActionReply::Json(
        json!({ "results": results, "meta": { "ok": done, "failed": ids.len() - done } }),
    ))
}

/// Corpo do lote: `{ ids, input }`, com 1 a `BULK_LIMIT` ids sem repetição.
pub(crate) fn bulk_body(mut body: Map<String, Value>) -> Result<(Vec<String>, Map<String, Value>), ApiError> {
    let bad = || {
        ApiError::bad_request(format!(
            "Corpo precisa ser {{ \"ids\": [...], \"input\": {{...}} }} com 1 a {BULK_LIMIT} ids."
        ))
    };
    if let Some(key) = body.keys().find(|k| *k != "ids" && *k != "input") {
        return Err(ApiError::bad_request(format!("Campo desconhecido '{key}'.")));
    }
    let ids: Vec<String> = match body.remove("ids") {
        Some(Value::Array(a)) => a
            .into_iter()
            .map(|v| v.as_str().map(str::to_owned))
            .collect::<Option<_>>()
            .ok_or_else(bad)?,
        _ => return Err(bad()),
    };
    if ids.is_empty() || ids.len() > BULK_LIMIT || ids.iter().enumerate().any(|(i, id)| ids[..i].contains(id)) {
        return Err(bad());
    }
    let input = match body.remove("input") {
        None | Some(Value::Null) => Map::new(),
        Some(Value::Object(o)) => o,
        Some(_) => return Err(ApiError::bad_request("input precisa ser um objeto JSON.")),
    };
    Ok((ids, input))
}

pub(crate) fn find<'a>(entity: &'a Entity, name: &str) -> Result<&'a Action, ApiError> {
    entity
        .action(name)
        .ok_or_else(|| ApiError::not_found(format!("Ação '{name}' não existe.")))
}

/// Registro existe e está no escopo (404), permissão da ação na filial dona (403), versão do `If-Match` (412),
/// `visibleWhen` (409).
pub(crate) async fn check_record(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    req: &Parts,
    entity: &Entity,
    action: &Action,
    row_id: i64,
    expect: &Expect,
) -> Result<(Map<String, Value>, Owner), ApiError> {
    let record = fetch_one(conn, ctx, entity, row_id)
        .await?
        .ok_or_else(|| ApiError::not_found("Registro não encontrado."))?;

    // permissão na filial dona do registro (ou na ativa, em entidade sem filial), como no CRUD
    let owner = Owner::of(&record);
    let branch = match entity.scope {
        Scope::Branch => owner.branch,
        _ => ctx.active().map(|b| b.id),
    }
    .map(|b| b.to_string());
    let allowed = ctx.can_write(entity, owner, |c| c.read)
        && ctx
            .engine
            .0
            .hooks
            .action_allowed(&entity.name, &action.name, branch.as_deref(), req);
    if !allowed {
        return Err(ApiError::forbidden());
    }
    expect.check(ctx, entity, &record)?;

    let mut plain = record.clone();
    normalize_refs(entity, &mut plain);
    if action.visible_when.as_ref().is_some_and(|c| !c.eval(&plain, entity)) {
        return Err(ApiError::conflict("Esta ação não está disponível para este registro.", None));
    }
    Ok((record, owner))
}

/// Chama a regra do sistema e relê o registro: `{ data, message, open? }`, ou o arquivo (`returns: "file"`).
async fn execute(
    ctx: &Ctx<'_>,
    entity: &Entity,
    action: &Action,
    id: &str,
    row_id: i64,
    record: &Map<String, Value>,
    input: &Map<String, Value>,
) -> Result<ActionReply, ApiError> {
    let engine = ctx.engine;
    let rc = ctx.request_context();
    let outcome = engine
        .0
        .hooks
        .run_action(ActionCall {
            entity: &entity.name,
            action: &action.name,
            id,
            record,
            input,
            ctx: &rc,
            store: &*engine.0.store,
        })
        .await?;
    reread_reply(ctx, entity, action, row_id, outcome).await
}

/// Resposta da ação de um registro: o arquivo, ou `{ data, message, open? }` com o registro relido.
pub(crate) async fn reread_reply(
    ctx: &Ctx<'_>,
    entity: &Entity,
    action: &Action,
    row_id: i64,
    outcome: crate::ActionOutcome,
) -> Result<ActionReply, ApiError> {
    let engine = ctx.engine;
    if outcome.file.is_some() {
        return reply(engine, entity, action, outcome, None);
    }

    // a ação pode ter mudado o registro, tirado do escopo ou apagado
    let mut conn = engine.0.store.conn().await?;
    let data = match fetch_one(&mut *conn, ctx, entity, row_id).await? {
        Some(mut r) => {
            ctx.attach_can(entity, &mut r);
            Value::Object(r)
        }
        None => Value::Null,
    };
    reply(engine, entity, action, outcome, Some(data))
}
