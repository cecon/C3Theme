//! Configuração de registro único (`singleton: true`): um registro por escopo (o grupo, cada empresa ou cada
//! filial, conforme `scope`). Criar o segundo é 409; excluir é 405 (em `delete.rs`).

use super::{Owner, Result};
use crate::error::ApiError;
use crate::spec::{Entity, BRANCH_COL, COMPANY_COL};
use crate::store::{self, Conn, SqlValue};

/// Recusa criar quando o dono do novo registro já tem o dele. Roda na mesma transação do INSERT; para valer também
/// entre duas gravações simultâneas, o sistema deve ter índice único nas colunas de escopo.
pub(super) async fn guard_create(conn: &mut dyn Conn, entity: &Entity, owner: Owner) -> Result<()> {
    if !entity.singleton {
        return Ok(());
    }
    let mut filters = Vec::new();
    let mut params = Vec::new();
    for (col, id) in [(COMPANY_COL, owner.company), (BRANCH_COL, owner.branch)] {
        if let Some(id) = id {
            filters.push(format!("\"{col}\" = ?"));
            params.push(SqlValue::Int(id));
        }
    }
    let where_sql = if filters.is_empty() {
        String::new()
    } else {
        format!(" WHERE {}", filters.join(" AND "))
    };
    let sql = format!("SELECT COUNT(*) FROM \"{}\"{where_sql}", entity.name);
    if store::scalar_int(conn, &sql, &params).await?.unwrap_or_default() > 0 {
        return Err(ApiError::conflict(
            "Esta configuração já existe: altere o registro gravado em vez de criar outro.",
            None,
        ));
    }
    Ok(())
}
