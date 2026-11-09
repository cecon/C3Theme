//! Ações da mesa (planta do salão): abrir, pedir a conta e liberar. O motor já conferiu o `visibleWhen` de cada
//! uma; o `WHERE` repete a situação esperada para dois garçons não abrirem a mesma mesa ao mesmo tempo.

use c3_engine::{ActionOutcome, ApiError};
use sqlx::SqlitePool;

pub async fn run(pool: &SqlitePool, action: &str, id: i64) -> Result<ActionOutcome, ApiError> {
    let (to, from, done): (&str, &[&str], &str) = match action {
        "occupy" => ("busy", &["free"], "Mesa aberta."),
        "ask_bill" => ("bill", &["busy"], "Conta pedida."),
        "release" => ("free", &["busy", "bill", "blocked"], "Mesa liberada."),
        _ => return Err(ApiError::internal()),
    };
    let marks = vec!["?"; from.len()].join(", ");
    let sql = format!("UPDATE dining_table SET status = ? WHERE id = ? AND status IN ({marks})");
    let mut query = sqlx::query(&sql).bind(to).bind(id);
    for s in from {
        query = query.bind(*s);
    }
    if query.execute(pool).await?.rows_affected() == 0 {
        return Err(ApiError::conflict(
            "A mesa mudou de situação enquanto isso. Veja como ela está agora.",
            None,
        ));
    }
    Ok(ActionOutcome::message(done))
}

#[cfg(test)]
mod tests {
    use super::run;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn pool(status: &str) -> sqlx::SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::query("CREATE TABLE dining_table (id INTEGER PRIMARY KEY, status TEXT NOT NULL)")
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query("INSERT INTO dining_table (id, status) VALUES (1, ?)")
            .bind(status)
            .execute(&pool)
            .await
            .unwrap();
        pool
    }

    async fn status(pool: &sqlx::SqlitePool) -> String {
        sqlx::query_scalar("SELECT status FROM dining_table WHERE id = 1")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn abre_pede_a_conta_e_libera() {
        let pool = pool("free").await;
        for (action, expected) in [("occupy", "busy"), ("ask_bill", "bill"), ("release", "free")] {
            run(&pool, action, 1).await.unwrap();
            assert_eq!(status(&pool).await, expected);
        }
    }

    /// Dois garçons abrem a mesma mesa: o motor conferiu o visibleWhen de cada um antes, com a mesa ainda livre;
    /// o segundo UPDATE não acha a mesa livre, responde 409 e não muda nada.
    #[tokio::test]
    async fn segundo_a_abrir_a_mesma_mesa_recebe_conflito() {
        let pool = pool("free").await;
        run(&pool, "occupy", 1).await.unwrap();
        let err = run(&pool, "occupy", 1).await.unwrap_err();
        assert_eq!(err.status.as_u16(), 409);
        assert_eq!(err.code, "conflict");
        assert_eq!(status(&pool).await, "busy");
    }
}
