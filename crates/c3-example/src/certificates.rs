//! Ação "Trocar certificado" da empresa: recebe o arquivo (`type: file`, base64) e a senha do input.
//! Num sistema real, aqui se abre o PFX com a senha, confere CNPJ e validade, cifra e guarda; o exemplo só
//! confere que parece um DER e guarda nome e tamanho, para a suíte ver o caminho inteiro.

use c3_engine::{ActionCall, ActionOutcome, ApiError, FieldErrors};
use sqlx::SqlitePool;

pub async fn replace(pool: &SqlitePool, call: ActionCall<'_>) -> Result<ActionOutcome, ApiError> {
    let id: i64 = call.id.parse().map_err(|_| ApiError::internal())?;
    let file = &call.input["file"];
    let (name, data) = (file["name"].as_str().unwrap_or_default(), file["data"].as_str().unwrap_or_default());
    // PKCS#12 é uma SEQUENCE DER: em base64 começa com "MI"
    if !data.starts_with("MI") {
        let mut errors = FieldErrors::default();
        errors.add("file", "invalid_certificate", "O arquivo não é um certificado A1 (.pfx).");
        return Err(ApiError::validation(errors));
    }
    let size = data.len() / 4 * 3 - data.bytes().rev().take_while(|c| *c == b'=').count();
    sqlx::query("UPDATE company SET certificate = ? WHERE id = ?")
        .bind(format!("{name} ({:.1} KB)", size as f64 / 1024.0))
        .bind(id)
        .execute(pool)
        .await?;
    Ok(ActionOutcome::message("Certificado trocado."))
}
