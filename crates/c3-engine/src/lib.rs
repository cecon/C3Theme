//! Backend Axum + SQLite do contrato C3 (spec/v0).
//!
//! O sistema entrega o banco (um [`Store`]: `c3_engine::sqlx` ou o crate `c3-engine-rusqlite`), os JSONs da spec e as migrations; o crate entrega `/_meta`,
//! o CRUD genérico, as condições e o formato de erro. O sistema que tem escritor próprio (auditoria,
//! lançamento contábil) fica com a gravação e deixa a validação com o motor (`Hooks::delegates_writes`). Uso em `crates/c3-example`.

mod access;
mod action;
mod action_grid;
mod action_input;
mod action_list;
mod action_prefill;
mod action_preview;
mod action_reply;
mod action_together;
mod agent_ui;
mod agent_ui_state;
mod boot;
mod capabilities;
mod children;
mod children_write;
mod condition;
mod crud;
mod document;
mod download;
mod error;
mod field;
mod hooks;
mod http;
mod live;
mod locked;
mod lookup;
mod meta;
mod notifications;
mod org;
mod ref_filter;
mod relative_date;
mod row_access;
mod section;
mod spec;
mod spec_action;
mod spec_source;
#[cfg(feature = "sqlx")]
pub mod sqlx;
mod store;
mod validation;
mod value;
mod version;
mod write;

use std::collections::HashMap;
use std::sync::Arc;

use axum::Router;

pub use action::ActionCall;
pub use action_list::ListActionCall;
pub use action_prefill::PrefillCall;
pub use action_preview::{Preview, PreviewCall, PreviewColumn, PreviewTable};
pub use action_reply::{ActionOutcome, OpenRecord};
pub use action_together::BulkActionCall;
pub use agent_ui_state::{check_agent_reply, supersede_agent_parts};
/// Para implementar `Hooks::validate` e `Hooks::run_action` (async) sem adicionar a dependência: `#[c3_engine::async_trait]`.
pub use async_trait::async_trait;
pub use capabilities::{Capabilities, OrgAccess};
pub use crud::source::{SourceCall, SourceSql};
pub use download::{FileCall, FileContent};
pub use error::{ApiError, FieldErrors};
pub use hooks::{Hooks, RequestContext};
pub use live::{Change, Live, LiveEvent};
pub use lookup::LookupCall;
pub use notifications::{Bell, Notification, NotificationList, Notifications};
pub use relative_date::Clock;
pub use spec::{FieldType, Scope};
pub use store::{Conn, Executed, Row, SqlValue, Store, StoreError, StoreErrorKind, Tx};
pub use write::{ChildRow, ChildWrite, WriteCall, WriteOp};

struct NoHooks;
impl Hooks for NoHooks {}

pub(crate) struct Inner {
    pub app: spec::App,
    pub entities: HashMap<String, spec::Entity>,
    pub children: children::Children,
    /// `rowAccess` de cada entidade (ver `access.rs`).
    pub row_access: HashMap<String, Vec<row_access::RowRule>>,
    pub store: Box<dyn Store>,
    pub hooks: Box<dyn Hooks>,
    pub live: Live,
    /// Sino do header: a porta do sistema (sem ela, as rotas respondem 404) e o canal do tempo real.
    pub notifications: Option<Box<dyn notifications::Notifications>>,
    pub bell: Bell,
}

#[derive(Clone)]
pub struct Engine(pub(crate) Arc<Inner>);

impl Engine {
    /// `store`: o banco do sistema, por um adaptador (`c3_engine::sqlx::SqlxStore`, `c3_engine_rusqlite::RusqliteStore`).
    pub fn builder(store: impl Store) -> EngineBuilder {
        EngineBuilder {
            store: Box::new(store),
            app: None,
            entities: Vec::new(),
            hooks: Box::new(NoHooks),
            live: Live::default(),
            notifications: None,
            bell: Bell::default(),
            read_only: false,
        }
    }

    /// Rotas do contrato, para montar com `Router::new().nest("/api", engine.router())`.
    pub fn router(&self) -> Router {
        http::router(self.clone())
    }
}

pub struct EngineBuilder {
    store: Box<dyn Store>,
    app: Option<String>,
    entities: Vec<String>,
    hooks: Box<dyn Hooks>,
    live: Live,
    notifications: Option<Box<dyn notifications::Notifications>>,
    bell: Bell,
    read_only: bool,
}

/// Erro de configuração no boot: JSON inválido ou banco que não bate com as entidades.
#[derive(Debug)]
pub struct BuildError(pub String);

impl std::fmt::Display for BuildError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "c3-engine: {}", self.0)
    }
}

impl std::error::Error for BuildError {}

impl EngineBuilder {
    pub fn app(mut self, json: &str) -> Self {
        self.app = Some(json.to_owned());
        self
    }

