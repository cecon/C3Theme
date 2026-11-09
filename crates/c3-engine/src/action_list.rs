//! Ação da lista (`target: list`): `POST /{entity}/_actions/{action}` com `{ input }`, sem registro (importar um
//! arquivo de chaves, aplicar um modelo de grupos contábeis). Como as de registro, o motor confere permissão e
//! input; quem executa é o sistema, em `Hooks::run_list_action`.

use axum::http::request::Parts;
use serde_json::{Map, Value};

use crate::action::{check_input, Body};
use crate::action_reply::{reply, ActionReply};
use crate::crud::{allow_read, Owner};
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::{Action, Entity};
use crate::{Engine, RequestContext, Store};

/// O que o sistema recebe para executar uma ação da lista.
pub struct ListActionCall<'a> {
    pub entity: &'a str,
    pub action: &'a str,
    /// Input validado, no formato trafegado, como em `ActionCall::input`.
    pub input: &'a Map<String, Value>,
    /// Requisição e filial ativa: a ação vale para a filial ativa (onde um registro novo seria gravado).
    pub ctx: &'a RequestContext<'a>,
    pub store: &'a dyn Store,
}

pub(crate) async fn run(engine: &Engine, entity: &Entity, action: &Action, req: &Parts, body: Body) -> Result<ActionReply, ApiError> {
    let ctx = Ctx::new(engine, req).await?;
    allow_read(&ctx, entity, |c| c.list)?;
    let active = ctx.active().map(|b| b.id.to_string());
    if !engine.0.hooks.action_allowed(&entity.name, &action.name, active.as_deref(), req) {
        return Err(ApiError::forbidden());
    }
    let input = list_input(body?)?;
    // reference no input confere contra a filial ativa, dona do que a ação criar
    let owner = ctx.active().map_or_else(Owner::default, |b| Owner::of_new(entity, b));
    let input = crate::action_grid::parse(action, &input)?;
    let mut conn = engine.0.store.conn().await?;
    let input = check_input(&mut *conn, &ctx, action, owner, input).await?;
    drop(conn);

    let rc = ctx.request_context();
    let call = ListActionCall {
        entity: &entity.name,
        action: &action.name,
        input: &input,
        ctx: &rc,
        store: &*engine.0.store,
    };
    let outcome = engine.0.hooks.run_list_action(call).await?;
    reply(engine, entity, action, outcome, None)
}

/// Corpo da ação da lista: `{ input }`, nada mais.
pub(crate) fn list_input(mut body: Map<String, Value>) -> Result<Map<String, Value>, ApiError> {
    if let Some(key) = body.keys().find(|k| *k != "input") {
        return Err(ApiError::bad_request(format!(
            "Campo desconhecido '{key}' (ação da lista recebe só input)."
        )));
    }
    match body.remove("input") {
        None | Some(Value::Null) => Ok(Map::new()),
        Some(Value::Object(o)) => Ok(o),
        Some(_) => Err(ApiError::bad_request("input precisa ser um objeto JSON.")),
    }
}
