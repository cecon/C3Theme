//! Busca do Ctrl K do exemplo (spec/v0/search.yaml): produtos pelo nome. Sistema de verdade procura onde quiser
//! (várias tabelas, FTS5 sem acento) e só devolve o que o usuário pode abrir.

use axum::http::request::Parts;
use c3_engine::{ApiError, Search, SearchHit};
use sqlx::SqlitePool;

pub struct Products(pub SqlitePool);

#[c3_engine::async_trait]
impl Search for Products {
    async fn search(&self, _req: &Parts, q: &str, limit: usize) -> Result<Vec<SearchHit>, ApiError> {
        let like = format!("%{}%", q.replace('\\', "\\\\").replace('%', "\\%").replace('_', "\\_"));
        let rows: Vec<(i64, String, String)> =
            sqlx::query_as("SELECT id, name, product_group FROM product WHERE name LIKE ? ESCAPE '\\' ORDER BY name, id LIMIT ?")
                .bind(like)
                .bind(limit as i64)
                .fetch_all(&self.0)
                .await
                .map_err(|_| ApiError::internal())?;
        Ok(rows
            .into_iter()
            .map(|(id, name, group)| SearchHit {
                kind: "product".into(),
                group: "Produtos".into(),
                title: name,
                snippet: Some(group),
                path: format!("/product/{id}"),
                icon: Some("Box".into()),
                at: None,
            })
            .collect())
    }
}
