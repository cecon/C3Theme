//! Assistente do CRM (`layout.header.assistant` e a página `/assistente`, spec/v0/chat.yaml): conversas em memória,
//! por usuário, com o roteiro de `assistant_script`. A resposta sai aos pedaços (`delta`) e a parte no fim, conferida
//! pelo motor. Só uma parte fica pendente: a nova fecha a anterior (`ui.cancel` superseded). Sistema de verdade guarda
//! numa tabela própria e chama o modelo.

use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use axum::http::request::Parts;
use c3_engine::{check_agent_reply, supersede_agent_parts, ApiError, Chat, ChatPage, ChatRoom, Outgoing};
use serde_json::{json, Map, Value};
use sqlx::SqlitePool;

use crate::assistant_script::{after, last_open_order, needs_order, turn, Reply, Turn};

#[path = "assistant_lanes.rs"]
mod lanes;
#[path = "assistant_steer.rs"]
mod steer;

type Key = (String, String);

/// Pausa antes de responder e entre os pedaços, para a tela mostrar "pensando" e o texto chegando.
const THINK: Duration = Duration::from_millis(400);
const CHUNK: Duration = Duration::from_millis(40);

#[derive(Default)]
struct State {
    log: HashMap<Key, Vec<Value>>,
    lanes: HashMap<Key, Vec<Value>>,
    /// Sobe a cada Parar: a resposta em andamento confere e para.
    generation: HashMap<Key, u64>,
    /// Conversas com resposta sendo escrita, e as orientações lidas nela (respondidas no fim).
    writing: HashSet<Key>,
    notes: HashMap<Key, Vec<String>>,
}

#[derive(Clone)]
pub struct Assistant {
    pool: SqlitePool,
    state: Arc<Mutex<State>>,
    seq: Arc<AtomicU64>,
}

fn key(room: &ChatRoom) -> Key {
    (room.audience().to_owned(), room.conversation().to_owned())
}

fn now() -> String {
    crate::notifications::now()
}

fn bot(id: &str, text: &str) -> Value {
    json!({ "id": id, "author": { "id": "bot", "name": "Assistente", "kind": "agent" }, "direction": "in",
            "format": "markdown", "text": text, "createdAt": now() })
}

impl Assistant {
    pub fn new(pool: SqlitePool) -> Self {
        Assistant {
            pool,
            state: Arc::default(),
            seq: Arc::default(),
        }
    }

    fn next(&self, prefix: &str) -> String {
        format!("{prefix}{}", self.seq.fetch_add(1, Ordering::Relaxed) + 1)
    }

    fn with_state<T>(&self, f: impl FnOnce(&mut State) -> T) -> Result<T, ApiError> {
        let mut s = self.state.lock().map_err(|_| ApiError::internal())?;
        Ok(f(&mut s))
    }

    /// Grava (ou troca) a mensagem no histórico.
    fn store(&self, room: &ChatRoom, message: &Value) {
        let _ = self.with_state(|s| {
            let log = s.log.entry(key(room)).or_default();
            match log.iter_mut().find(|m| m["id"] == message["id"]) {
                Some(old) => *old = message.clone(),
                None => log.push(message.clone()),
            }
        });
    }

    /// A parte pendente da conversa, se houver: (mensagem, parte).
    fn pending(&self, room: &ChatRoom) -> Option<(String, String)> {
        let s = self.state.lock().ok()?;
        s.log.get(&key(room))?.iter().rev().find_map(|m| {
            let part = m["ui"].as_array()?.iter().find(|p| p.get("state").is_none_or(|v| v == "pending"))?;
            Some((m["id"].as_str()?.to_owned(), part["id"].as_str()?.to_owned()))
        })
    }

    /// Muda o estado da parte e devolve a mensagem atualizada.
    fn set_part(&self, room: &ChatRoom, message_id: &str, part_id: &str, fields: Value) -> Option<Value> {
        let mut s = self.state.lock().ok()?;
        let m = s.log.get_mut(&key(room))?.iter_mut().find(|m| m["id"] == message_id)?;
        let part = m["ui"].as_array_mut()?.iter_mut().find(|p| p["id"] == part_id)?;
        for (k, v) in fields.as_object()? {
            part[k] = v.clone();
        }
        Some(m.clone())
    }

    /// Fecha as partes pendentes que sobraram antes da nova (`ui.cancel` superseded).
    fn supersede(&self, room: &ChatRoom) {
        let closed = self.with_state(|s| {
            let log = s.log.entry(key(room)).or_default();
            let mut parts: Vec<Value> = log.iter().flat_map(|m| m["ui"].as_array().cloned().unwrap_or_default()).collect();
            let closed = supersede_agent_parts(&mut parts);
            for m in log.iter_mut() {
                for p in m["ui"].as_array_mut().into_iter().flatten() {
                    if closed.iter().any(|id| p["id"] == id.as_str()) {
                        p["state"] = json!("cancelled");
                        p["reason"] = json!("superseded");
                    }
                }
            }
            closed
        });
        for id in closed.unwrap_or_default() {
            let _ = room.emit(json!({ "type": "ui.cancel", "partId": id, "reason": "superseded" }));
        }
    }

    fn generation(&self, room: &ChatRoom) -> u64 {
        self.state
            .lock()
            .map(|s| s.generation.get(&key(room)).copied().unwrap_or(0))
            .unwrap_or(0)
    }

