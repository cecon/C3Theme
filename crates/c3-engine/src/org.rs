//! Escopo por empresa e filial (spec: `app.organization` + `entity.scope`).
//!
//! O grupo econômico é o banco inteiro; dentro dele, cada linha de entidade com escopo carrega
//! `org_company_id` (e `org_branch_id`, se for de filial). O motor resolve por requisição quais
//! filiais o usuário enxerga e aplica isso em todo SQL que gera: lista e contagem, leitura,
//! alteração e exclusão por id, título e existência de `reference`.

use std::collections::{HashMap, HashSet};

use axum::http::request::Parts;

use crate::error::ApiError;
use crate::spec::{App, Entity, Scope, BRANCH_COL, COMPANY_COL};
use crate::store::{self, Conn, RowExt, SqlValue};
use crate::{Capabilities, Engine, RequestContext};

pub const BRANCH_HEADER: &str = "c3-branch";

/// Filial permitida ao usuário, com a empresa dona dela.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Branch {
    pub id: i64,
    pub company: i64,
}

/// Contexto de escopo de uma requisição.
pub struct Org {
    /// Filiais que o usuário enxerga, em ordem de id.
    pub allowed: Vec<Branch>,
    /// `C3-Branch`, já conferido contra `allowed`.
    pub active: Option<Branch>,
    pub default: Option<i64>,
}

/// Contexto completo da requisição: quem pede, de onde, e o que pode.
pub struct Ctx<'a> {
    pub engine: &'a Engine,
    pub req: &'a Parts,
    /// `None` quando o app não declara `organization`.
    pub org: Option<Org>,
    caps: std::sync::Mutex<HashMap<(String, Option<i64>), Capabilities>>,
    permits: std::sync::Mutex<HashMap<String, bool>>,
}

impl<'a> Ctx<'a> {
    pub async fn new(engine: &'a Engine, req: &'a Parts) -> Result<Ctx<'a>, ApiError> {
        let org = match &engine.0.app.organization {
            None => None,
            Some(o) => Some(resolve(engine, &o.branch, req).await?),
        };
        Ok(Ctx {
            engine,
            req,
            org,
            caps: Default::default(),
            permits: Default::default(),
        })
    }

    pub fn active(&self) -> Option<Branch> {
        self.org.as_ref().and_then(|o| o.active)
    }

    pub fn allowed(&self) -> &[Branch] {
        self.org.as_ref().map_or(&[], |o| &o.allowed)
    }

    /// Capabilities do usuário na entidade, numa filial (ou sem filial). Memorizado por requisição.
    pub fn caps(&self, entity: &str, branch: Option<i64>) -> Capabilities {
        let key = (entity.to_owned(), branch);
        if let Some(c) = self.caps.lock().unwrap().get(&key) {
            return *c;
        }
        let b = branch.map(|b| b.to_string());
        let c = self.engine.0.hooks.capabilities(entity, b.as_deref(), self.req);
        self.caps.lock().unwrap().insert(key, c);
        c
    }

    /// O usuário tem o código de permissão (`Hooks::permitted`, na filial ativa)? Memorizado por requisição.
    pub fn permitted(&self, code: &str) -> bool {
        if let Some(p) = self.permits.lock().unwrap().get(code) {
            return *p;
        }
        let b = self.active().map(|b| b.id.to_string());
        let p = self.engine.0.hooks.permitted(code, b.as_deref(), self.req);
        self.permits.lock().unwrap().insert(code.to_owned(), p);
        p
    }

    /// Filiais permitidas em que o usuário tem a capability escolhida nesta entidade.
    pub fn branches_with(&self, entity: &str, pick: impl Fn(&Capabilities) -> bool) -> Vec<Branch> {
        self.allowed()
            .iter()
            .copied()
            .filter(|b| pick(&self.caps(entity, Some(b.id))))
            .collect()
    }

    /// Escopo de leitura de uma entidade, como SQL sobre `alias`: filiais com `read` e `rowAccess` (None = nenhum).
    pub fn read_scope(&self, entity: &Entity, alias: &str) -> Option<String> {
        let branches =
            (entity.scope != Scope::Group).then(|| scope_sql(entity.scope, &self.branches_with(&entity.name, |c| c.read), alias));
        match (branches, crate::row_access::row_filter(self, entity, alias)) {
            (Some(b), Some(r)) => Some(format!("{b} AND {r}")),
            (b, r) => b.or(r),
        }
    }

    pub fn request_context(&self) -> RequestContext<'_> {
        let active = self.active();
        RequestContext {
            req: self.req,
            active_branch: active.map(|b| b.id.to_string()),
            active_company: active.map(|b| b.company.to_string()),
        }
    }
}

