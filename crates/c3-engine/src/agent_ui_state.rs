//! Concorrência das partes de interface do assistente (docs/chat-agentico.md, 13.1), para o backend que guarda a
//! conversa: no máximo uma parte pendente por conversa, e resposta só para a parte pendente, na versão que o usuário
//! viu. Funciona sobre as partes como trafegam (`{ id, kind, payload, state?, version?, reason?, expiresAt? }`), sem
//! banco: o sistema lê as partes da conversa, chama, grava e manda o evento `ui.cancel` de cada id devolvido. O id da
//! parte precisa ser único na conversa (o evento acha a parte por ele).

use serde_json::{json, Value};

use crate::error::ApiError;

fn state(part: &Value) -> &str {
    part.get("state").and_then(Value::as_str).unwrap_or("pending")
}

fn version(part: &Value) -> Option<u64> {
    part.get("version").and_then(Value::as_u64)
}

/// Deixa só a última parte pendente (na ordem das mensagens) aberta: as outras viram `cancelled` com
/// `reason: "superseded"`. Devolve os ids fechados, para o sistema avisar o chat com `ui.cancel`. Chamar depois de
/// acrescentar a parte nova. Parte vencida pelo prazo o sistema fecha antes, como `expired`.
pub fn supersede_agent_parts(parts: &mut [Value]) -> Vec<String> {
    let Some(keep) = parts.iter().rposition(|p| state(p) == "pending") else {
        return Vec::new();
    };
    let mut closed = Vec::new();
    for (i, p) in parts.iter_mut().enumerate() {
        if i == keep || state(p) != "pending" {
            continue;
        }
        if let Some(o) = p.as_object_mut() {
            o.insert("state".into(), json!("cancelled"));
            o.insert("reason".into(), json!("superseded"));
            closed.extend(o.get("id").and_then(Value::as_str).map(str::to_owned));
        }
    }
    closed
}

/// Confere se a parte aceita a resposta `action` (`accept`, `decline`, `cancel` ou `undo`) na versão `seen` (a que o
/// chat mandou). Parte fechada, versão diferente ou `undo` de parte que não foi gravada: 409, e o chat fecha o card
/// como substituído.
pub fn check_agent_reply(part: &Value, action: &str, seen: Option<u64>) -> Result<(), ApiError> {
    let open = match action {
        "undo" => state(part) == "submitted",
        "accept" | "decline" | "cancel" => state(part) == "pending",
        other => return Err(ApiError::bad_request(format!("resposta '{other}' desconhecida"))),
    };
    if !open {
        return Err(ApiError::conflict("Esta pergunta foi substituída ou já foi respondida.", None));
    }
    if action != "undo" && seen.is_some() && seen != version(part) {
        return Err(ApiError::conflict("Esta pergunta mudou depois que você abriu.", None));
    }
    Ok(())
}
