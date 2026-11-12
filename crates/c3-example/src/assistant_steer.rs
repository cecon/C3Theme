//! Orientar o turno em andamento (ADR 0008) no agente de exemplo: a orientação chega com `steer: "pending"`, é lida
//! no próximo pedaço da resposta (`steer: "taken"`) e respondida no fim. Sem resposta em andamento, vira mensagem
//! comum com o aviso passageiro. Só a que espera pode ser removida.
use super::*;

/// Aviso quando não há turno para orientar.
pub(super) const IDLE: &str = "O agente não estava trabalhando: a mensagem foi como pergunta comum.";

impl Assistant {
    /// Há resposta sendo escrita nesta conversa.
    pub(super) fn writing(&self, room: &ChatRoom) -> bool {
        self.with_state(|s| s.writing.contains(&key(room))).unwrap_or(false)
    }

    pub(super) fn set_writing(&self, room: &ChatRoom, on: bool) {
        let _ = self.with_state(|s| {
            if on {
                s.writing.insert(key(room));
            } else {
                s.writing.remove(&key(room));
            }
        });
    }

    /// Lê as orientações que esperam: marca `taken`, avisa a tela e guarda o texto para responder no fim.
    pub(super) fn take_steers(&self, room: &ChatRoom) {
        let taken = self
            .with_state(|s| {
                let mut taken = vec![];
                for m in s.log.entry(key(room)).or_default().iter_mut() {
                    if m["steer"] == "pending" {
                        m["steer"] = json!("taken");
                        taken.push(m.clone());
                    }
                }
                let notes = s.notes.entry(key(room)).or_default();
                notes.extend(taken.iter().filter_map(|m| m["text"].as_str().map(str::to_owned)));
                taken
            })
            .unwrap_or_default();
        for m in taken {
            let _ = room.message(m);
        }
    }

    /// No fim da resposta: lê o que ainda esperava e responde as orientações lidas.
    pub(super) fn answer_steers(&self, room: ChatRoom) {
        self.take_steers(&room);
        let notes = self.with_state(|s| s.notes.remove(&key(&room))).ok().flatten().unwrap_or_default();
        if !notes.is_empty() {
            let list: Vec<String> = notes.iter().map(|n| format!("- {n}")).collect();
            self.say_later(room, format!("Anotei e já considerei:\n\n{}", list.join("\n")));
        }
    }

    /// Tira a orientação que ainda espera (emite `removed`); lida ou outra mensagem é 409.
    pub(super) fn remove_steer(&self, room: &ChatRoom, id: &str) -> Result<(), ApiError> {
        self.with_state(|s| {
            let log = s.log.entry(key(room)).or_default();
            let at = log
                .iter()
                .position(|m| m["id"] == id)
                .ok_or_else(|| ApiError::not_found("Mensagem não encontrada."))?;
            if log[at]["steer"] != "pending" {
                return Err(ApiError::conflict("O agente já leu esta mensagem.", None));
            }
            log.remove(at);
            Ok(())
        })??;
        let _ = room.emit(json!({ "type": "removed", "id": id }));
        Ok(())
    }
}
