//! Prévia da ação (`preview: true`): `POST /{entity}/{id}/_actions/{action}/_preview` com o input (ou, na ação da
//! lista, `POST /{entity}/_actions/{action}/_preview` com `{ input }`; na ação em conjunto, a mesma rota com
//! `{ ids, input }`). Antes de confirmar, o usuário vê o que a ação
//! vai fazer, calculado pelo sistema (`Hooks::preview_action`): os encargos da baixa, os itens do XML casados. Nada
//! é gravado. O motor confere o mesmo que ao rodar, mas o input pode estar pela metade: falta de campo não barra.

use axum::http::request::Parts;
use serde::Serialize;
use serde_json::{json, Map, Value};

use crate::action::{bulk_body, check_record, find, Body};
use crate::action_input::check_partial;
use crate::action_list::list_input;
use crate::action_prefill::grid_rows;
use crate::action_together::check_all;
use crate::crud::{allow_read, parse_path_id, Owner};
use crate::error::ApiError;
use crate::org::Ctx;
use crate::version::Expect;
use crate::{Engine, RequestContext};

/// Pedido de `Hooks::preview_action`.
pub struct PreviewCall<'a> {
    pub entity: &'a str,
    pub action: &'a str,
    /// Id e registro (ação de registro); `None` na da lista e na seleção de uma ação em conjunto.
    pub id: Option<&'a str>,
    pub record: Option<&'a Map<String, Value>>,
    /// Ação em conjunto (`bulk: "together"`): os ids marcados (no detalhe, só o do registro). Vazio nas outras.
    pub ids: &'a [String],
    /// Input validado como ao rodar, mas com o que falta preencher em `null`.
    pub input: &'a Map<String, Value>,
    pub ctx: &'a RequestContext<'a>,
}

/// O que o diálogo mostra antes de confirmar.
#[derive(Debug, Default)]
pub struct Preview {
    /// Texto da prévia ("Juros de R$ 3,20 e multa de R$ 2,00 até hoje.").
    pub message: Option<String>,
    /// Valores para os campos do input que o usuário deixou vazios (formato trafegado).
    pub fill: Map<String, Value>,
    /// Tabela só de leitura (as parcelas novas, os itens casados).
    pub table: Option<PreviewTable>,
}

#[derive(Debug, Default, Serialize)]
pub struct PreviewTable {
    pub columns: Vec<PreviewColumn>,
    /// Uma linha por objeto, com as chaves de `columns`; o resto é descartado.
    pub rows: Vec<Map<String, Value>>,
}

#[derive(Debug, Serialize)]
pub struct PreviewColumn {
    pub name: String,
    pub label: String,
}

impl PreviewColumn {
    pub fn new(name: impl Into<String>, label: impl Into<String>) -> Self {
        PreviewColumn {
            name: name.into(),
            label: label.into(),
        }
    }
}

/// `{ message, fill, table }`.
pub(crate) async fn preview(
    engine: &Engine,
    req: &Parts,
    name: &str,
    id: Option<&str>,
    action_name: &str,
    body: Body,
) -> Result<Value, ApiError> {
    let entity = engine.entity(name)?;
    let action = find(entity, action_name)?;
    // registro: ação de registro; sem id: ação da lista ou seleção de uma ação em conjunto
    let route_ok = match id {
        Some(_) => !action.list,
        None => action.list || action.together,
    };
    if !action.preview || !route_ok {
        return Err(ApiError::not_found(format!("Ação '{action_name}' não tem prévia nesta rota.")));
    }
    let ctx = Ctx::new(engine, req).await?;
    let mut conn = engine.0.store.conn().await?;
    let (record, ids, input) = match id {
        Some(id) => {
            allow_read(&ctx, entity, |c| c.read)?;
            let row_id = parse_path_id(id)?;
            let (record, owner) = check_record(&mut *conn, &ctx, req, entity, action, row_id, &Expect::default()).await?;
            let input = crate::action_grid::parse(action, &body?)?;
            let input = check_partial(&mut *conn, &ctx, action, owner, input).await?;
            let ids = if action.together { vec![id.to_string()] } else { Vec::new() };
            (Some(record), ids, input)
        }
        None if action.together => {
            allow_read(&ctx, entity, |c| c.read)?;
            let (ids, raw) = bulk_body(body?)?;
            let raw = crate::action_grid::parse(action, &raw)?;
            check_partial(&mut *conn, &ctx, action, Owner::default(), raw.clone()).await?;
            drop(conn);
            let checked = check_all(&ctx, req, entity, action, &ids, &raw, true).await?;
            conn = engine.0.store.conn().await?;
            (None, ids, checked.input)
        }
        None => {
            allow_read(&ctx, entity, |c| c.list)?;
            let active = ctx.active();
            let branch = active.map(|b| b.id.to_string());
            if !engine.0.hooks.action_allowed(name, action_name, branch.as_deref(), req) {
                return Err(ApiError::forbidden());
            }
            let owner = active.map_or_else(Owner::default, |b| Owner::of_new(entity, b));
            let input = crate::action_grid::parse(action, &list_input(body?)?)?;
            let input = check_partial(&mut *conn, &ctx, action, owner, input).await?;
            (None, Vec::new(), input)
        }
    };
    drop(conn);

    let rc = ctx.request_context();
    let call = PreviewCall {
        entity: name,
        action: action_name,
        id,
        record: record.as_ref(),
        ids: &ids,
        input: &input,
        ctx: &rc,
    };
    let Preview { message, fill, table } = engine.0.hooks.preview_action(call).await?;
    // campos simples do input e grades (as linhas trocam as da tela; só as colunas que a grade declara)
    let mut out = Map::new();
    for (k, v) in fill {
        if action.input.field(&k).is_some() {
            out.insert(k, v);
        } else if let Some(grid) = action.grids.iter().find(|g| g.name == k) {
            out.insert(k, grid_rows(grid, v));
        }
    }
    let fill = out;
    let table = table.map(|mut t| {
        for row in &mut t.rows {
            row.retain(|k, _| t.columns.iter().any(|c| c.name == *k));
        }
        t
    });
    Ok(json!({ "message": message, "fill": fill, "table": table }))
}
