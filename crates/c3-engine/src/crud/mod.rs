//! CRUD genérico do contrato (spec/v0/openapi.yaml): ler, listar, criar, alterar e excluir.
//!
//! Só regra de negócio: o HTTP (rotas, corpo, status) fica no adaptador `crate::http`.

mod aggregate;
mod delete;
mod filter;
mod list;
mod read;
mod singleton;
pub(crate) mod source;
mod write;

use axum::http::request::Parts;
use serde_json::{json, Map, Value};

use crate::error::ApiError;
use crate::org::{Branch, Ctx};
use crate::spec::{Entity, Field, Scope};
use crate::{access, children, value, version};
use crate::{Capabilities, Change, Engine};

pub(crate) use aggregate::aggregate;
pub(crate) use list::list;
pub(crate) use read::{fetch_one, fetch_rows, read};

type Result<T> = std::result::Result<T, ApiError>;

// As três gravações avisam o tempo real (`live`) depois do commit.

pub(crate) async fn create(engine: &Engine, req: &Parts, name: &str, body: Option<Value>) -> Result<Map<String, Value>> {
    let created = write::create(engine, req, name, body).await?;
    engine.emit(name, wire_id(&created).as_deref(), Change::Created);
    Ok(created)
}

pub(crate) async fn update(engine: &Engine, req: &Parts, name: &str, id: &str, body: Option<Value>) -> Result<Map<String, Value>> {
    let updated = write::update(engine, req, name, id, body).await?;
    engine.emit(name, Some(id), Change::Updated);
    Ok(updated)
}

pub(crate) async fn delete(engine: &Engine, req: &Parts, name: &str, id: &str) -> Result<()> {
    delete::delete(engine, req, name, id).await?;
    engine.emit(name, Some(id), Change::Deleted);
    Ok(())
}

fn wire_id(record: &Map<String, Value>) -> Option<String> {
    match record.get("id")? {
        Value::String(s) => Some(s.clone()),
        v => Some(v.to_string()),
    }
}

impl Engine {
    pub(crate) fn entity(&self, name: &str) -> Result<&Entity> {
        self.0
            .entities
            .get(name)
            .ok_or_else(|| ApiError::not_found(format!("Entidade '{name}' não existe.")))
    }
}

impl Ctx<'_> {
    /// Capability na filial ativa (ou sem filial): metadados, entidade sem escopo.
    pub(crate) fn active_caps(&self, entity: &str) -> Capabilities {
        self.caps(entity, self.active().map(|b| b.id))
    }

    fn allow_active(&self, entity: &str, pick: impl Fn(&Capabilities) -> bool) -> Result<()> {
        if pick(&self.active_caps(entity)) {
            Ok(())
        } else {
            Err(ApiError::forbidden())
        }
    }

    /// Pode alterar/excluir um registro existente? Em `branch`, decide a filial dona do registro;
    /// em `company`, uma filial da mesma empresa (a ativa, se veio) com a capability.
    pub(crate) fn can_write(&self, entity: &Entity, owner: Owner, pick: impl Fn(&Capabilities) -> bool) -> bool {
        match entity.scope {
            Scope::Group => pick(&self.active_caps(&entity.name)),
            Scope::Branch => owner
                .branch
                .is_some_and(|b| self.allowed().iter().any(|a| a.id == b) && pick(&self.caps(&entity.name, Some(b)))),
            Scope::Company => {
                let candidates: Vec<Branch> = match self.active() {
                    Some(a) => vec![a],
                    None => self.allowed().to_vec(),
                };
                candidates
                    .iter()
                    .any(|b| Some(b.company) == owner.company && pick(&self.caps(&entity.name, Some(b.id))))
            }
        }
    }

    /// `_can` de uma linha: a lista pode misturar filiais com permissões diferentes.
    /// Tira também o que o usuário não vê (`access`) e põe a `_version`: toda resposta com registro passa por aqui.
    pub(crate) fn attach_can(&self, entity: &Entity, record: &mut Map<String, Value>) {
        access::strip(self, entity, record);
        record.insert(version::KEY.into(), Value::String(version::of_visible(entity, record)));
        if entity.scope == Scope::Group {
            return;
        }
        let owner = Owner::of(record);
        let update = self.can_write(entity, owner, |c| c.update);
        let table = entity.source.is_none();
        let update = table && update;
        let delete = table && !entity.singleton && self.can_write(entity, owner, |c| c.delete);
        record.insert("_can".into(), json!({ "update": update, "delete": delete }));
    }
}

/// Empresa e filial donas de um registro.
#[derive(Debug, Clone, Copy, Default)]
pub(crate) struct Owner {
    pub company: Option<i64>,
    pub branch: Option<i64>,
}

impl Owner {
    pub(crate) fn of(record: &Map<String, Value>) -> Owner {
        let id = |k: &str| record.get(k)?.get("id")?.as_str()?.parse().ok();
        Owner {
            company: id("_company"),
            branch: id("_branch"),
        }
    }

    pub(crate) fn of_new(entity: &Entity, active: Branch) -> Owner {
        Owner {
            company: (entity.scope != Scope::Group).then_some(active.company),
            branch: (entity.scope == Scope::Branch).then_some(active.id),
        }
    }
}

/// Ler exige a capability em alguma filial (ou na ativa, sem escopo).
pub(crate) fn allow_read(ctx: &Ctx, entity: &Entity, pick: impl Fn(&Capabilities) -> bool + Copy) -> Result<()> {
    if entity.scope == Scope::Group {
        return ctx.allow_active(&entity.name, pick);
    }
    if ctx.branches_with(&entity.name, pick).is_empty() {
        return Err(ApiError::forbidden());
    }
    Ok(())
}

pub(crate) fn parse_path_id(raw: &str) -> Result<i64> {
    value::parse_id(raw).ok_or_else(|| ApiError::not_found("Registro não encontrado."))
}

pub(crate) fn writable(entity: &Entity) -> impl Iterator<Item = &Field> {
    entity.fields.iter().filter(|f| !f.read_only)
}

pub(crate) use children::Sent as Kids;
