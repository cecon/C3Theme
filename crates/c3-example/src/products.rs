//! Ações do produto que devolvem algo além do aviso: o arquivo da balança (`returns: "file"`), o endereço do programa
//! da balança (`link`) e a cópia que a shell abre (`open`).

use c3_engine::{ActionCall, ActionOutcome, ApiError, FileContent, ListActionCall};
use sqlx::{Row, SqlitePool};

/// Programa da balança: centenas de MB, então a resposta é só o endereço (`link`) e o arquivo não passa pelo motor.
pub const SCALE_APP: &str = "https://github.com/cecon/C3Theme/releases/latest";

/// As duas ações da lista ligadas à balança.
pub async fn scale(pool: &SqlitePool, call: ListActionCall<'_>) -> Result<ActionOutcome, ApiError> {
    if call.action == "scale_app" {
        return Ok(ActionOutcome::link(SCALE_APP).with_message("Baixando o programa da balança."));
    }
    scale_file(pool, call).await
}

/// TXT de carga da balança: uma linha por produto, `código;nome;preço` com o preço em centavos, como as balanças
/// costumam ler.
async fn scale_file(pool: &SqlitePool, call: ListActionCall<'_>) -> Result<ActionOutcome, ApiError> {
    let only_active = call.input["only_active"].as_bool().unwrap_or(true);
    let rows = sqlx::query("SELECT id, name, price FROM product WHERE active = 1 OR ? = 0 ORDER BY id")
        .bind(only_active)
        .fetch_all(pool)
        .await?;
    if rows.is_empty() {
        return Ok(ActionOutcome::message("Nenhum produto para a balança."));
    }
    let mut txt = String::new();
    for r in &rows {
        let name: String = r.get("name");
        txt.push_str(&format!(
            "{:06};{};{}\r\n",
            r.get::<i64, _>("id"),
            name.replace(';', ","),
            r.get::<i64, _>("price")
        ));
    }
    let file = FileContent {
        name: "balança.txt".into(),
        content_type: Some("text/plain; charset=utf-8".into()),
        data: txt.into_bytes(),
    };
    Ok(ActionOutcome::file(file).with_message(format!("{} produto(s) no arquivo da balança.", rows.len())))
}

/// Cópia inativa ("Cópia de …"); a shell abre a cópia.
pub async fn duplicate(pool: &SqlitePool, call: ActionCall<'_>) -> Result<ActionOutcome, ApiError> {
    let id: i64 = call.id.parse().map_err(|_| ApiError::internal())?;
    let done = sqlx::query(
        "INSERT INTO product (name, product_group, price, active) \
         SELECT substr('Cópia de ' || name, 1, 120), product_group, price, 0 FROM product WHERE id = ?",
    )
    .bind(id)
    .execute(pool)
    .await?;
    let copy = done.last_insert_rowid().to_string();
    Ok(ActionOutcome::message("Cópia criada.").open(None, copy))
}
