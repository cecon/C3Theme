//! Escritor do operador: o que um sistema faz com um campo `writeOnly`. O motor entrega a senha em texto
//! puro só quando chegou uma nova (`values` sem a chave = manter); o hash e a gravação são do sistema.
//!
//! Exemplo didático: SHA-256 com sal. Em produção, use um hash lento próprio para senha (argon2, bcrypt).

use std::time::{SystemTime, UNIX_EPOCH};

use c3_engine::{ApiError, WriteCall, WriteOp};
use serde_json::Value;
use sha2::{Digest, Sha256};
use sqlx::sqlite::SqlitePool;

fn hash(password: &str) -> String {
    let salt = format!("{:x}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos());
    let digest = Sha256::digest(format!("{salt}${password}"));
    let hex: String = digest.iter().map(|b| format!("{b:02x}")).collect();
    format!("sha256${salt}${hex}")
}

pub async fn write(pool: &SqlitePool, call: WriteCall<'_>) -> Result<i64, ApiError> {
    let text = |k: &str| call.values.get(k).and_then(Value::as_str).map(str::to_owned);
    let password = text("password").map(|p| hash(&p));
    match call.op {
        WriteOp::Create => {
            let done = sqlx::query("INSERT INTO operator (name, login, password) VALUES (?, ?, ?)")
                .bind(text("name"))
                .bind(text("login"))
                .bind(password)
                .execute(pool)
                .await?;
            Ok(done.last_insert_rowid())
        }
        WriteOp::Update => {
            let id = call.id.ok_or_else(ApiError::internal)?;
            // sem senha nova, a gravada fica
            sqlx::query("UPDATE operator SET name = ?, login = ?, password = coalesce(?, password) WHERE id = ?")
                .bind(text("name"))
                .bind(text("login"))
                .bind(password)
                .bind(id)
                .execute(pool)
                .await?;
            Ok(id)
        }
        WriteOp::Delete => {
            let id = call.id.ok_or_else(ApiError::internal)?;
            sqlx::query("DELETE FROM operator WHERE id = ?").bind(id).execute(pool).await?;
            Ok(id)
        }
    }
}
