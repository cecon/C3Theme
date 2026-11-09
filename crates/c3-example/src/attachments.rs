//! Anexo do pedido (`type: file` na entidade): o sistema guarda os bytes e os metadados que a leitura mostra.
//! O motor já conferiu forma, tamanho e extensão; aqui só se decodifica e grava, na transação do pedido.

use c3_engine::{ApiError, FileCall, FileContent};
use serde_json::{json, Map, Value};
use sqlx::sqlite::SqlitePool;
use sqlx::{Row, Sqlite, Transaction};

/// Sem a chave, o anexo fica; `null` remove; com `data`, troca.
pub async fn save(tx: &mut Transaction<'_, Sqlite>, id: i64, values: &Map<String, Value>) -> Result<(), ApiError> {
    let Some(v) = values.get("attachment") else { return Ok(()) };
    sqlx::query("DELETE FROM sales_order_file WHERE order_id = ?")
        .bind(id)
        .execute(&mut **tx)
        .await?;
    let meta = match v {
        Value::Null => None,
        file => {
            let data = decode(file["data"].as_str().unwrap_or_default()).ok_or_else(ApiError::internal)?;
            sqlx::query("INSERT INTO sales_order_file (order_id, data) VALUES (?, ?)")
                .bind(id)
                .bind(&data)
                .execute(&mut **tx)
                .await?;
            Some(json!({ "name": file["name"], "size": data.len(), "contentType": file.get("contentType") }).to_string())
        }
    };
    sqlx::query("UPDATE sales_order SET attachment = ? WHERE id = ?")
        .bind(meta)
        .bind(id)
        .execute(&mut **tx)
        .await?;
    Ok(())
}

pub async fn read(pool: &SqlitePool, call: FileCall<'_>) -> Result<FileContent, ApiError> {
    let row = sqlx::query("SELECT o.attachment, f.data FROM sales_order o JOIN sales_order_file f ON f.order_id = o.id WHERE o.id = ?")
        .bind(call.id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| ApiError::not_found("Sem arquivo."))?;
    let meta: Value = serde_json::from_str(&row.get::<String, _>(0)).map_err(|_| ApiError::internal())?;
    Ok(FileContent {
        name: meta["name"].as_str().unwrap_or("arquivo").to_owned(),
        content_type: meta["contentType"].as_str().map(str::to_owned),
        data: row.get(1),
    })
}

/// base64 padrão (com `=`), já conferido pelo motor.
fn decode(s: &str) -> Option<Vec<u8>> {
    let val = |c: u8| match c {
        b'A'..=b'Z' => Some(c - b'A'),
        b'a'..=b'z' => Some(c - b'a' + 26),
        b'0'..=b'9' => Some(c - b'0' + 52),
        b'+' => Some(62),
        b'/' => Some(63),
        _ => None,
    };
    let mut out = Vec::with_capacity(s.len() / 4 * 3);
    for chunk in s.trim_end_matches('=').as_bytes().chunks(4) {
        let n = chunk.iter().try_fold(0u32, |acc, &c| Some(acc << 6 | val(c)? as u32))? << (6 * (4 - chunk.len()));
        out.extend_from_slice(&n.to_be_bytes()[1..chunk.len()]);
    }
    Some(out)
}
