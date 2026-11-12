//! Chat com o agente (`pages[].chat`, `layout.header.assistant`; spec/v0/chat.yaml, ADR 0006). O agente é do
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

#[path = "chat_body.rs"]
mod body;
pub(crate) use body::{check_id, parse_answer, parse_limit, parse_outgoing, parse_ui_answer, MAX_TEXT};

/// Eventos que o navegador entende (`ChatEvent` do @c3theme/chat).
const EVENTS: [&str; 6] = ["message", "delta", "typing", "removed", "ui.cancel", "notice"];

/// Uma página do histórico, da mais antiga para a mais nova (`Message` do @c3theme/chat, em JSON).
#[derive(Debug, Clone, Default)]
pub struct ChatPage {
    pub messages: Vec<Value>,
    /// Há mensagens mais antigas que estas.
    pub has_more: bool,
}

/// O que o usuário mandou (POST /_chat/{conversation}/messages), já conferido. Para montar à mão, use
/// `..Outgoing::default()` nos campos que não importam.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct Outgoing {
    /// Id gerado no navegador: a mensagem gravada volta com ele.
    pub client_id: String,
    pub text: String,
    pub reply_to: Option<String>,
    /// Parte que esperava resposta quando o usuário digitou (`{ messageId, partId, kind, version? }`).
    pub pending_part: Option<Value>,
    /// Orientar o turno em andamento (ADR 0008): devolva a mensagem com `steer: "pending"` e, ao ler no próximo ponto
    /// seguro, emita de novo com `steer: "taken"`. Sem turno, ou agente que não recebe no meio, avise com
    /// [`ChatRoom::notice`] e trate como mensagem comum.
    pub steer: bool,
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
    /// Tira a orientação `message_id` que o agente ainda não leu (`steer: "pending"`) e emita `removed`. Já lida ou
    /// outra mensagem: 409. Padrão: 404 (o sistema não orienta).
    async fn remove(&self, _room: ChatRoom, _message_id: &str) -> Result<(), ApiError> {
        Err(ApiError::not_found("Este sistema não orienta o agente no meio do trabalho."))
    }
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

    /// Aviso passageiro com texto pronto (evento `notice`, `tone` `info`): não entra no histórico.
    pub fn notice(&self, text: &str) -> Result<(), String> {
        self.emit(json!({ "type": "notice", "text": text, "tone": "info" }))
    }

    /// Qualquer `ChatEvent` (`message`, `delta`, `typing`, `removed`, `ui.cancel`, `notice`). O `conversationId` é o da sala.
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

#[cfg(test)]
#[path = "chat_tests.rs"]
mod tests;
