//! Consultas da empresa (`lookups`): CEP preenche o endereço e CNPJ preenche o nome fantasia. Num sistema real
//! aqui se chama o ViaCEP ou a Receita, com timeout e cache; o exemplo responde de uma tabela fixa, para a suíte
//! ver os três desfechos (achou, não achou, fonte fora do ar).

use c3_engine::{ApiError, LookupCall};
use serde_json::{json, Map, Value};

pub fn run(call: LookupCall<'_>) -> Result<Map<String, Value>, ApiError> {
    // origem reference (a empresa) e `with` (campos do formulário ainda não salvo): o limite depende do vip
    if call.lookup == "suggest_credit" {
        let limit = if call.with["vip"] == Value::Bool(true) {
            "5000.00"
        } else {
            "1000.00"
        };
        return Ok(json!({ "credit_limit": limit }).as_object().cloned().unwrap_or_default());
    }
    let data = match (call.lookup, call.value) {
        ("cep", "01310100") => json!({ "street": "Avenida Paulista", "city": "São Paulo", "state": "SP" }),
        ("cep", "99999999") => return Err(ApiError::unavailable("Consulta de CEP fora do ar. Preencha à mão.")),
        // filha with_parent: a permissão conferida é a do pai (company), não a da filha, que só lê
        ("sintegra", "110042490114") => json!({ "tax_regime": "presumido" }),
        ("cnpj", "11222333000181") => json!({ "trade_name": "Empresa Exemplo" }),
        // devolve campo fora de fills: a suíte confere que o motor barra
        ("cnpj", "11444777000161") => json!({ "certificate": "x" }),
        _ => return Err(ApiError::not_found("Nada encontrado para este valor.")),
    };
    Ok(data.as_object().cloned().unwrap_or_default())
}
