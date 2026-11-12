//! CPF, CNPJ e telefone (spec: `format` em string). Mesma regra da shell (packages/engine/src/documents.mjs); as duas
//! precisam concordar com spec/v0/conformance/documents.json.
//!
//! O valor trafega sem máscara: CPF com 11 dígitos; CNPJ com 12 caracteres [0-9A-Z] e 2 dígitos
//! verificadores (alfanumérico desde jul/2026; o numérico antigo é o caso particular só com dígitos).

use serde::Deserialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Format {
    Cpf,
    Cnpj,
    CpfCnpj,
    /// Telefone com DDD: 10 ou 11 dígitos, sem dígito verificador.
    Phone,
    /// Atalho de teclado na forma canônica ("Ctrl+Shift+K", "F5"), #110.
    Shortcut,
}

const MODIFIERS: [&str; 4] = ["Ctrl", "Alt", "Shift", "Meta"];
const NAMED: [&str; 19] = [
    "Space",
    "Enter",
    "Tab",
    "Backspace",
    "Delete",
    "Insert",
    "Home",
    "End",
    "PageUp",
    "PageDown",
    "Up",
    "Down",
    "Left",
    "Right",
    "Plus",
    "Minus",
    "Comma",
    "Period",
    "Slash",
];

/// Atalho: modificadores na ordem de `MODIFIERS`, sem repetir, e a tecla no fim; sem modificador, só F1 a F24.
fn shortcut_ok(value: &str) -> bool {
    let mut parts: Vec<&str> = value.split('+').collect();
    let key = parts.pop().unwrap_or_default();
    let mut last: Option<usize> = None;
    for m in &parts {
        match MODIFIERS.iter().position(|x| x == m) {
            Some(i) if last.is_none_or(|l| i > l) => last = Some(i),
            _ => return false,
        }
    }
    let function = key
        .strip_prefix('F')
        .and_then(|n| n.parse::<u8>().ok())
        .is_some_and(|n| (1..=24).contains(&n))
        && !key[1..].starts_with('0');
    let single = key.len() == 1 && key.bytes().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit());
    (function || single || NAMED.contains(&key)) && (!parts.is_empty() || function)
}

/// Dígito verificador módulo 11: pesos de 2 a `max`, da direita para a esquerda.
fn mod11(values: &[u32], max: u32) -> u32 {
    let mut w = 2;
    let mut sum = 0;
    for v in values.iter().rev() {
        sum += v * w;
        w = if w == max { 2 } else { w + 1 };
    }
    match sum % 11 {
        r if r < 2 => 0,
        r => 11 - r,
    }
}

/// `None` = válido; `pattern` = forma errada (máscara, minúscula, tamanho); `check_digit` = dígito errado.
pub fn error(format: Format, value: &str) -> Option<&'static str> {
    if format == Format::Shortcut {
        return (!shortcut_ok(value)).then_some("pattern");
    }
    if format == Format::Phone {
        let ok = (10..=11).contains(&value.len()) && value.bytes().all(|c| c.is_ascii_digit());
        return (!ok).then_some("pattern");
    }
    let cnpj = match (format, value.len()) {
        (Format::Cpf, _) | (Format::CpfCnpj, 11) => false,
        (Format::Cnpj, _) | (Format::CpfCnpj, 14) => true,
        _ => return Some("pattern"),
    };
    let b = value.as_bytes();
    let shape = if cnpj {
        b.len() == 14 && b[..12].iter().all(|c| c.is_ascii_digit() || c.is_ascii_uppercase()) && b[12..].iter().all(u8::is_ascii_digit)
    } else {
        b.len() == 11 && b.iter().all(u8::is_ascii_digit)
    };
    if !shape {
        return Some("pattern");
    }
    // 000.000.000-00 passa no cálculo mas não existe
    if b.iter().all(|c| *c == b[0]) {
        return Some("check_digit");
    }
    // CNPJ alfanumérico: cada caractere vale o código ASCII menos 48 ('0' = 0, 'A' = 17)
    let values: Vec<u32> = b.iter().map(|c| u32::from(*c) - 48).collect();
    let (max, n) = (if cnpj { 9 } else { 11 }, values.len());
    let d1 = mod11(&values[..n - 2], max);
    let mut with_d1 = values[..n - 2].to_vec();
    with_d1.push(d1);
    let d2 = mod11(&with_d1, max);
    (values[n - 2] != d1 || values[n - 1] != d2).then_some("check_digit")
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    /// Os mesmos casos que a shell e todo backend precisam passar.
    #[test]
    fn conformance_cases() {
        let suite: Value = serde_json::from_str(include_str!("../../../spec/v0/conformance/documents.json")).unwrap();
        for c in suite["cases"].as_array().unwrap() {
            let format = serde_json::from_value(c["format"].clone()).unwrap();
            let value = c["value"].as_str().unwrap();
            assert_eq!(super::error(format, value), c["error"].as_str(), "{c}");
        }
    }
}
