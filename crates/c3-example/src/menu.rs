//! Regras do cardápio (spec/v0/examples: product, question, promotion e os filhos with_parent).
//! As de um registro só ficam em `validate`; as que comparam as linhas da lista, em `validate_children`.

use c3_engine::{ActionCall, ActionOutcome, ApiError, ChildWrite, Conn, FieldErrors, SqlValue, WriteOp};
use serde_json::{Map, Value};
use sqlx::SqlitePool;

fn int(record: &Map<String, Value>, key: &str) -> Option<i64> {
    record.get(key).and_then(Value::as_i64)
}

fn text<'a>(record: &'a Map<String, Value>, key: &str) -> Option<&'a str> {
    record.get(key).and_then(Value::as_str).filter(|s| !s.is_empty())
}

/// Id de um campo reference: no registro validado vem a string do id.
fn id(record: &Map<String, Value>, key: &str) -> Option<i64> {
    match record.get(key)? {
        Value::String(s) => s.parse().ok(),
        Value::Number(n) => n.as_i64(),
        Value::Object(o) => id(o, "id"),
        _ => None,
    }
}

/// Regras de um registro (pai ou uma linha filha).
pub async fn validate(entity: &str, record: &Map<String, Value>, conn: &mut dyn Conn, errors: &mut FieldErrors) {
    match entity {
        "question" => {
            let (min, max) = (int(record, "min_choices"), int(record, "max_choices"));
            if text(record, "choice") == Some("single") && max != Some(1) {
                errors.add("max_choices", "max", "Com uma opção, o máximo é 1.");
            } else if let (Some(min), Some(max)) = (min, max) {
                if min > max {
                    errors.add("min_choices", "max", "Mín. não pode ser maior que máx.");
                }
            }
        }
        "product_question" => {
            let Some(question) = id(record, "question_id") else {
                return;
            };
            if id(record, "depends_on_id") == Some(question) {
                errors.add("depends_on_id", "invalid_option", "A pergunta não pode depender dela mesma.");
            }
            let Ok(rows) = conn
                .query(
                    "SELECT q.min_choices, q.max_choices, \
                     (SELECT COUNT(*) FROM question_option o WHERE o.question_id = q.id AND o.active = 1) \
                     FROM question q WHERE q.id = ?",
                    &[SqlValue::Int(question)],
                )
                .await
            else {
                return;
            };
            let Some(row) = rows.first() else { return };
            let col = |i: usize| match row.get(i) {
                Some(SqlValue::Int(n)) => Some(*n),
                _ => None,
            };
            let (q_min, q_max, options) = (col(0), col(1), col(2).unwrap_or(0));
            // vazio no produto: vale o da pergunta
            let min = int(record, "min_choices").or(q_min).unwrap_or(0);
            let max = int(record, "max_choices").or(q_max).unwrap_or(1);
            if min > max {
                errors.add("min_choices", "max", "Mín. não pode ser maior que máx.");
            }
            if max > options {
                errors.add(
                    "max_choices",
                    "max",
                    format!("Máx. não pode passar do número de opções ativas da pergunta ({options})."),
                );
            }
        }
        "promotion" => {
            if let (Some(buy), Some(pay)) = (int(record, "buy"), int(record, "pay")) {
                if pay >= buy {
                    errors.add("pay", "max", "O pague precisa ser menor que o leve.");
                }
            }
            if let (Some(start), Some(end)) = (text(record, "starts_on"), text(record, "ends_on")) {
                if end < start {
                    errors.add("ends_on", "min", "O fim não pode ser antes do início.");
                }
            }
            if let (Some(from), Some(to)) = (text(record, "from_time"), text(record, "to_time")) {
                if to <= from {
                    errors.add("to_time", "min", "O horário final precisa ser depois do inicial.");
                }
            }
        }
        _ => {}
    }
}

/// Linhas que ficam na lista (as excluídas saem), com a posição enviada.
fn kept<'a>(children: &'a [ChildWrite], entity: &str) -> Option<impl Iterator<Item = (usize, &'a Map<String, Value>)>> {
    let list = children.iter().find(|c| c.entity == entity)?;
    Some(
        list.rows
            .iter()
            .filter(|r| r.op != WriteOp::Delete)
            .filter_map(|r| Some((r.index?, &r.values))),
    )
}

/// Regras entre as linhas da lista e o pai.
pub fn validate_children(entity: &str, record: &Map<String, Value>, children: &[ChildWrite], errors: &mut FieldErrors) {
    match entity {
        // o máximo da pergunta contra as opções ativas da lista enviada
        "question" => {
            let Some(rows) = kept(children, "question_option") else { return };
            let active = rows.filter(|(_, r)| r.get("active") != Some(&Value::Bool(false))).count() as i64;
            if int(record, "max_choices").is_some_and(|max| max > active) {
                errors.add(
                    "max_choices",
                    "max",
                    format!("Máx. não pode passar do número de opções ativas ({active})."),
                );
            }
        }
        // "libera depois de" aponta para uma pergunta deste produto com ordem menor
        "product" => {
            let Some(rows) = kept(children, "product_question") else { return };
            let rows: Vec<_> = rows.collect();
            for (i, row) in &rows {
                let Some(dep) = id(row, "depends_on_id") else { continue };
                let position = int(row, "position").unwrap_or(0);
                let before = rows
                    .iter()
                    .any(|(_, o)| id(o, "question_id") == Some(dep) && int(o, "position").unwrap_or(0) < position);
                if !before {
                    errors.add(
                        &format!("product_question.{i}.depends_on_id"),
                        "invalid_option",
                        "Precisa ser uma pergunta deste produto com ordem menor.",
                    );
                }
            }
        }
        _ => {}
    }
}

/// Ação "Encerrar promoção": o fim passa a ser hoje.
pub async fn end_promotion(pool: &SqlitePool, call: ActionCall<'_>) -> Result<ActionOutcome, ApiError> {
    let id: i64 = call.id.parse().map_err(|_| ApiError::internal())?;
    // promoção que ainda não começou termina no próprio início
    let done =
        sqlx::query("UPDATE promotion SET status = 'ended', ends_on = max(starts_on, date('now')) WHERE id = ? AND status = 'active'")
            .bind(id)
            .execute(pool)
            .await?;
    if done.rows_affected() == 0 {
        return Err(ApiError::conflict("A promoção já foi encerrada.", None));
    }
    Ok(ActionOutcome::default())
}
