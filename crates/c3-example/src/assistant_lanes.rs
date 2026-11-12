//! Conversas filhas do agente de exemplo, isoladas por usuário e pai.
use super::*;

impl Assistant {
    pub(super) fn list_lanes(&self, room: ChatRoom) -> Result<Vec<Value>, ApiError> {
        self.with_state(|s| s.lanes.get(&key(&room)).cloned().unwrap_or_default())
    }

    pub(super) async fn create_lane(&self, room: ChatRoom, input: Value) -> Result<Value, ApiError> {
        let id = self.next("lane-");
        let child = room.in_conversation(&id)?;
        let text = input["text"].as_str().unwrap_or_default().to_owned();
        let title = if text.is_empty() {
            if input["kind"] == "branch" {
                "Ramo da resposta"
            } else {
                "Pergunta à parte"
            }
        } else {
            &text
        };
        let lane = json!({ "id": id, "title": title, "kind": input["kind"], "parentId": room.conversation(),
            "unread": 0, "updatedAt": now(), "fromMessageId": input["fromMessageId"] });
        self.with_state(|s| {
            let history = s.log.get(&key(&room)).cloned().unwrap_or_default();
            let end = input["fromMessageId"]
                .as_str()
                .and_then(|m| history.iter().position(|v| v["id"] == m));
            if input["fromMessageId"].is_string() && end.is_none() {
                return Err(ApiError::bad_request("Mensagem não pertence à conversa."));
            }
            let copy = if input["kind"] == "branch" {
                history
                    .into_iter()
                    .take(end.map_or(0, |n| n + 1))
                    .map(|mut m| {
                        m["conversationId"] = json!(id);
                        m
                    })
                    .collect()
            } else {
                vec![]
            };
            s.log.insert(key(&child), copy);
            s.lanes.entry(key(&room)).or_default().push(lane.clone());
            Ok(())
        })??;
        if !text.is_empty() {
            self.send(
                child,
                Outgoing {
                    client_id: self.next("lane-msg-"),
                    text,
                    ..Outgoing::default()
                },
            )
            .await?;
        }
        Ok(lane)
    }
}
