//! Tempo real (`live` na entidade): quem está com a lista, o quadro ou o calendário aberto fica sabendo quando um
//! registro entra, muda ou sai, e a shell relê o que mostra.
//!
//! Só regra: o canal é um `broadcast` em memória e o aviso de cada assinante passa pela leitura dele (escopo da
//! filial e `rowAccess`). O transporte (SSE) fica em `crate::http::live`.
//!
//! O canal é do processo. Gravação que não passa pelo motor (o PDV gravando direto no banco, outra instância do
//! backend) chega por [`Live::notify`]: o sistema guarda um clone de [`Live`] e avisa depois do commit.

use axum::http::request::Parts;
use serde_json::{json, Value};
use tokio::sync::broadcast;

use crate::crud::{allow_read, fetch_one};
use crate::error::ApiError;
use crate::org::Ctx;
use crate::Engine;

/// Avisos guardados por assinante lento. Quem fica para trás recebe um `changed` e relê tudo.
const BUFFER: usize = 1024;

/// O que aconteceu com o registro.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Change {
    Created,
    Updated,
    Deleted,
    /// Vários registros, sem dizer quais (ação da lista, ação em conjunto, carga do sistema): a tela relê tudo.
    Changed,
}

impl Change {
    fn as_str(self) -> &'static str {
        match self {
            Change::Created => "created",
            Change::Updated => "updated",
            Change::Deleted => "deleted",
            Change::Changed => "changed",
        }
    }
}

/// Um aviso no canal: a entidade, o registro (nenhum em `Changed`) e o que aconteceu.
#[derive(Debug, Clone)]
pub struct LiveEvent {
    pub entity: String,
    pub id: Option<String>,
    pub change: Change,
}

/// Canal de avisos do motor. Clone barato: todos os clones falam no mesmo canal.
#[derive(Clone)]
pub struct Live(broadcast::Sender<LiveEvent>);

impl Default for Live {
    fn default() -> Self {
        Live(broadcast::channel(BUFFER).0)
    }
}

impl Live {
    pub fn new() -> Self {
        Self::default()
    }

    /// Avisa quem está com a entidade aberta. Chame depois do commit: o assinante relê na hora.
    /// Entidade sem `live` ou sem ninguém ouvindo: não faz nada.
    pub fn notify(&self, entity: &str, id: Option<&str>, change: Change) {
        let id = if change == Change::Changed { None } else { id.map(str::to_owned) };
        // erro aqui é só "ninguém ouvindo"
        let _ = self.0.send(LiveEvent {
            entity: entity.to_owned(),
            id,
            change,
        });
    }

    pub(crate) fn subscribe(&self) -> broadcast::Receiver<LiveEvent> {
        self.0.subscribe()
    }
}

impl Engine {
    /// O mesmo que [`Live::notify`], para quem já tem o `Engine` na mão.
    pub fn notify(&self, entity: &str, id: Option<&str>, change: Change) {
        self.0.live.notify(entity, id, change);
    }

    /// Aviso das gravações do próprio motor: só para entidade com `live`.
    pub(crate) fn emit(&self, entity: &str, id: Option<&str>, change: Change) {
        if self.0.entities.get(entity).is_some_and(|e| e.live) {
            self.notify(entity, id, change);
        }
    }
}

/// Abre a assinatura: a entidade precisa declarar `live` e o usuário precisa poder ler a lista.
pub(crate) async fn subscribe(engine: &Engine, req: &Parts, name: &str) -> Result<broadcast::Receiver<LiveEvent>, ApiError> {
    let entity = engine.entity(name)?;
    if !entity.live {
        return Err(ApiError::not_found(format!("Entidade '{name}' não declara live.")));
    }
    let ctx = Ctx::new(engine, req).await?;
    allow_read(&ctx, entity, |c| c.list)?;
    Ok(engine.0.live.subscribe())
}

/// O que vai para um assinante, ou `None` se o aviso não é para ele.
///
/// O contexto é refeito a cada aviso: sessão que caiu ou permissão retirada encerram a assinatura (`Err`).
/// `created` e `updated` só saem se o registro aparece na leitura do assinante (escopo e `rowAccess`); em
/// consulta do sistema (`source`), basta poder ler. `deleted` não tem o que reler: sai só o id, para quem lê a lista.
pub(crate) async fn for_subscriber(engine: &Engine, req: &Parts, name: &str, ev: &LiveEvent) -> Result<Option<Value>, ApiError> {
    if ev.entity != name {
        return Ok(None);
    }
    let entity = engine.entity(name)?;
    let ctx = Ctx::new(engine, req).await?;
    allow_read(&ctx, entity, |c| c.list)?;
    let check = matches!(ev.change, Change::Created | Change::Updated) && entity.source.is_none();
    if let (true, Some(id)) = (check, &ev.id) {
        let Some(row_id) = crate::value::parse_id(id) else {
            return Ok(None);
        };
        let mut conn = engine.0.store_of(entity).conn().await?;
        if fetch_one(&mut *conn, &ctx, entity, row_id).await?.is_none() {
            return Ok(None);
        }
    }
    Ok(Some(json!({ "change": ev.change.as_str(), "id": ev.id })))
}
