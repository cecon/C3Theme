//! Desconto no preço do produto, com prévia (`preview: true`): o diálogo mostra o preço novo calculado pelo sistema
//! e preenche o campo enquanto o usuário não digitar outro.

use c3_engine::{ActionCall, ActionOutcome, ApiError, Preview, PreviewCall, PreviewColumn, PreviewTable};
use serde_json::{json, Map, Value};
use sqlx::SqlitePool;

use crate::prices::cents;

fn brl(cents: i64) -> String {
    format!("R$ {},{:02}", cents / 100, cents % 100)
}

fn decimal(cents: i64) -> String {
    format!("{}.{:02}", cents / 100, cents % 100)
}

/// Preço atual, desconto e preço novo. Sem o percentual ainda, só o pedido.
pub fn preview(call: PreviewCall<'_>) -> Result<Preview, ApiError> {
    let current = call
        .record
        .and_then(|r| r["price"].as_str())
        .and_then(cents)
        .ok_or_else(ApiError::internal)?;
    let Some(percent) = call.input["percent"].as_str().and_then(cents) else {
        return Ok(Preview {
            message: Some("Informe o desconto para ver o preço novo.".into()),
            ..Default::default()
        });
    };
    // percent vem em centésimos (10.5% = 1050): preço × (10000 − p) / 10000, arredondado
    let new = (current * (10_000 - percent) + 5_000) / 10_000;
    let row = |item: &str, value: String| -> Map<String, Value> {
        Map::from_iter([("item".to_owned(), json!(item)), ("value".to_owned(), json!(value))])
    };
    Ok(Preview {
        message: Some(format!("De {} para {}.", brl(current), brl(new))),
        fill: Map::from_iter([("price".to_owned(), json!(decimal(new)))]),
        table: Some(PreviewTable {
            columns: vec![PreviewColumn::new("item", "Item"), PreviewColumn::new("value", "Valor")],
            rows: vec![
                row("Preço atual", brl(current)),
                row("Desconto", brl(current - new)),
                row("Preço novo", brl(new)),
            ],
        }),
    })
}

/// Grava o preço novo que o usuário confirmou (o da prévia ou outro que ele digitou).
pub async fn apply(pool: &SqlitePool, call: ActionCall<'_>) -> Result<ActionOutcome, ApiError> {
    let id: i64 = call.id.parse().map_err(|_| ApiError::internal())?;
    let price = call.input["price"].as_str().and_then(cents).ok_or_else(ApiError::internal)?;
    sqlx::query("UPDATE product SET price = ? WHERE id = ?")
        .bind(price)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(ActionOutcome::message(format!("Preço novo: {}.", brl(price))))
}