    pub fn entity(mut self, json: &str) -> Self {
        self.entities.push(json.to_owned());
        self
    }

    pub fn hooks(mut self, hooks: impl Hooks) -> Self {
        self.hooks = Box::new(hooks);
        self
    }

    /// Canal de tempo real criado antes do motor, para os hooks avisarem o que o sistema grava (`Live::notify`).
    pub fn live(mut self, live: Live) -> Self {
        self.live = live;
        self
    }

    /// Sino do header (`layout.header.notifications`): onde o sistema guarda os avisos de cada usuário.
    pub fn notifications(mut self, port: impl Notifications) -> Self {
        self.notifications = Some(Box::new(port));
        self
    }

    /// Canal do sino criado antes do motor, para o sistema avisar quando cria um aviso (`Bell::notify`).
    pub fn bell(mut self, bell: Bell) -> Self {
        self.bell = bell;
        self
    }

    /// O motor só lê: toda gravação é do sistema. O `build()` recusa entidade que não delega a escrita
    /// (`Hooks::delegates_writes`; filha gravada com o pai vai na escrita dele) e conexão sem `PRAGMA query_only`
    /// (`c3_engine::sqlx::sqlite_options_read_only`, `c3_engine_rusqlite::prepare_read_only`). Para sistema com
    /// escritor único e auditoria na transação, em que o motor gravar seria um erro e não uma opção.
    pub fn read_only(mut self) -> Self {
        self.read_only = true;
        self
    }

    /// Lê os JSONs e confere o banco. Falha alto se algo não bate, para o erro aparecer no deploy e não na tela.
    pub async fn build(self) -> Result<Engine, BuildError> {
        let err = |m: String| BuildError(m);
        let app = spec::parse_app(
            self.app
                .as_deref()
                .ok_or_else(|| err("app.json não informado (.app(...))".into()))?,
        )
        .map_err(err)?;

        let mut parsed = Vec::new();
        for json in &self.entities {
            parsed.push(spec::parse_entity(json).map_err(err)?);
        }
        let mut entities = HashMap::new();
        for (mut entity, conditions) in parsed {
            spec::resolve_entity(&mut entity, conditions).map_err(err)?;
            section::apply(&mut entity).map_err(err)?;
            if !app.entities.contains(&entity.name) {
                return Err(err(format!("entidade '{}' carregada mas fora de app.entities", entity.name)));
            }
            entities.insert(entity.name.clone(), entity);
        }
        for name in &app.entities {
            if !entities.contains_key(name) {
                return Err(err(format!(
                    "app.entities cita '{name}', mas a entidade não foi carregada (.entity(...))"
                )));
            }
        }
        org::check_spec(&app, &entities).map_err(err)?;
        for entity in entities.values() {
            let rows = entity.actions.iter().flat_map(|a| a.grids.iter().flat_map(|r| &r.row.fields));
            for f in entity
                .fields
                .iter()
                .chain(entity.actions.iter().flat_map(|a| &a.input.fields))
                .chain(rows)
            {
                if f.ty == FieldType::File && f.max_size > app.max_upload {
                    return Err(err(format!(
                        "{}.{}: maxSize {} acima do maxUploadSize do app ({} bytes)",
                        entity.name, f.name, f.max_size, app.max_upload
                    )));
                }
                if let Some(target) = &f.reference {
                    let target = entities
                        .get(target)
                        .ok_or_else(|| err(format!("{}.{} referencia entidade desconhecida", entity.name, f.name)))?;
                    ref_filter::check(entity, f, target).map_err(err)?;
                    if !target.title_field().is_some_and(|t| t.ty.is_textual()) {
                        return Err(err(format!(
                            "{} precisa de um titleField de texto para ser referenciada",
                            target.name
                        )));
                    }
                }
            }
            for s in &entity.search {
                if !entity.field(s).is_some_and(|f| f.ty.is_textual() && !f.write_only) {
                    return Err(err(format!("{}.views.list.search: '{s}' precisa ser campo de texto", entity.name)));
                }
            }
        }

        let children = children::parse(&entities).map_err(err)?;
        lookup::check_spec(&entities).map_err(err)?;
        let row_access = entities
            .values()
            .map(|e| Ok((e.name.clone(), row_access::parse_rows(e)?)))
            .collect::<Result<HashMap<_, _>, String>>()
            .map_err(err)?;
        boot::check_hooks(&entities, &children, &*self.hooks, self.read_only).map_err(err)?;
        boot::check_database(&*self.store, &entities, self.read_only).await.map_err(err)?;
        Ok(Engine(Arc::new(Inner {
            app,
            entities,
            children,
            row_access,
            store: self.store,
            hooks: self.hooks,
            live: self.live,
            notifications: self.notifications,
            bell: self.bell,
        })))
    }
}
