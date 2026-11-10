//! Arquivo (`type: file`): na escrita trafega como `{ name, contentType, data }`, com `data` em base64. O motor
//! confere forma, tamanho e extensão; abrir e guardar o arquivo é do sistema. Na entidade, a coluna guarda os
//! metadados (`{ name, size, contentType }` em JSON, gravados pelo sistema) e a leitura devolve só eles.

use serde_json::Value;

use super::Field;

/// `maxSize` de quem não declara e teto padrão do app (`maxUploadSize`), em bytes: 1 MB.
pub const MAX_SIZE: usize = 1 << 20;
/// O maior `maxUploadSize` que o app pode escolher: 32 MB. Em base64 o corpo cresce 4/3 (ver [`body_limit`]).
pub const UPLOAD_CEILING: usize = 32 << 20;

/// Limite do corpo do pedido para o teto de upload: o arquivo em base64 (4/3) e folga para o resto do JSON,
/// nunca abaixo dos 2 MB de sempre.
pub fn body_limit(max_upload: usize) -> usize {
    (max_upload.div_ceil(3) * 4 + (512 << 10)).max(2 << 20)
}

/// Arquivo novo (com `data`). Sem `data`, é o que veio da leitura (metadados): o gravado fica.
pub(crate) fn is_new(v: &Value) -> bool {
    v.get("data").is_some()
}

/// Coluna → formato trafegado: os metadados em JSON; texto que não é objeto JSON vale como sem arquivo.
pub(crate) fn to_wire(text: Option<String>) -> Value {
    text.and_then(|t| serde_json::from_str::<Value>(&t).ok())
        .filter(Value::is_object)
        .unwrap_or(Value::Null)
}

pub(crate) fn check(f: &Field, v: &Value) -> Result<(), &'static str> {
    let o = v.as_object().ok_or("invalid_type")?;
    if o.keys().any(|k| !matches!(k.as_str(), "name" | "contentType" | "data")) {
        return Err("invalid_type");
    }
    let name = o
        .get("name")
        .and_then(Value::as_str)
        .filter(|s| !s.trim().is_empty() && s.len() <= 255)
        .ok_or("invalid_type")?;
    if o.get("contentType").is_some_and(|c| !c.is_string() && !c.is_null()) {
        return Err("invalid_type");
    }
    let size = o
        .get("data")
        .and_then(Value::as_str)
        .and_then(decoded_len)
        .filter(|n| *n > 0)
        .ok_or("invalid_type")?;
    if size > f.max_size {
        return Err("too_large");
    }
    let lower = name.to_lowercase();
    if !f.accept.is_empty() && !f.accept.iter().any(|ext| lower.ends_with(ext.as_str())) {
        return Err("file_type");
    }
    Ok(())
}

/// Tamanho em bytes de um base64 padrão (com `=`), sem decodificar; `None` se não for base64.
fn decoded_len(s: &str) -> Option<usize> {
    let b = s.as_bytes();
    if !b.len().is_multiple_of(4) {
        return None;
    }
    let pad = b.iter().rev().take_while(|c| **c == b'=').count();
    let body = &b[..b.len() - pad];
    let ok = pad <= 2 && body.iter().all(|c| c.is_ascii_alphanumeric() || *c == b'+' || *c == b'/');
    ok.then(|| b.len() / 4 * 3 - pad)
}

#[cfg(test)]
mod tests {
    use super::{body_limit, decoded_len, MAX_SIZE, UPLOAD_CEILING};

    #[test]
    fn corpo_acompanha_o_teto() {
        assert_eq!(body_limit(MAX_SIZE), 2 << 20);
        assert!(body_limit(4 << 20) > (4 << 20) * 4 / 3);
        assert!(body_limit(UPLOAD_CEILING) < 44 << 20);
    }

    #[test]
    fn tamanho_do_base64() {
        assert_eq!(decoded_len("TWFu"), Some(3));
        assert_eq!(decoded_len("TWE="), Some(2));
        assert_eq!(decoded_len("TQ=="), Some(1));
        assert_eq!(decoded_len(""), Some(0));
        assert_eq!(decoded_len("TWF"), None);
        assert_eq!(decoded_len("TW=u"), None);
        assert_eq!(decoded_len("T==="), None);
        assert_eq!(decoded_len("TW-_"), None);
    }
}
