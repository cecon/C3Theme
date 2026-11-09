//! Escritor próprio do pedido: o que um sistema com escrita delegada faz em `Hooks::write`.
//! Usa um pool só dele (como o Diesel de um sistema real), grava o pedido e a auditoria na mesma
//! transação e devolve os erros do contrato que só a gravação descobre.

use c3_engine::{ApiError, FieldErrors, WriteCall, WriteOp};
use serde_json::{json, Map, Value};
use sqlx::sqlite::SqlitePool;
use sqlx::{Sqlite, Transaction};

const COLUMNS: [&str; 5] = ["number", "description", "customer_id", "seller_id", "total"];

pub async fn write(pool: &SqlitePool, call: WriteCall<'_>, user: Option<&str>) -> Result<i64, ApiError> {
    let mut tx = pool.begin_with("BEGIN IMMEDIATE").await?;
    let after = (call.op != WriteOp::Delete).then(|| Value::Object(call.values.clone()));
    let owner = (call.company, call.branch);
    // itens antes do pedido no excluir; depois dele no criar (precisa do id novo)
    if let (WriteOp::Delete, Some(id)) = (call.op, call.id) {
        crate::items::write(&mut tx, id, owner, call.children, user).await?;
    }
    let (id, op) = match call.op {
        WriteOp::Create => {
            let mut q = sqlx::query(
                "INSERT INTO sales_order (number, description, customer_id, seller_id, total, org_company_id, org_branch_id) \
                 VALUES (?, ?, ?, ?, ?, ?, ?)",
            );
            for col in COLUMNS {
                q = q.bind(column(col, &call.values[col])?);
            }
            let done = q.bind(call.company).bind(call.branch).execute(&mut *tx).await.map_err(unique)?;
            (done.last_insert_rowid(), "create")
        }
        WriteOp::Update => {
            let id = call.id.ok_or_else(ApiError::internal)?;
            let mut q =
                sqlx::query("UPDATE sales_order SET number = ?, description = ?, customer_id = ?, seller_id = ?, total = ? WHERE id = ?");
            for col in COLUMNS {
                q = q.bind(column(col, &call.values[col])?);
            }
            let done = q.bind(id).execute(&mut *tx).await.map_err(unique)?;
            if done.rows_affected() == 0 {
                return Err(ApiError::not_found("Registro não encontrado."));
            }
            (id, "update")
        }
        WriteOp::Delete => {
            let id = call.id.ok_or_else(ApiError::internal)?;
            let done = sqlx::query("DELETE FROM sales_order WHERE id = ?")
                .bind(id)
                .execute(&mut *tx)
                .await?;
            if done.rows_affected() == 0 {
                return Err(ApiError::not_found("Registro não encontrado."));
            }
            (id, "delete")
        }
    };
    if call.op != WriteOp::Delete {
        crate::attachments::save(&mut tx, id, call.values).await?;
        crate::items::write(&mut tx, id, owner, call.children, user).await?;
    }
    audit(&mut tx, id, op, call.before, after, user).await?;
    tx.commit().await?;
    Ok(id)
}

async fn audit(
    tx: &mut Transaction<'_, Sqlite>,
    id: i64,
    op: &str,
    before: Option<&Map<String, Value>>,
    after: Option<Value>,
    user: Option<&str>,
) -> Result<(), ApiError> {
    sqlx::query("INSERT INTO audit_log (entity, record_id, op, before, after, user_name) VALUES ('sales_order', ?, ?, ?, ?, ?)")
        .bind(id)
        .bind(op)
        .bind(before.map(|b| json!(b).to_string()))
        .bind(after.map(|a| a.to_string()))
        .bind(user)
        .execute(&mut **tx)
        .await?;
    Ok(())
}

/// Valor trafegado → coluna: reference e inteiro como número, decimal (scale 2) em centavos.
pub fn column(col: &str, v: &Value) -> Result<Option<String>, ApiError> {
    Ok(match (col, v) {
        (_, Value::Null) => None,
        ("total" | "unit_price", Value::String(s)) => Some(cents(s).ok_or_else(ApiError::internal)?.to_string()),
        (_, Value::String(s)) => Some(s.clone()),
        (_, other) => Some(other.to_string()),
    })
}

fn cents(s: &str) -> Option<i64> {
    let (int, frac) = s.split_once('.').unwrap_or((s, ""));
    let frac = format!("{frac:0<2}");
    let n: i64 = int.trim_start_matches('-').parse().ok()?;
    let v = n * 100 + frac.get(..2)?.parse::<i64>().ok()?;
    Some(if int.starts_with('-') { -v } else { v })
}

/// O número do pedido é único por filial: a violação volta como erro do campo, igual ao CRUD do motor.
fn unique(e: sqlx::Error) -> ApiError {
    if let sqlx::Error::Database(db) = &e {
        if db.kind() == sqlx::error::ErrorKind::UniqueViolation {
            let mut fields = FieldErrors::default();
            fields.add("number", "unique", "Já existe um registro com este valor.");
            return ApiError::conflict("Já existe um registro com estes dados.", Some(fields));
        }
    }
    e.into()
}
