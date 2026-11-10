//! Reajuste de preços (`product.reprice`): ação da lista com grade no input. Abre com os produtos ativos e o preço de
//! hoje (`action_prefill`) e grava todas as linhas numa transação (`run_list_action`).

use c3_engine::{ActionOutcome, ApiError, ListActionCall, PrefillCall};
use serde_json::{json, Map, Value};
use sqlx::{Row, SqlitePool};

/// Uma linha por produto ativo, no formato trafegado: reference `{ id, title }` e decimal como string.
pub async fn prefill(pool: &SqlitePool, call: PrefillCall<'_>) -> Result<Map<String, Value>, ApiError> {
    if (call.entity, call.action) != ("product", "reprice") {
        return Ok(Map::new());
    }
    let rows = sqlx::query("SELECT id, name, price FROM product WHERE active = 1 ORDER BY name LIMIT 200")
        .fetch_all(pool)
        .await?;
    let lines: Vec<Value> = rows
        .iter()
        .map(|r| {
            let cents: i64 = r.get("price");
            json!({
                "product": { "id": r.get::<i64, _>("id").to_string(), "title": r.get::<String, _>("name") },
                "price": format!("{}.{:02}", cents / 100, cents % 100),
                // coluna que a grade não declara: o motor tira antes de responder
                "cents": cents,
            })
        })
        .collect();
    Ok(Map::from_iter([("prices".to_owned(), Value::Array(lines))]))
}

/// Grava os preços. O motor já validou cada linha (obrigatório, mínimo, casas); aqui só o que é do negócio: o
/// produto existir.
pub async fn apply(pool: &SqlitePool, call: ListActionCall<'_>) -> Result<ActionOutcome, ApiError> {
    let lines = call.input["prices"].as_array().cloned().unwrap_or_default();
    let mut tx = pool.begin().await?;
    for line in &lines {
        let id: i64 = line["product"]
            .as_str()
            .and_then(|s| s.parse().ok())
            .ok_or_else(ApiError::internal)?;
        let cents = cents(line["price"].as_str().unwrap_or_default()).ok_or_else(ApiError::internal)?;
        let done = sqlx::query("UPDATE product SET price = ? WHERE id = ?")
            .bind(cents)
            .bind(id)
            .execute(&mut *tx)
            .await?;
        if done.rows_affected() == 0 {
            return Err(ApiError::conflict(format!("Produto {id} não existe mais."), None));
        }
    }
    tx.commit().await?;
    Ok(ActionOutcome::message(format!("{} preço(s) aplicado(s).", lines.len())))
}

/// "12.5" → 1250 (decimal com scale 2, já validado pelo motor).
pub fn cents(s: &str) -> Option<i64> {
    let (int, frac) = s.split_once('.').unwrap_or((s, ""));
    let frac = format!("{frac:0<2}");
    Some(int.parse::<i64>().ok()? * 100 + frac.get(..2)?.parse::<i64>().ok()?)
}

/// Prévia do reajuste: com o percentual, a grade se refaz com o preço de hoje mais o reajuste (`fill.prices`); o
/// que o usuário digitou numa linha do mesmo produto a shell mantém.
pub async fn preview(pool: &SqlitePool, call: c3_engine::PreviewCall<'_>) -> Result<c3_engine::Preview, ApiError> {
    let signed = |s: &str| s.strip_prefix('-').map_or_else(|| cents(s), |abs| cents(abs).map(|c| -c));
    let Some(percent) = call.input["percent"].as_str().and_then(signed) else {
        return Ok(c3_engine::Preview::default());
    };
    let rows = sqlx::query("SELECT id, name, price FROM product WHERE active = 1 ORDER BY name LIMIT 200")
        .fetch_all(pool)
        .await?;
    let lines: Vec<Value> = rows
        .iter()
        .map(|r| {
            let now: i64 = r.get("price");
            // percent em centésimos (12,5% = 1250): preço × (10000 + p) / 10000, arredondado
            let next = (now * (10_000 + percent) + 5_000).div_euclid(10_000).max(0);
            json!({
                "product": { "id": r.get::<i64, _>("id").to_string(), "title": r.get::<String, _>("name") },
                "price": format!("{}.{:02}", next / 100, next % 100),
                "cents": next,
            })
        })
        .collect();
    Ok(c3_engine::Preview {
        message: Some(format!("{} produto(s) com o reajuste.", lines.len())),
        fill: Map::from_iter([("prices".to_owned(), Value::Array(lines))]),
        table: None,
    })
}
