//! Input da ação: o objeto vira os campos de `action.input` (400 no desconhecido) e passa pelas regras dos campos
//! (422), como no CRUD. A prévia (`preview`) valida o mesmo, mas aceita o que ainda falta preencher.

use serde_json::{Map, Value};

use crate::crud::{writable, Owner};
use crate::error::{ApiError, FieldErrors};
use crate::org::Ctx;
use crate::spec::{Action, Entity, FieldType};
use crate::validation::{check_fields, is_visible};
use crate::Conn;

/// Valida o input (422) e devolve o que o sistema recebe: todo campo, escondido ou vazio como `null`, como no CRUD.
pub(crate) async fn check_input(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    action: &Action,
    owner: Owner,
    input: Map<String, Value>,
) -> Result<Map<String, Value>, ApiError> {
    check(conn, ctx, action, owner, input, false).await
}

/// Para a prévia: o input ainda pela metade vale; só falta de campo (`required`, `min_items`) não barra.
pub(crate) async fn check_partial(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    action: &Action,
    owner: Owner,
    input: Map<String, Value>,
) -> Result<Map<String, Value>, ApiError> {
    check(conn, ctx, action, owner, input, true).await
}

async fn check(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    action: &Action,
    owner: Owner,
    mut input: Map<String, Value>,
    partial: bool,
) -> Result<Map<String, Value>, ApiError> {
    let mut errors = FieldErrors::default();
    let rows = crate::action_grid::take(&action.grids, &mut input);
    check_fields(conn, ctx, &action.input, owner, &input, false, &mut errors).await?;
    let lines = crate::action_grid::check(conn, ctx, &action.grids, owner, &rows, &mut errors).await?;
    if partial {
        errors.retain(|code| code != "required" && code != "min_items");
    }
    if !errors.is_empty() {
        return Err(ApiError::validation(errors));
    }
    let mut out: Map<String, Value> = writable(&action.input)
        .map(|f| {
            let v = input.get(&f.name).cloned().unwrap_or(Value::Null);
            let keep = is_visible(&action.input, f, &input) && !(f.ty.is_textual() && v == "");
            (f.name.clone(), if keep { v } else { Value::Null })
        })
        .collect();
    out.extend(lines);
    Ok(out)
}

/// Input = objeto com os campos de `action.input`. Campo desconhecido → 400; ausente recebe o default.
pub(crate) fn parse_input(input: &Entity, obj: &Map<String, Value>) -> Result<Map<String, Value>, ApiError> {
    let mut obj = obj.clone();
    if let Some(key) = obj.keys().find(|k| input.field(k).is_none()) {
        return Err(ApiError::bad_request(format!("Campo desconhecido '{key}'.")));
    }
    for f in &input.fields {
        if !obj.contains_key(&f.name) {
            obj.insert(f.name.clone(), f.default.clone().unwrap_or(Value::Null));
        }
        // reference no input vai como id; aceita também { id, title } por conveniência
        if f.ty == FieldType::Reference {
            if let Some(Value::Object(o)) = obj.get(&f.name) {
                let id = o.get("id").cloned().unwrap_or(Value::Null);
                obj.insert(f.name.clone(), id);
            }
        }
    }
    Ok(obj)
}