    /// Escreve a resposta aos pedaços e, no fim, a mensagem inteira com a parte. Parar no meio fecha com o que já foi.
    async fn speak(&self, room: ChatRoom, reply: Reply) {
        let id = self.next("bot-");
        let started = self.generation(&room);
        let mut message = bot(&id, "");
        message["streaming"] = json!(true);
        self.set_writing(&room, true);
        let _ = room.message(message.clone());
        tokio::time::sleep(THINK).await;
        let mut said = String::new();
        for word in reply.text.split_inclusive(' ') {
            if self.generation(&room) != started {
                break;
            }
            self.take_steers(&room);
            said.push_str(word);
            let _ = room.delta(&id, word, false);
            tokio::time::sleep(CHUNK).await;
        }
        let mut done = bot(&id, &said);
        if said.len() == reply.text.len() {
            if let Some(mut part) = reply.part {
                part["id"] = json!(self.next("parte-"));
                done["ui"] = json!([part]);
            }
        }
        // parte que o motor recusa vira só texto
        if room.message(done.clone()).is_err() {
            done.as_object_mut().map(|m| m.remove("ui"));
            let _ = room.message(done.clone());
        }
        self.store(&room, &done);
        if done.get("ui").is_some() {
            self.supersede(&room);
        }
        self.set_writing(&room, false);
        self.answer_steers(room);
    }

    /// Mensagem curta do assistente, sem pedaços (resposta a uma parte).
    fn say_later(&self, room: ChatRoom, text: String) {
        let this = self.clone();
        tokio::spawn(async move {
            tokio::time::sleep(THINK).await;
            let message = bot(&this.next("bot-"), &text);
            let _ = room.message(message.clone());
            this.store(&room, &message);
        });
    }
}

#[c3_engine::async_trait]
impl Chat for Assistant {
    async fn lanes(&self, room: ChatRoom) -> Result<Vec<Value>, ApiError> {
        self.list_lanes(room)
    }
    async fn open_lane(&self, room: ChatRoom, input: Value) -> Result<Value, ApiError> {
        self.create_lane(room, input).await
    }

    fn audience(&self, req: &Parts) -> String {
        crate::user(req).unwrap_or("anon").to_owned()
    }

    async fn history(&self, room: &ChatRoom, before: Option<&str>, limit: usize) -> Result<ChatPage, ApiError> {
        self.with_state(|s| {
            let all = s.log.get(&key(room)).map(Vec::as_slice).unwrap_or_default();
            let end = before.and_then(|b| all.iter().position(|m| m["id"] == b)).unwrap_or(all.len());
            let start = end.saturating_sub(limit);
            ChatPage {
                messages: all[start..end].to_vec(),
                has_more: start > 0,
            }
        })
    }

    async fn send(&self, room: ChatRoom, m: Outgoing) -> Result<Value, ApiError> {
        let mut mine = json!({ "id": self.next("me-"), "clientId": m.client_id, "author": { "id": room.audience(), "name": "Você" },
                           "direction": "out", "text": m.text, "status": "sent", "createdAt": now() });
        let steering = m.steer && self.writing(&room);
        if steering {
            mine["steer"] = json!("pending");
        } else if m.steer {
            let _ = room.notice(steer::IDLE);
        }
        self.store(&room, &mine);
        if steering {
            return Ok(mine);
        }
        let pending = self.pending(&room);
        let order = if needs_order(&m.text) {
            last_open_order(&self.pool).await
        } else {
            None
        };
        let this = self.clone();
        tokio::spawn(async move {
            match turn(&m.text, pending.is_some(), order) {
                Turn::Say(reply) => this.speak(room, reply).await,
                Turn::Drop(text) => {
                    if let Some((message_id, part_id)) = pending {
                        this.set_part(&room, &message_id, &part_id, json!({ "state": "cancelled", "reason": "agent" }));
                        let _ = room.emit(json!({ "type": "ui.cancel", "partId": part_id, "messageId": message_id, "reason": "agent" }));
                    }
                    this.say_later(room, text);
                }
            }
        });
        Ok(mine)
    }

    async fn remove(&self, room: ChatRoom, message_id: &str) -> Result<(), ApiError> {
        self.remove_steer(&room, message_id)
    }

    async fn stop(&self, room: ChatRoom) -> Result<(), ApiError> {
        self.with_state(|s| *s.generation.entry(key(&room)).or_default() += 1)
    }

    async fn answer(&self, _room: ChatRoom, _message_id: &str, _answer: Map<String, Value>) -> Result<(), ApiError> {
        Err(ApiError::not_found("Este assistente não faz perguntas com opções."))
    }

    async fn answer_ui(&self, room: ChatRoom, message_id: &str, part_id: &str, answer: Map<String, Value>) -> Result<(), ApiError> {
        let part = self
            .with_state(|s| {
                let log = s.log.get(&key(&room))?;
                let m = log.iter().find(|m| m["id"] == message_id)?;
                m["ui"].as_array()?.iter().find(|p| p["id"] == part_id).cloned()
            })?
            .ok_or_else(|| ApiError::not_found("Parte não encontrada."))?;
        let action = answer["action"].as_str().unwrap_or_default();
        check_agent_reply(&part, action, answer.get("version").and_then(Value::as_u64))?;
        let state = match action {
            "accept" => "submitted",
            "decline" => "declined",
            "undo" => "undone",
            _ => "cancelled",
        };
        if let Some(updated) = self.set_part(&room, message_id, part_id, json!({ "state": state })) {
            let _ = room.message(updated);
        }
        let kind = part["kind"].as_str().unwrap_or_default();
        self.say_later(room, after(kind, &answer));
        Ok(())
    }
}
