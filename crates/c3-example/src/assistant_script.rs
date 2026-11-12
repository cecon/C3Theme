//! O roteiro do assistente do CRM: responde por palavra-chave com as partes do motor (formulário do relatório,
//! rascunho de cliente, cancelar o último pedido). Num sistema de verdade é o modelo que decide; aqui o roteiro só
//! mostra o fluxo inteiro contra a API real, com as partes conferidas pelo motor antes de sair.

use serde_json::{json, Map, Value};
use sqlx::SqlitePool;

/// O que o assistente responde: o texto e, se houver, a parte que pede ao usuário.
#[derive(Debug, Clone, PartialEq)]
pub struct Reply {
    pub text: String,
    pub part: Option<Value>,
}

impl Reply {
    fn text(text: &str) -> Self {
        Reply {
            text: text.to_owned(),
            part: None,
        }
    }

    fn with(text: &str, part: Value) -> Self {
        Reply {
            text: text.to_owned(),
            part: Some(part),
        }
    }
}

/// O que o assistente faz com a mensagem do usuário.
#[derive(Debug, Clone, PartialEq)]
pub enum Turn {
    /// Responde (com ou sem parte nova).
    Say(Reply),
    /// Desiste da parte aberta (`ui.cancel` com `reason: "agent"`) e avisa.
    Drop(String),
}

fn report() -> Value {
    json!({
        "kind": "c3.form",
        "payload": {
            "title": "Para montar o relatório, preciso do período",
            "fields": [
                { "name": "inicio", "type": "date", "label": "De", "required": true },
                { "name": "fim", "type": "date", "label": "Até", "required": true },
                { "name": "cliente", "type": "reference", "entity": "customer", "label": "Só deste cliente", "help": "Vazio: todos." }
            ],
            "rows": [["inicio", "fim"], ["cliente"]],
            "values": { "inicio": "2026-10-01", "fim": "2026-10-31" },
            "suggested": { "inicio": "mês passado", "fim": "mês passado" },
            "submitLabel": "Gerar relatório"
        }
    })
}

fn customer() -> Value {
    json!({
        "kind": "c3.record",
        "payload": {
            "entity": "customer",
            "values": { "name": "Padaria Bom Dia", "email": "contato@padariabomdia.com.br", "status": "lead", "credit_limit": "5000.00", "vip": false },
            "suggested": { "email": "do e-mail que você colou", "credit_limit": "média dos clientes do mesmo porte" }
        }
    })
}

/// A parte que cancela o pedido `id`, com o motivo tirado da conversa.
pub fn cancel_order(id: i64) -> Value {
    json!({
        "kind": "c3.action",
        "payload": {
            "entity": "sales_order",
            "id": id.to_string(),
            "action": "cancel",
            "input": { "reason": "Cliente desistiu da compra por telefone." },
            "suggested": { "reason": "da sua mensagem" }
        }
    })
}

/// O último pedido em aberto (o de maior número). A ação confere a filial e a permissão de quem clicar.
pub async fn last_open_order(pool: &SqlitePool) -> Option<i64> {
    sqlx::query_scalar("SELECT id FROM sales_order WHERE status = 'open' ORDER BY number DESC, id DESC LIMIT 1")
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
}

/// Para o texto do usuário: com uma parte aberta, "esquece" a cancela e texto sem pedido novo a mantém.
/// `order`: o último pedido em aberto, consultado só quando o texto pede cancelamento.
pub fn turn(raw: &str, pending: bool, order: Option<i64>) -> Turn {
    let text = raw.to_lowercase();
    if pending && ["esquec", "deixa", "não precisa"].iter().any(|k| text.contains(k)) {
        return Turn::Drop("Tudo bem, deixei esse pedido de lado.".into());
    }
    let reply = if text.contains("cadastr") || text.contains("cliente") {
        Reply::with(
            "Montei o cadastro com o que você me passou. Confira o limite de crédito, que eu estimei:",
            customer(),
        )
    } else if text.contains("cancel") {
        match order {
            Some(id) => Reply::with(
                "Achei o último pedido em aberto. Cancelar estorna o estoque, então confirme:",
                cancel_order(id),
            ),
            None => Reply::text("Não achei pedido em aberto."),
        }
    } else if pending && !text.contains("relat") {
        Reply::text("Anotado. O pedido acima continua aberto quando você quiser.")
    } else {
        Reply::with("Claro.", report())
    };
    Turn::Say(reply)
}

