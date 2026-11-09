//! Sino do header (`layout.header.notifications`, spec/v0/notifications.yaml): os avisos são do sistema, que guarda,
//! cria e decide de quem é cada um. O motor só expõe as rotas e o canal do tempo real.
//!
//! O sistema implementa [`Notifications`] e passa no `Engine::builder(..).notifications(..)`; sem isso, as rotas
//! respondem 404. Para o contador subir na hora, ele guarda um clone de [`Bell`] e avisa depois de gravar.

use axum::http::request::Parts;
use serde_json::{json, Value};
use tokio::sync::broadcast;

use crate::error::ApiError;
use crate::Engine;

/// Quantos avisos por pedido, no máximo.
pub const MAX_LIMIT: usize = 100;
const DEFAULT_LIMIT: usize = 20;

/// Um aviso, como sai em GET /_notifications. Datas em RFC 3339.
#[derive(Debug, Clone, Default)]
pub struct Notification {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    /// neutral, primary, secondary, info, success, warning ou danger.
    pub tone: Option<String>,
    pub created_at: String,
    /// `None`: não lido.
    pub read_at: Option<String>,
    /// Rota da shell aberta ao clicar (ex.: "/conversa/7").
    pub to: Option<String>,
}

impl Notification {
    fn to_json(&self) -> Value {
        let mut v = json!({ "id": self.id, "title": self.title, "createdAt": self.created_at, "readAt": self.read_at });
        for (k, x) in [("description", &self.description), ("tone", &self.tone), ("to", &self.to)] {
            if let Some(x) = x {
                v[k] = json!(x);
            }
        }
        v
    }
}

/// A página de avisos e o total de não lidos do usuário (não só os da página).
#[derive(Debug, Clone, Default)]
pub struct NotificationList {
    pub items: Vec<Notification>,
    pub unread: u64,
}

/// Porta do sino: o sistema guarda os avisos onde quiser (tabela própria, outro serviço).
#[async_trait::async_trait]
pub trait Notifications: Send + Sync + 'static {
    /// De quem é o sino deste pedido (o id do usuário logado). A autenticação já passou pelo sistema.
    fn audience(&self, req: &Parts) -> String;
    /// Do mais novo ao mais velho, até `limit` (1 a 100).
    async fn list(&self, audience: &str, limit: usize) -> Result<NotificationList, ApiError>;
    /// Marca como lidos os `ids` do usuário (`None`: todos) e devolve quantos sobraram não lidos.
    /// Id que não é dele é ignorado; marcar de novo não muda o `readAt`.
    async fn mark_read(&self, audience: &str, ids: Option<&[String]>) -> Result<u64, ApiError>;
}

/// Canal do sino: avisa o usuário que a lista dele mudou. Clone barato, todos falam no mesmo canal.
#[derive(Clone)]
pub struct Bell(broadcast::Sender<String>);

impl Default for Bell {
    fn default() -> Self {
        Bell(broadcast::channel(256).0)
    }
}

impl Bell {
    pub fn new() -> Self {
        Self::default()
    }

    /// Avisa as abas abertas de `audience`: a shell relê GET /_notifications. Chame depois de gravar.
    pub fn notify(&self, audience: &str) {
        // erro aqui é só "ninguém ouvindo"
        let _ = self.0.send(audience.to_owned());
    }

    pub(crate) fn subscribe(&self) -> broadcast::Receiver<String> {
        self.0.subscribe()
    }
}

fn port(engine: &Engine) -> Result<&dyn Notifications, ApiError> {
    engine
        .0
        .notifications
        .as_deref()
        .ok_or_else(|| ApiError::not_found("Este sistema não tem notificações."))
}

/// `limit` da query: ausente vale 20; fora de 1..=100 ou não numérico, 400.
pub(crate) fn parse_limit(raw: Option<&str>) -> Result<usize, ApiError> {
    match raw {
        None => Ok(DEFAULT_LIMIT),
        Some(s) => match s.parse::<usize>() {
            Ok(n) if (1..=MAX_LIMIT).contains(&n) => Ok(n),
            _ => Err(ApiError::bad_request("limit precisa ser um número de 1 a 100.")),
        },
    }
}

pub(crate) async fn list(engine: &Engine, req: &Parts, limit: Option<&str>) -> Result<Value, ApiError> {
    let port = port(engine)?;
    let limit = parse_limit(limit)?;
    let page = port.list(&port.audience(req), limit).await?;
    let items: Vec<Value> = page.items.iter().take(limit).map(Notification::to_json).collect();
    Ok(json!({ "items": items, "unread": page.unread }))
}

/// Corpo de POST /_notifications/_read: `{}` (todos) ou `{ "ids": [...] }`.
pub(crate) fn parse_ids(body: &serde_json::Map<String, Value>) -> Result<Option<Vec<String>>, ApiError> {
    let bad = || ApiError::bad_request("Corpo precisa ser {} ou { \"ids\": [\"...\"] } com até 100 ids.");
    if body.keys().any(|k| k != "ids") {
        return Err(bad());
    }
    let Some(ids) = body.get("ids") else { return Ok(None) };
    let list = ids.as_array().filter(|a| a.len() <= MAX_LIMIT).ok_or_else(bad)?;
    list.iter()
        .map(|v| v.as_str().map(str::to_owned).ok_or_else(bad))
        .collect::<Result<Vec<_>, _>>()
        .map(Some)
}

pub(crate) async fn mark_read(engine: &Engine, req: &Parts, ids: Option<Vec<String>>) -> Result<Value, ApiError> {
    let port = port(engine)?;
    let audience = port.audience(req);
    let unread = port.mark_read(&audience, ids.as_deref()).await?;
    // as outras abas do mesmo usuário atualizam o contador
    engine.0.bell.notify(&audience);
    Ok(json!({ "unread": unread }))
}

/// Abre a assinatura do sino: o canal e de quem é.
pub(crate) fn subscribe(engine: &Engine, req: &Parts) -> Result<(broadcast::Receiver<String>, String), ApiError> {
    let port = port(engine)?;
    Ok((engine.0.bell.subscribe(), port.audience(req)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn limit_e_ids() {
        assert_eq!(parse_limit(None).unwrap(), 20);
        assert_eq!(parse_limit(Some("5")).unwrap(), 5);
        assert!(parse_limit(Some("0")).is_err());
        assert!(parse_limit(Some("101")).is_err());
        let obj = |v: Value| v.as_object().unwrap().clone();
        assert_eq!(parse_ids(&obj(json!({}))).unwrap(), None);
        assert_eq!(parse_ids(&obj(json!({ "ids": ["a"] }))).unwrap(), Some(vec!["a".to_owned()]));
        assert!(parse_ids(&obj(json!({ "ids": [1] }))).is_err());
        assert!(parse_ids(&obj(json!({ "outro": 1 }))).is_err());
    }
}
