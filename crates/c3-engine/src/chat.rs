//! Chat com o agente (`pages[].chat`, `layout.header.assistant`; spec/v0/chat.yaml, ADR 0005). O agente é do
//! sistema, como a autenticação: ele guarda o histórico, chama o modelo e decide a resposta. O motor só expõe as
//! rotas, separa as conversas por usuário e confere cada parte de interface antes de mandar ao navegador.
//!
//! O sistema implementa [`Chat`] e passa no `Engine::builder(..).chat(..)`; sem isso, as rotas respondem 404. A
//! resposta do agente sai pelo [`ChatRoom`] que cada chamada recebe (clone barato: guarde e responda depois).

use axum::http::request::Parts;
use serde_json::{json, Map, Value};
use tokio::sync::broadcast;

use crate::error::ApiError;
use crate::Engine;

/// Mensagens por página do histórico, no máximo.
pub const MAX_LIMIT: usize = 100;
const DEFAULT_LIMIT: usize = 30;
/// Tamanho máximo do texto que o usuário manda, em caracteres.
pub const MAX_TEXT: usize = 20_000;
/// Eventos que o navegador entende (`ChatEvent` do @c3theme/chat).
const EVENTS: [&str; 5] = ["message", "delta", "typing", "removed", "ui.cancel"];

/// Uma página do histórico, da mais antiga para a mais nova (`Message` do @c3theme/chat, em JSON).
#[derive(Debug, Clone, Default)]
pub struct ChatPage {
    pub messages: Vec<Value>,
    /// Há mensagens mais antigas que estas.
    pub has_more: bool,
}

/// O que o usuário mandou (POST /_chat/{conversation}/messages), já conferido.
#[derive(Debug, Clone, PartialEq)]
pub struct Outgoing {
    /// Id gerado no navegador: a mensagem gravada volta com ele.
    pub client_id: String,
    pub text: String,
    pub reply_to: Option<String>,
    /// Parte que esperava resposta quando o usuário digitou (`{ messageId, partId, kind, version? }`).
    pub pending_part: Option<Value>,
}

/// Porta do chat: o sistema guarda as conversas e fala com o modelo.
#[async_trait::async_trait]
pub trait Chat: Send + Sync + 'static {
    /// Filhas visíveis ao usuário da sala. Confira acesso antes de listar, abrir ou executar ações.
    async fn lanes(&self, _room: ChatRoom) -> Result<Vec<Value>, ApiError> {
        Err(ApiError::not_found("Este sistema não tem conversas à parte."))
    }
    /// Cria uma filha; ramo copia apenas até `fromMessageId`, que precisa pertencer à sala.
    async fn open_lane(&self, _room: ChatRoom, _input: Value) -> Result<Value, ApiError> {
        Err(ApiError::not_found("Este sistema não tem conversas à parte."))
    }
    /// Confira a ação declarada e a mensagem na sala antes de executar.
    async fn message_action(&self, _room: ChatRoom, _message: &str, _action: &str) -> Result<Value, ApiError> {
        Err(ApiError::not_found("Este sistema não tem ações por mensagem."))
    }
    /// De quem é a conversa deste pedido (o id do usuário logado). A autenticação já passou pelo sistema.
    fn audience(&self, req: &Parts) -> String;
    /// Sem `before`, as `limit` mais recentes; com `before` (id de mensagem), as anteriores a ela.
    async fn history(&self, room: &ChatRoom, before: Option<&str>, limit: usize) -> Result<ChatPage, ApiError>;
    /// Grava a mensagem do usuário e devolve como ficou (com o `client_id`). A resposta vai pelo `room`.
    async fn send(&self, room: ChatRoom, message: Outgoing) -> Result<Value, ApiError>;
    /// Para a resposta em andamento. Padrão: não faz nada.
    async fn stop(&self, room: ChatRoom) -> Result<(), ApiError> {
        let _ = room;
        Ok(())
    }
    /// Resposta (ou dispensa) da pergunta da mensagem `message_id` (`QuestionAnswer`). Já respondida: 409.
    async fn answer(&self, room: ChatRoom, message_id: &str, answer: Map<String, Value>) -> Result<(), ApiError>;
    /// Resposta de uma parte (`UiAnswer`, `action` já conferida). Confira o estado com `check_agent_reply` (409).
    async fn answer_ui(&self, room: ChatRoom, message_id: &str, part_id: &str, answer: Map<String, Value>) -> Result<(), ApiError>;
}

