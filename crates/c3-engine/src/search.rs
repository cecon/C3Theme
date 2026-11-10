//! Busca do Ctrl K (`layout.header.search: { records: true }`, spec/v0/search.yaml): o sistema decide o que entra
//! (registros, mensagens, índice de texto) e o que o usuário pode ver. O motor confere `q` e `limit` e garante o
//! formato da resposta.
//!
//! O sistema implementa [`Search`] e passa no `Engine::builder(..).search(..)`; sem isso, GET /_search responde 404.

use axum::http::request::Parts;
use serde_json::{json, Value};

use crate::error::ApiError;
use crate::Engine;

const MAX_LIMIT: usize = 50;
const DEFAULT_LIMIT: usize = 20;

/// Um achado, como sai em GET /_search. `path` é a rota da shell; `at` em RFC 3339.
#[derive(Debug, Clone, Default)]
pub struct SearchHit {
    /// O que é (ex.: "produto", "mensagem"); a shell não interpreta.
    pub kind: String,
    /// Título do grupo na paleta; os grupos seguem a ordem em que aparecem.
    pub group: String,
    pub title: String,
    pub snippet: Option<String>,
    pub path: String,
    /// Nome do catálogo de ícones do app.
    pub icon: Option<String>,
    pub at: Option<String>,
}

impl SearchHit {
    fn to_json(&self) -> Value {
        json!({
            "kind": self.kind, "group": self.group, "title": self.title, "snippet": self.snippet,
            "path": self.path, "icon": self.icon, "at": self.at
        })
    }
}

/// Porta da busca: o sistema procura onde quiser (tabelas, FTS5, outro serviço).
#[async_trait::async_trait]
pub trait Search: Send + Sync + 'static {
    /// Até `limit` (1 a 50) achados de `q` (já sem espaços nas pontas, 2 a 200 caracteres), na ordem da paleta.
    async fn search(&self, req: &Parts, q: &str, limit: usize) -> Result<Vec<SearchHit>, ApiError>;
}

/// `q` sem espaços nas pontas, de 2 a 200 caracteres; senão 400.
pub(crate) fn parse_query(raw: Option<&str>) -> Result<String, ApiError> {
    let q = raw.unwrap_or_default().trim();
    match q.chars().count() {
        2..=200 => Ok(q.to_owned()),
        _ => Err(ApiError::bad_request("q precisa ter de 2 a 200 caracteres.")),
    }
}

/// `limit`: ausente vale 20; fora de 1..=50 ou não numérico, 400.
pub(crate) fn parse_limit(raw: Option<&str>) -> Result<usize, ApiError> {
    match raw {
        None => Ok(DEFAULT_LIMIT),
        Some(s) => match s.parse::<usize>() {
            Ok(n) if (1..=MAX_LIMIT).contains(&n) => Ok(n),
            _ => Err(ApiError::bad_request("limit precisa ser um número de 1 a 50.")),
        },
    }
}

pub(crate) async fn search(engine: &Engine, req: &Parts, q: Option<&str>, limit: Option<&str>) -> Result<Value, ApiError> {
    let port = engine
        .0
        .search
        .as_deref()
        .ok_or_else(|| ApiError::not_found("Este sistema não tem busca de registros."))?;
    let q = parse_query(q)?;
    let limit = parse_limit(limit)?;
    let hits = port.search(req, &q, limit).await?;
    let data: Vec<Value> = hits.iter().take(limit).map(SearchHit::to_json).collect();
    Ok(json!({ "data": data }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn q_e_limit() {
        assert_eq!(parse_query(Some("  pão ")).unwrap(), "pão");
        assert!(parse_query(None).is_err());
        assert!(parse_query(Some(" a ")).is_err());
        assert!(parse_query(Some(&"x".repeat(201))).is_err());
        assert_eq!(parse_limit(None).unwrap(), 20);
        assert_eq!(parse_limit(Some("50")).unwrap(), 50);
        assert!(parse_limit(Some("0")).is_err());
        assert!(parse_limit(Some("51")).is_err());
        assert!(parse_limit(Some("dez")).is_err());
    }
}