/// `alias.org_branch_id IN (...)` ou `alias.org_company_id IN (...)`. Ids são inteiros já validados,
/// por isso vão literais: o mesmo trecho entra em subconsultas sem mexer na ordem dos parâmetros.
pub fn scope_sql(scope: Scope, branches: &[Branch], alias: &str) -> String {
    let ids: Vec<i64> = match scope {
        Scope::Group => return "1".into(),
        Scope::Branch => branches.iter().map(|b| b.id).collect(),
        Scope::Company => {
            let set: HashSet<i64> = branches.iter().map(|b| b.company).collect();
            let mut v: Vec<_> = set.into_iter().collect();
            v.sort();
            v
        }
    };
    if ids.is_empty() {
        return "0".into();
    }
    let col = if scope == Scope::Branch { BRANCH_COL } else { COMPANY_COL };
    let list = ids.iter().map(i64::to_string).collect::<Vec<_>>().join(", ");
    format!("{alias}.\"{col}\" IN ({list})")
}

async fn resolve(engine: &Engine, branch_entity: &str, req: &Parts) -> Result<Org, ApiError> {
    let access = engine.0.hooks.org_access(req);
    let sql = format!("SELECT \"id\", \"{COMPANY_COL}\" FROM \"{branch_entity}\" ORDER BY \"id\"");
    let mut rows = Vec::new();
    for r in engine.0.store.conn().await?.query(&sql, &[]).await? {
        rows.push((r.int(0)?.unwrap_or_default(), r.int(1)?.unwrap_or_default()));
    }
    let wanted: Option<HashSet<i64>> = access.branches.map(|ids| ids.iter().filter_map(|s| s.parse().ok()).collect());
    let allowed: Vec<Branch> = rows
        .into_iter()
        .map(|(id, company)| Branch { id, company })
        .filter(|b| wanted.as_ref().is_none_or(|w| w.contains(&b.id)))
        .collect();

    let active = match req.headers.get(BRANCH_HEADER) {
        None => None,
        Some(v) => {
            let id: i64 = v
                .to_str()
                .ok()
                .and_then(|s| s.trim().parse().ok())
                .ok_or_else(|| ApiError::bad_request("Cabeçalho C3-Branch inválido."))?;
            Some(*allowed.iter().find(|b| b.id == id).ok_or_else(ApiError::forbidden)?)
        }
    };
    let default = access
        .default_branch
        .and_then(|s| s.parse().ok())
        .filter(|id| allowed.iter().any(|b| b.id == *id));
    Ok(Org { allowed, active, default })
}

/// Regras da spec que o JSON Schema não expressa.
pub fn check_spec(app: &App, entities: &HashMap<String, Entity>) -> Result<(), String> {
    match &app.organization {
        None => {
            if let Some(e) = entities.values().find(|e| e.scope != Scope::Group) {
                return Err(format!("{} tem scope, mas o app.json não declara organization", e.name));
            }
        }
        Some(o) => {
            for (role, name, scope) in [("company", &o.company, Scope::Group), ("branch", &o.branch, Scope::Company)] {
                let e = entities
                    .get(name)
                    .ok_or_else(|| format!("organization.{role} cita '{name}', que não está em app.entities"))?;
                if e.scope != scope {
                    return Err(format!("{name} (organization.{role}) precisa de scope '{scope:?}'").to_lowercase());
                }
            }
        }
    }
    Ok(())
}

/// Em entidade com escopo, `unique` vale dentro do escopo: precisa de índice único exatamente em
/// (coluna do escopo, campo). Sem isso o banco aceitaria duplicado entre filiais, ou recusaria o que
/// deveria aceitar.
pub async fn check_unique_indexes(conn: &mut dyn Conn, entity: &Entity) -> Result<Vec<String>, String> {
    let col = match entity.scope {
        Scope::Group => return Ok(vec![]),
        Scope::Company => COMPANY_COL,
        Scope::Branch => BRANCH_COL,
    };
    let name = [SqlValue::Text(entity.name.clone())];
    let indexes = store::column_texts(conn, "SELECT name FROM pragma_index_list(?) WHERE \"unique\" = 1", &name)
        .await
        .map_err(|e| e.to_string())?;
    let mut sets = Vec::new();
    for idx in indexes {
        let mut cols = store::column_texts(conn, "SELECT name FROM pragma_index_info(?)", &[SqlValue::Text(idx)])
            .await
            .map_err(|e| e.to_string())?;
        cols.sort();
        sets.push(cols);
    }
    let mut problems = Vec::new();
    for f in entity.fields.iter().filter(|f| f.unique) {
        let mut want = vec![col.to_owned(), f.name.clone()];
        want.sort();
        if !sets.contains(&want) {
            problems.push(format!(
                "'{}.{}' é unique com scope: falta UNIQUE ({col}, {})",
                entity.name, f.name, f.name
            ));
        }
    }
    Ok(problems)
}
