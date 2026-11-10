//! Ação em conjunto (`bulk: "together"`): um fato só sobre várias linhas, como receber vários recebíveis de cartão
//! num movimento com o líquido somado. Mesma rota do lote (`POST /{entity}/_actions/{action}` com `{ ids, input }`),
//! mas o sistema executa uma vez (`Hooks::run_bulk_action`), tudo ou nada.
//!
//! O motor confere cada registro como na ação de um (404, 403 na filial dona, 409 do `visibleWhen`, `reference` do
//! input fora da empresa ou filial dele) antes de chamar o sistema; qualquer recusa recusa o pedido inteiro, com o
//! erro de cada registro barrado. A conferência não segura o estado: o sistema confere de novo na transação dele.

use std::collections::HashMap;

use axum::http::request::Parts;
use serde_json::{Map, Value};

use crate::action::{check_input, check_loaded, check_record, reread_reply};
use crate::action_input::check_partial;
use crate::action_reply::{reply, ActionReply};
use crate::crud::parse_path_id;
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::{Action, Entity};
use crate::version::Expect;
use crate::{RequestContext, Store};

/// O que o sistema recebe para executar uma ação em conjunto.
pub struct BulkActionCall<'a> {
    pub entity: &'a str,
    pub action: &'a str,
    /// Ids marcados, na ordem do pedido (já conferidos: existem, estão no escopo, a ação vale para cada um).
    /// Na ação rodada do detalhe de um registro, só ele.
    pub ids: &'a [String],
    /// Registros antes da ação, na ordem de `ids`, no formato trafegado.
    pub records: &'a [Map<String, Value>],
    /// Input validado, no formato trafegado, como em `ActionCall::input`.
    pub input: &'a Map<String, Value>,
    /// Consulta do sistema (`source: system`): os parâmetros que estavam valendo na lista (`p.<nome>` da URL),
    /// validados. Vazio numa entidade com tabela.
    pub params: &'a Map<String, Value>,
    pub ctx: &'a RequestContext<'a>,
    pub store: &'a dyn Store,
}

/// Registros conferidos e o input validado (completo para rodar, pela metade na prévia).
pub(crate) struct Checked {
    pub records: Vec<Map<String, Value>>,
    pub input: Map<String, Value>,
    /// Consulta do sistema: os parâmetros com que as linhas foram lidas (vazio numa tabela).
    pub params: Map<String, Value>,
}

/// Confere todos os ids; com qualquer recusa, nada roda. Um id só devolve o erro dele, como na ação de um registro.
pub(crate) async fn check_all(
    ctx: &Ctx<'_>,
    req: &Parts,
    entity: &Entity,
    action: &Action,
    ids: &[String],
    raw_input: &Map<String, Value>,
    partial: bool,
) -> Result<Checked, ApiError> {
    let engine = ctx.engine;
    let mut records = Vec::with_capacity(ids.len());
    let mut refused = Vec::new();
    let mut input = Map::new();
    // consulta do sistema: as linhas vêm da consulta com os parâmetros da URL, lida uma vez só
    let (mut picked, params) = match &entity.source {
        Some(src) => {
            let q: HashMap<String, String> = form_urlencoded::parse(req.uri.query().unwrap_or_default().as_bytes())
                .into_owned()
                .collect();
            let wanted: Vec<i64> = ids.iter().filter_map(|i| parse_path_id(i).ok()).collect();
            let (rows, params) = crate::crud::source::picked_rows(ctx, entity, src, &q, &wanted).await?;
            (Some(rows), params)
        }
        None => (None, Map::new()),
    };
    for id in ids {
        let one = async {
            let row_id = parse_path_id(id)?;
            let mut conn = engine.0.store.conn().await?;
            let (record, owner) = match picked.as_mut() {
                Some(rows) => {
                    let row = rows
                        .remove(&row_id)
                        .ok_or_else(|| ApiError::not_found("Registro não encontrado."))?;
                    check_loaded(ctx, req, entity, action, row, &Expect::default())?
                }
                None => check_record(&mut *conn, ctx, req, entity, action, row_id, &Expect::default()).await?,
            };
            // reference no input confere contra a empresa/filial de cada registro
            let input = if partial {
                check_partial(&mut *conn, ctx, action, owner, raw_input.clone()).await?
            } else {
                check_input(&mut *conn, ctx, action, owner, raw_input.clone()).await?
            };
            Ok::<_, ApiError>((record, input))
        };
        match one.await {
            Ok((record, checked)) => {
                records.push(record);
                input = checked;
            }
            Err(e) => refused.push((id.clone(), e)),
        }
    }
    if refused.len() == 1 && ids.len() == 1 {
        return Err(refused.remove(0).1);
    }
    if !refused.is_empty() {
        return Err(ApiError::refused(ids.len(), refused));
    }
    if !partial {
        crate::action_grid::check_selection(&action.grids, &input, ids)?;
    }
    Ok(Checked { records, input, params })
}

/// Lote em conjunto: `{ message, open? }` ou o arquivo. Os registros não voltam: a shell relê a lista.
pub(crate) async fn run(
    ctx: &Ctx<'_>,
    req: &Parts,
    entity: &Entity,
    action: &Action,
    ids: &[String],
    raw_input: &Map<String, Value>,
) -> Result<ActionReply, ApiError> {
    let Checked { records, input, params } = check_all(ctx, req, entity, action, ids, raw_input, false).await?;
    let outcome = call(ctx, entity, action, ids, &records, &input, &params).await?;
    reply(ctx.engine, entity, action, outcome, None)
}

/// A mesma ação rodada no detalhe de um registro: o sistema recebe só ele, e a resposta relê o registro.
pub(crate) async fn run_one(
    ctx: &Ctx<'_>,
    entity: &Entity,
    action: &Action,
    id: &str,
    row_id: i64,
    record: Map<String, Value>,
    input: &Map<String, Value>,
) -> Result<ActionReply, ApiError> {
    let ids = [id.to_string()];
    let outcome = call(ctx, entity, action, &ids, &[record], input, &Map::new()).await?;
    reread_reply(ctx, entity, action, row_id, outcome).await
}

async fn call(
    ctx: &Ctx<'_>,
    entity: &Entity,
    action: &Action,
    ids: &[String],
    records: &[Map<String, Value>],
    input: &Map<String, Value>,
    params: &Map<String, Value>,
) -> Result<crate::ActionOutcome, ApiError> {
    let rc = ctx.request_context();
    ctx.engine
        .0
        .hooks
        .run_bulk_action(BulkActionCall {
            entity: &entity.name,
            action: &action.name,
            ids,
            records,
            input,
            params,
            ctx: &rc,
            store: &*ctx.engine.0.store,
        })
        .await
}