/// Um evento para as abas abertas de uma conversa de um usuário.
#[derive(Debug, Clone)]
pub(crate) struct ChatSignal {
    pub audience: String,
    pub conversation: String,
    pub event: Value,
}

pub(crate) fn feed() -> broadcast::Sender<ChatSignal> {
    broadcast::channel(512).0
}

/// A conversa de um usuário: por onde o agente responde.
#[derive(Clone)]
pub struct ChatRoom {
    engine: Engine,
    audience: String,
    conversation: String,
}

impl ChatRoom {
    /// Outra conversa do mesmo usuário; não muda a audiência nem a sessão.
    pub fn in_conversation(&self, conversation: &str) -> Result<Self, ApiError> {
        check_conversation(conversation)?;
        Ok(Self {
            engine: self.engine.clone(),
            audience: self.audience.clone(),
            conversation: conversation.to_owned(),
        })
    }
    pub fn audience(&self) -> &str {
        &self.audience
    }

    pub fn conversation(&self) -> &str {
        &self.conversation
    }

    /// Mensagem nova ou atualizada. Cada parte de `ui` passa por `Engine::check_agent_part`; com uma recusada,
    /// nada sai e o `Err` diz por quê (troque a parte por texto).
    pub fn message(&self, message: Value) -> Result<(), String> {
        self.emit(json!({ "type": "message", "message": message }))
    }

    /// Pedaço de texto da resposta `id` (que já saiu com `streaming: true`); `done` encerra.
    pub fn delta(&self, id: &str, text: &str, done: bool) -> Result<(), String> {
        self.emit(json!({ "type": "delta", "id": id, "text": text, "done": done }))
    }

    /// Qualquer `ChatEvent` (`message`, `delta`, `typing`, `removed`, `ui.cancel`). O `conversationId` é o da sala.
    pub fn emit(&self, mut event: Value) -> Result<(), String> {
        let obj = event.as_object_mut().ok_or("o evento precisa ser um objeto")?;
        let kind = obj.get("type").and_then(Value::as_str).unwrap_or_default();
        if !EVENTS.contains(&kind) {
            return Err(format!("evento '{kind}' desconhecido"));
        }
        if kind == "message" {
            let m = obj
                .get_mut("message")
                .and_then(Value::as_object_mut)
                .ok_or("message precisa ser um objeto")?;
            m.insert("conversationId".into(), json!(self.conversation));
            for part in m.get("ui").and_then(Value::as_array).into_iter().flatten() {
                self.engine.check_agent_part(part)?;
            }
        } else {
            obj.insert("conversationId".into(), json!(self.conversation));
        }
        // erro aqui é só "ninguém ouvindo"
        let _ = self.engine.0.chat_feed.send(ChatSignal {
            audience: self.audience.clone(),
            conversation: self.conversation.clone(),
            event,
        });
        Ok(())
    }
}

fn port(engine: &Engine) -> Result<&dyn Chat, ApiError> {
    engine
        .0
        .chat
        .as_deref()
        .ok_or_else(|| ApiError::not_found("Este sistema não tem assistente."))
}

/// Id da conversa: `^[A-Za-z0-9_-]{1,64}$`.
pub(crate) fn check_conversation(id: &str) -> Result<(), ApiError> {
    let ok = (1..=64).contains(&id.len()) && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-');
    if ok {
        Ok(())
    } else {
        Err(ApiError::bad_request("Conversa inválida: use letras, números, _ ou -, até 64."))
    }
}

/// O porta e a sala do pedido (404 sem chat, 400 com conversa inválida).
pub(crate) fn open<'a>(engine: &'a Engine, req: &Parts, conversation: &str) -> Result<(&'a dyn Chat, ChatRoom), ApiError> {
    let port = port(engine)?;
    check_conversation(conversation)?;
    let room = ChatRoom {
        engine: engine.clone(),
        audience: port.audience(req),
        conversation: conversation.to_owned(),
    };
    Ok((port, room))
}

