//! Faturar pedidos juntos (`bulk: "together"`): uma fatura só com a soma dos pedidos marcados, tudo ou nada.
//! O motor já conferiu cada pedido (escopo, permissão, `visibleWhen`); aqui a regra confere de novo dentro da
//! transação, porque outro usuário pode ter faturado ou cancelado um deles no meio.

use c3_engine::{ActionOutcome, ApiError, BulkActionCall, Preview, PreviewCall};
use sqlx::SqlitePool;

fn brl(cents: i64) -> String {
    format!("R$ {},{:02}", cents / 100, cents % 100)
}

pub fn preview(call: PreviewCall<'_>) -> Result<Preview, ApiError> {
    let n = call.ids.len();
    let due = call.input["due_date"].as_str();
    let what = format!("{n} pedido{}", if n == 1 { "" } else { "s" });
    let message = match due {
        Some(d) => format!("Uma fatura com {what}, vencimento em {d}."),
        None => format!("Uma fatura com {what}. Informe o vencimento."),
    };
    Ok(Preview {
        message: Some(message),
        ..Default::default()
    })
}

pub async fn run(pool: &SqlitePool, call: BulkActionCall<'_>) -> Result<ActionOutcome, ApiError> {
    let due = call.input["due_date"].as_str().ok_or_else(ApiError::internal)?;
    let ids: Vec<i64> = call
        .ids
        .iter()
        .map(|id| id.parse())
        .collect::<Result<_, _>>()
        .map_err(|_| ApiError::internal())?;
    let mut tx = pool.begin_with("BEGIN IMMEDIATE").await?;
    let mut total = 0;
    let mut owner = None;
    for id in &ids {
        // de novo na transação: ainda aberto e sem fatura
        let row: Option<(i64, Option<i64>)> =
            sqlx::query_as("SELECT org_company_id, total FROM sales_order WHERE id = ? AND status = 'open' AND invoice IS NULL")
                .bind(id)
                .fetch_optional(&mut *tx)
                .await?;
        let Some((company, cents)) = row else {
            return Err(ApiError::conflict(
                "Um dos pedidos foi faturado ou cancelado enquanto isso. Nada foi faturado; atualize a lista.",
                None,
            ));
        };
        if owner.is_some_and(|c| c != company) {
            return Err(ApiError::conflict("Uma fatura junta pedidos de uma empresa só.", None));
        }
        owner = Some(company);
        total += cents.unwrap_or(0);
    }
    let invoice = sqlx::query("INSERT INTO invoice (org_company_id, total, due_date, orders) VALUES (?, ?, ?, ?)")
        .bind(owner)
        .bind(total)
        .bind(due)
        .bind(ids.len() as i64)
        .execute(&mut *tx)
        .await?
        .last_insert_rowid();
    for id in &ids {
        sqlx::query("UPDATE sales_order SET invoice = ? WHERE id = ?")
            .bind(invoice)
            .bind(id)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(ActionOutcome::message(format!(
        "Fatura {invoice}: {} pedido{}, {}.",
        ids.len(),
        if ids.len() == 1 { "" } else { "s" },
        brl(total)
    )))
}

#[cfg(test)]
mod tests {
    use super::*;
    use c3_engine::sqlx::{sqlite_options, SqlxStore};
    use c3_engine::RequestContext;
    use serde_json::{json, Map};
    use sqlx::sqlite::SqlitePoolOptions;

    async fn pool() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(sqlite_options("sqlite::memory:").unwrap())
            .await
            .unwrap();
        sqlx::migrate!().run(&pool).await.unwrap();
        pool
    }

    async fn order(pool: &SqlitePool, number: i64, cents: i64) -> String {
        let done =
            sqlx::query("INSERT INTO sales_order (org_company_id, org_branch_id, number, description, total) VALUES (1, 1, ?, 'Teste', ?)")
                .bind(number)
                .bind(cents)
                .execute(pool)
                .await
                .unwrap();
        done.last_insert_rowid().to_string()
    }

    async fn invoice(pool: &SqlitePool, ids: &[String]) -> Result<ActionOutcome, ApiError> {
        let (req, _) = axum::http::Request::new(()).into_parts();
        let ctx = RequestContext {
            req: &req,
            active_branch: Some("1".into()),
            active_company: Some("1".into()),
        };
        let store = SqlxStore::new(pool.clone());
        let records = vec![Map::new(); ids.len()];
        let input = Map::from_iter([("due_date".to_owned(), json!("2026-12-10"))]);
        run(
            pool,
            BulkActionCall {
                entity: "sales_order",
                action: "invoice",
                ids,
                records: &records,
                input: &input,
                params: &Map::new(),
                ctx: &ctx,
                store: &store,
            },
        )
        .await
    }

    async fn count(pool: &SqlitePool, sql: &str) -> i64 {
        sqlx::query_scalar(sql).fetch_one(pool).await.unwrap()
    }

    #[tokio::test]
    async fn soma_e_liga_todos_numa_fatura() {
        let pool = pool().await;
        let ids = vec![order(&pool, 1, 1050).await, order(&pool, 2, 425).await];
        let out = invoice(&pool, &ids).await.unwrap();
        assert_eq!(out.message.as_deref(), Some("Fatura 1: 2 pedidos, R$ 14,75."));
        assert_eq!(count(&pool, "SELECT COUNT(*) FROM sales_order WHERE invoice = 1").await, 2);
    }

    /// A corrida que o motor não vê: o pedido foi faturado depois da conferência do motor e antes da transação.
    /// A regra confere de novo dentro dela e nada é gravado (tudo ou nada).
    #[tokio::test]
    async fn reconfere_na_transacao_e_nao_grava_nada() {
        let pool = pool().await;
        let free = order(&pool, 1, 100).await;
        let taken = order(&pool, 2, 200).await;
        // "outro usuário" fatura o segundo no meio
        invoice(&pool, std::slice::from_ref(&taken)).await.unwrap();
        let err = invoice(&pool, &[free.clone(), taken]).await.unwrap_err();
        assert_eq!(err.status, axum::http::StatusCode::CONFLICT);
        assert_eq!(
            count(&pool, "SELECT COUNT(*) FROM invoice").await,
            1,
            "a segunda fatura não foi gravada"
        );
        let free_invoice: Option<i64> = sqlx::query_scalar("SELECT invoice FROM sales_order WHERE id = ?")
            .bind(&free)
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(free_invoice, None, "o pedido liberado segue sem fatura");
    }
}
