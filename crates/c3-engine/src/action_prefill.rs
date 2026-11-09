//! Valores iniciais do input de uma ação (`prefill: true`): `GET /{entity}/{id}/_actions/{action}/_prefill` e, na
//! ação da lista, `GET /{entity}/_actions/{action}/_prefill`. Fechar o caixa abre com uma linha por forma de
//! pagamento e o valor esperado; quem sabe isso é o sistema (`Hooks::action_prefill`). O motor confere o mesmo que
//! ao rodar (permissão, escopo, `visibleWhen`) e devolve só os campos que o input declara.

use axum::http::request::Parts;
use serde_json::{json, Map, Value};

use crate::action::{check_record, find};
use crate::action_grid::GridInput;
use crate::crud::{allow_read, parse_path_id};
use crate::error::ApiError;
use crate::org::Ctx;
use crate::version::Expect;
use crate::{Engine, RequestContext};

/// Pedido de `Hooks::action_prefill`.
pub struct PrefillCall<'a> {
    pub entity: &'a str,
    pub action: &'a str,
    /// Id do registro (ação de registro); `None` na ação da lista.
    pub id: Option<&'a str>,
    /// Registro no formato trafegado (ação de registro); `None` na da lista.
    pub record: Option<&'a Map<String, Value>>,
    pub ctx: &'a RequestContext<'a>,
}

/// `{ data }`: os valores iniciais do input, no formato trafegado (grade como lista de linhas).
pub(crate) async fn prefill(engine: &Engine, req: &Parts, name: &str, id: Option<&str>, action_name: &str) -> Result<Value, ApiError> {
    let entity = engine.entity(name)?;
    let action = find(entity, action_name)?;
    if !action.prefill || action.list != id.is_none() {
        return Err(ApiError::not_found(format!(
            "Ação '{action_name}' não tem valores iniciais nesta rota."
        )));
    }
    let ctx = Ctx::new(engine, req).await?;
    let record = match id {
        Some(id) => {
            allow_read(&ctx, entity, |c| c.read)?;
            let row_id = parse_path_id(id)?;
            let mut conn = engine.0.store.conn().await?;
            let (record, _) = check_record(&mut *conn, &ctx, req, entity, action, row_id, &Expect::default()).await?;
            Some(record)
        }
        None => {
            allow_read(&ctx, entity, |c| c.list)?;
            let active = ctx.active().map(|b| b.id.to_string());
            if !engine.0.hooks.action_allowed(name, action_name, active.as_deref(), req) {
                return Err(ApiError::forbidden());
            }
            None
        }
    };
    let rc = ctx.request_context();
    let values = engine
        .0
        .hooks
        .action_prefill(PrefillCall {
            entity: name,
            action: action_name,
            id,
            record: record.as_ref(),
            ctx: &rc,
        })
        .await?;
    let mut data = Map::new();
    for (k, v) in values {
        if action.input.field(&k).is_some() {
            data.insert(k, v);
        } else if let Some(grid) = action.grids.iter().find(|g| g.name == k) {
            data.insert(k, grid_rows(grid, v));
        }
    }
    Ok(json!({ "data": data }))
}

/// Linhas da grade só com as colunas que ela declara; o que não é lista vira lista vazia.
fn grid_rows(grid: &GridInput, value: Value) -> Value {
    let Value::Array(rows) = value else {
        return Value::Array(Vec::new());
    };
    rows.into_iter()
        .filter_map(|row| match row {
            Value::Object(cols) => Some(Value::Object(
                cols.into_iter().filter(|(c, _)| grid.row.field(c).is_some()).collect(),
            )),
            _ => None,
        })
        .collect()
}
