//! Indicações em lote (`customer.referrals`): ação da lista com um `reference` filtrado no input e uma grade em que o
//! cliente de cada linha só pode ser da empresa escolhida na mesma linha (`$field` na coluna). O motor já conferiu
//! os dois filtros; aqui só a gravação.

use c3_engine::{ActionOutcome, ApiError, ListActionCall};
use sqlx::SqlitePool;

pub async fn apply(pool: &SqlitePool, call: ListActionCall<'_>) -> Result<ActionOutcome, ApiError> {
    let referrer: i64 = call.input["referrer"]
        .as_str()
        .and_then(|s| s.parse().ok())
        .ok_or_else(ApiError::internal)?;
    let links = call.input["links"].as_array().cloned().unwrap_or_default();
    let mut tx = pool.begin().await?;
    for link in &links {
        let id: i64 = link["customer"]
            .as_str()
            .and_then(|s| s.parse().ok())
            .ok_or_else(ApiError::internal)?;
        sqlx::query("UPDATE customer SET referred_by = ? WHERE id = ? AND id <> ?")
            .bind(referrer)
            .bind(id)
            .bind(referrer)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(ActionOutcome::message(format!("{} indicação(ões) registrada(s).", links.len())))
}
