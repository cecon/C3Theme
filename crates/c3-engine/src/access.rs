//! Permissão por linha, seção e campo (spec/README.md, "Permissão por linha, seção e campo"). O JSON declara
//! códigos opacos do sistema (`access` em campo e seção, `rowAccess` na entidade) e o sistema só responde se o
//! usuário tem cada código (`Hooks::permitted`, na filial ativa). O motor aplica:
//! - campo sem `view`: some da leitura, da lista, da busca, do filtro e da ordem; sem `edit`: só leitura;
//! - mudar campo (ou lista `with_parent`) sem permissão é 422 `forbidden`.
//!
//! `rowAccess` (as linhas que cada código enxerga) fica em `row_access.rs`.

use std::borrow::Cow;
use std::collections::HashSet;

use serde_json::{Map, Value};

use crate::error::{ApiError, FieldErrors};
use crate::org::Ctx;
use crate::spec::Entity;

/// Códigos exigidos para ver e para alterar. Vazio = livre. Seção e campo se somam (os dois valem).
#[derive(Debug, Clone, Default)]
pub struct Access {
    pub view: Vec<String>,
    pub edit: Vec<String>,
}

impl Access {
    pub(crate) fn parse(v: Option<&Value>) -> Access {
        let code = |k: &str| v.and_then(|v| v.get(k)).and_then(Value::as_str).map(str::to_owned);
        Access {
            view: code("view").into_iter().collect(),
            edit: code("edit").into_iter().collect(),
        }
    }

    pub(crate) fn is_free(&self) -> bool {
        self.view.is_empty() && self.edit.is_empty()
    }

    pub(crate) fn add(&mut self, other: &Access) {
        self.view.extend(other.view.iter().cloned());
        self.edit.extend(other.edit.iter().cloned());
    }
}

/// O que o usuário não vê e o que não altera, entre os campos e as listas `with_parent` da entidade.
#[derive(Debug, Default)]
pub(crate) struct Denied {
    pub hidden: HashSet<String>,
    pub read_only: HashSet<String>,
}

pub(crate) fn denied(ctx: &Ctx<'_>, entity: &Entity) -> Denied {
    let mut out = Denied::default();
    let children = ctx.engine.0.children.of(&entity.name);
    let items = entity.fields.iter().map(|f| (&f.name, &f.access));
    for (name, access) in items.chain(children.iter().map(|c| (&c.key, &c.access))) {
        if !access.view.iter().all(|c| ctx.permitted(c)) {
            out.hidden.insert(name.clone());
        } else if !access.edit.iter().all(|c| ctx.permitted(c)) {
            out.read_only.insert(name.clone());
        }
    }
    out
}

/// `capabilities.fields` de `/_meta`: `{ "custo": "hidden", "markup": "readOnly" }`.
pub(crate) fn meta(ctx: &Ctx<'_>, entity: &Entity) -> Value {
    let d = denied(ctx, entity);
    let mut m = Map::new();
    for n in &d.hidden {
        m.insert(n.clone(), "hidden".into());
    }
    for n in &d.read_only {
        m.insert(n.clone(), "readOnly".into());
    }
    Value::Object(m)
}

/// A entidade como o usuário a enxerga: sem os campos que ele não vê (a lista nem seleciona, filtra, busca ou
/// ordena por eles; citar um é "campo inexistente", como se não existisse).
pub(crate) fn view<'e>(ctx: &Ctx<'_>, entity: &'e Entity) -> Cow<'e, Entity> {
    let hidden = denied(ctx, entity).hidden;
    if !entity.fields.iter().any(|f| hidden.contains(&f.name)) {
        return Cow::Borrowed(entity);
    }
    let mut e = entity.clone();
    e.fields.retain(|f| !hidden.contains(&f.name));
    e.search.retain(|f| !hidden.contains(f));
    Cow::Owned(e)
}

/// Tira do registro lido o que o usuário não vê.
pub(crate) fn strip(ctx: &Ctx<'_>, entity: &Entity, record: &mut Map<String, Value>) {
    if entity.fields.iter().all(|f| f.access.view.is_empty())
        && ctx.engine.0.children.of(&entity.name).iter().all(|c| c.access.view.is_empty())
    {
        return;
    }
    for name in denied(ctx, entity).hidden {
        record.remove(&name);
    }
}

/// Gravação: o corpo não muda campo que o usuário não pode alterar (em relação ao gravado, ou ao padrão na
/// criação). Mandar o mesmo valor passa (a shell manda o formulário inteiro). Erro `forbidden` no campo.
pub(crate) fn check_write(
    ctx: &Ctx<'_>,
    entity: &Entity,
    before: Option<&Map<String, Value>>,
    patch: &Map<String, Value>,
) -> Result<(), ApiError> {
    let d = denied(ctx, entity);
    let mut errors = FieldErrors::default();
    for (name, sent) in patch.iter().filter(|(n, _)| d.hidden.contains(*n) || d.read_only.contains(*n)) {
        let Some(f) = entity.field(name) else { continue };
        let base = match before {
            Some(b) => b.get(name),
            None => f.default.as_ref(),
        };
        if !crate::locked::same(f, sent, base) {
            errors.add(name, "forbidden", FORBIDDEN);
        }
    }
    if errors.is_empty() {
        Ok(())
    } else {
        Err(ApiError::validation(errors))
    }
}

const FORBIDDEN: &str = "Você não tem permissão para alterar este campo.";

/// 422 `forbidden` num campo (ou lista `with_parent`) que o usuário não pode alterar.
pub(crate) fn forbidden(name: &str) -> ApiError {
    let mut errors = FieldErrors::default();
    errors.add(name, "forbidden", FORBIDDEN);
    ApiError::validation(errors)
}
