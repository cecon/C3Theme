//! Itens do pedido (`sales_order_item`, seção related com `save: with_parent`): o escritor do pedido grava as
//! linhas que o motor já validou, na mesma transação do pedido e com a mesma auditoria.

use c3_engine::{ApiError, ChildWrite, WriteOp};
use serde_json::{json, Value};
use sqlx::{Sqlite, Transaction};

use crate::orders::column;

pub async fn write(
    tx: &mut Transaction<'_, Sqlite>,
    order_id: i64,
    owner: (Option<i64>, Option<i64>),
    children: &[ChildWrite],
    user: Option<&str>,
) -> Result<(), ApiError> {
    for set in children.iter().filter(|c| c.entity == "sales_order_item") {
        // o motor manda excluir, alterar e incluir, nessa ordem
        for row in &set.rows {
            let v = |k: &str| column(k, row.values.get(k).unwrap_or(&Value::Null));
            let (id, op) = match row.op {
                WriteOp::Delete => {
                    let id = row.id.ok_or_else(ApiError::internal)?;
                    sqlx::query("DELETE FROM sales_order_item WHERE id = ? AND order_id = ?")
                        .bind(id)
                        .bind(order_id)
                        .execute(&mut **tx)
                        .await?;
                    (id, "delete")
                }
                WriteOp::Update => {
                    let id = row.id.ok_or_else(ApiError::internal)?;
                    sqlx::query("UPDATE sales_order_item SET product = ?, quantity = ?, unit_price = ? WHERE id = ? AND order_id = ?")
                        .bind(v("product")?)
                        .bind(v("quantity")?)
                        .bind(v("unit_price")?)
                        .bind(id)
                        .bind(order_id)
                        .execute(&mut **tx)
                        .await?;
                    (id, "update")
                }
                WriteOp::Create => {
                    let done = sqlx::query(
                        "INSERT INTO sales_order_item (order_id, product, quantity, unit_price, org_company_id, org_branch_id) \
                         VALUES (?, ?, ?, ?, ?, ?)",
                    )
                    .bind(order_id)
                    .bind(v("product")?)
                    .bind(v("quantity")?)
                    .bind(v("unit_price")?)
                    .bind(owner.0)
                    .bind(owner.1)
                    .execute(&mut **tx)
                    .await?;
                    (done.last_insert_rowid(), "create")
                }
            };
            let after = (row.op != WriteOp::Delete).then(|| json!(row.values).to_string());
            sqlx::query(
                "INSERT INTO audit_log (entity, record_id, op, before, after, user_name) VALUES ('sales_order_item', ?, ?, ?, ?, ?)",
            )
            .bind(id)
            .bind(op)
            .bind(row.before.as_ref().map(|b| json!(b).to_string()))
            .bind(after)
            .bind(user)
            .execute(&mut **tx)
            .await?;
        }
    }
    Ok(())
}
