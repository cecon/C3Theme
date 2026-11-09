//! Consultas do sistema (`source: system`): o SELECT de cada uma, com os parâmetros já validados pelo motor.

use c3_engine::{ApiError, SourceCall, SourceSql, SqlValue};
use serde_json::Value;

pub fn source(call: SourceCall<'_>) -> Result<SourceSql, ApiError> {
    match call.entity {
        // atividades em aberto de cada cliente até `until`; atrasada = prazo antes da data pedida
        "customer_pending" => {
            let until = call.params["until"].as_str().unwrap_or_default().to_owned();
            let mut sql = "SELECT a.customer_id AS id, a.customer_id, COUNT(*) AS open_count, \
                 SUM(CASE WHEN a.due_date < ? THEN 1 ELSE 0 END) AS late_count, MIN(a.due_date) AS oldest_due \
                 FROM activity a WHERE a.customer_id IS NOT NULL AND a.due_date <= ? AND a.stage IN ('todo', 'doing')"
                .to_owned();
            let mut values = vec![SqlValue::Text(until.clone()), SqlValue::Text(until)];
            if let Value::String(stage) = &call.params["stage"] {
                sql.push_str(" AND a.stage = ?");
                values.push(SqlValue::Text(stage.clone()));
            }
            sql.push_str(" GROUP BY a.customer_id");
            Ok(SourceSql { sql, values })
        }
        _ => Err(ApiError::internal()),
    }
}