/// `limit` da query: ausente vale 30; fora de 1..=100 ou não numérico, 400.
pub(crate) fn parse_limit(raw: Option<&str>) -> Result<usize, ApiError> {
    match raw {
        None => Ok(DEFAULT_LIMIT),
        Some(s) => match s.parse::<usize>() {
            Ok(n) if (1..=MAX_LIMIT).contains(&n) => Ok(n),
            _ => Err(ApiError::bad_request("limit precisa ser um número de 1 a 100.")),
        },
    }
}

fn text_of(body: &Map<String, Value>, key: &str, max: usize) -> Result<Option<String>, ApiError> {
    match body.get(key) {
        None | Some(Value::Null) => Ok(None),
        Some(Value::String(s)) if !s.is_empty() && s.chars().count() <= max => Ok(Some(s.clone())),
        Some(_) => Err(ApiError::bad_request(format!("{key} precisa ser texto de 1 a {max} caracteres."))),
    }
}

/// Corpo de POST messages: `{ clientId, text, replyTo?, pendingPart? }`, sem outras chaves.
pub(crate) fn parse_outgoing(body: &Map<String, Value>) -> Result<Outgoing, ApiError> {
    if let Some(k) = body
        .keys()
        .find(|k| !["clientId", "text", "replyTo", "pendingPart"].contains(&k.as_str()))
    {
        return Err(ApiError::bad_request(format!("'{k}' não vale no envio.")));
    }
    let required = |v: Option<String>, key: &str| v.ok_or_else(|| ApiError::bad_request(format!("{key} é obrigatório.")));
    let pending_part = match body.get("pendingPart") {
        None | Some(Value::Null) => None,
        Some(p @ Value::Object(o))
            if ["messageId", "partId", "kind"]
                .iter()
                .all(|k| o.get(*k).is_some_and(Value::is_string)) =>
        {
            Some(p.clone())
        }
        Some(_) => return Err(ApiError::bad_request("pendingPart precisa de messageId, partId e kind.")),
    };
    Ok(Outgoing {
        client_id: required(text_of(body, "clientId", 100)?, "clientId")?,
        text: required(text_of(body, "text", MAX_TEXT)?, "text")?,
        reply_to: text_of(body, "replyTo", 100)?,
        pending_part,
    })
}

/// Corpo da resposta de pergunta: `{ optionIds?: string[], text?: string, dismissed?: boolean }`.
pub(crate) fn parse_answer(body: Map<String, Value>) -> Result<Map<String, Value>, ApiError> {
    let ok = body.iter().all(|(k, v)| match k.as_str() {
        "optionIds" => v.as_array().is_some_and(|a| a.iter().all(Value::is_string)),
        "text" => v.is_string(),
        "dismissed" => v.is_boolean(),
        _ => false,
    });
    if ok {
        Ok(body)
    } else {
        Err(ApiError::bad_request("Resposta precisa ser { optionIds?, text?, dismissed? }."))
    }
}

/// Corpo da resposta de parte: `action` é `accept`, `decline`, `cancel` ou `undo`; `values` objeto; `version` número.
pub(crate) fn parse_ui_answer(body: Map<String, Value>) -> Result<Map<String, Value>, ApiError> {
    let action = body.get("action").and_then(Value::as_str);
    if !action.is_some_and(|a| ["accept", "decline", "cancel", "undo"].contains(&a)) {
        return Err(ApiError::bad_request("action precisa ser accept, decline, cancel ou undo."));
    }
    let shape = |k: &str, ok: fn(&Value) -> bool| body.get(k).is_none_or(ok);
    if !shape("values", Value::is_object) || !shape("version", Value::is_u64) || !shape("reason", Value::is_string) {
        return Err(ApiError::bad_request("values precisa ser objeto, version número e reason texto."));
    }
    Ok(body)
}

/// Id de mensagem ou de parte no caminho: não vazio.
pub(crate) fn check_id(id: &str, what: &str) -> Result<(), ApiError> {
    if id.is_empty() {
        Err(ApiError::bad_request(format!("{what} vazio.")))
    } else {
        Ok(())
    }
}

#[cfg(test)]
#[path = "chat_tests.rs"]
mod tests;