/// Pede o último pedido ao banco? Só quando o texto fala em cancelar.
pub fn needs_order(raw: &str) -> bool {
    let text = raw.to_lowercase();
    text.contains("cancel") && !text.contains("cadastr") && !text.contains("cliente")
}

/// O que o assistente diz depois que o usuário responde a parte `kind`.
pub fn after(kind: &str, answer: &Map<String, Value>) -> String {
    let action = answer.get("action").and_then(Value::as_str).unwrap_or_default();
    let value = |k: &str| {
        answer
            .get("values")
            .and_then(|v| v.get(k))
            .map(|v| v.as_str().map_or_else(|| v.to_string(), str::to_owned))
            .unwrap_or_default()
    };
    match (kind, action) {
        ("c3.form", "accept") => format!("Gerando o relatório de **{}** a **{}**…", value("inicio"), value("fim")),
        ("c3.form", _) => "Tudo bem, fica para depois.".into(),
        ("c3.record", "accept") => format!("Cliente **{}** cadastrado. Quer abrir um pedido para ele?", value("title")),
        ("c3.record", "undo") => "Desfeito: o cadastro foi apagado.".into(),
        ("c3.record", _) => "Ok, não cadastrei.".into(),
        (_, "accept") => format!("Feito. {}", value("message")).trim_end().to_owned(),
        _ => "Ok, não mexi em nada.".into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn say(t: Turn) -> Reply {
        match t {
            Turn::Say(r) => r,
            Turn::Drop(_) => panic!("esperava resposta"),
        }
    }

    #[test]
    fn roteiro_por_palavra_chave() {
        assert_eq!(say(turn("Cadastrar a Padaria", false, None)).part.unwrap()["kind"], "c3.record");
        assert_eq!(say(turn("Relatório do mês", false, None)).part.unwrap()["kind"], "c3.form");
        assert_eq!(say(turn("oi", false, None)).part.unwrap()["kind"], "c3.form");
        let cancel = say(turn("Cancelar o último pedido", false, Some(7))).part.unwrap();
        assert_eq!(cancel["payload"]["id"], "7");
        assert_eq!(say(turn("Cancelar", false, None)), Reply::text("Não achei pedido em aberto."));
        assert_eq!(say(turn("ok", true, None)).part, None, "com parte aberta, texto solto a mantém");
        assert_eq!(say(turn("um relatório", true, None)).part.unwrap()["kind"], "c3.form");
        assert_eq!(
            turn("esquece", true, None),
            Turn::Drop("Tudo bem, deixei esse pedido de lado.".into())
        );
        assert!(
            matches!(turn("esquece", false, None), Turn::Say(_)),
            "sem parte aberta não há o que esquecer"
        );
        assert!(needs_order("Cancelar o pedido") && !needs_order("cadastrar cliente") && !needs_order("oi"));
    }

    #[test]
    fn depois_da_resposta() {
        let a = |v: Value| v.as_object().unwrap().clone();
        let accept = a(
            json!({ "action": "accept", "values": { "inicio": "2026-10-01", "fim": "2026-10-31", "title": "Padaria", "message": "Pedido cancelado." } }),
        );
        assert_eq!(after("c3.form", &accept), "Gerando o relatório de **2026-10-01** a **2026-10-31**…");
        assert_eq!(
            after("c3.record", &accept),
            "Cliente **Padaria** cadastrado. Quer abrir um pedido para ele?"
        );
        assert_eq!(after("c3.action", &accept), "Feito. Pedido cancelado.");
        assert_eq!(after("c3.action", &a(json!({ "action": "accept" }))), "Feito.");
        assert_eq!(
            after("c3.record", &a(json!({ "action": "undo" }))),
            "Desfeito: o cadastro foi apagado."
        );
        assert_eq!(after("c3.record", &a(json!({ "action": "decline" }))), "Ok, não cadastrei.");
        assert_eq!(after("c3.form", &a(json!({ "action": "decline" }))), "Tudo bem, fica para depois.");
        assert_eq!(after("c3.action", &a(json!({ "action": "decline" }))), "Ok, não mexi em nada.");
        assert_eq!(
            after("c3.form", &a(json!({ "action": "accept", "values": { "inicio": 1 } }))),
            "Gerando o relatório de **1** a ****…"
        );
    }
}
