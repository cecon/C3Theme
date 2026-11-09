//! Metadados (`/_meta/...`): o app, o login (público), uma entidade com as capabilities do usuário e o contexto de filiais.

use axum::http::request::Parts;
use serde_json::{json, Map, Value};

use crate::access;
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::COMPANY_COL;
use crate::store::RowExt;
use crate::Engine;

type Result<T> = std::result::Result<T, ApiError>;

/// `{ data, pages }`: o app.json e, para cada página com `permission`, se o usuário pode abri-la (na filial ativa).
/// A shell esconde do menu e bloqueia a rota; o que a página chama no backend continua conferido pelo sistema.
pub(crate) async fn app(engine: &Engine, req: &Parts) -> Result<Value> {
    let raw = &engine.0.app.raw;
    let guarded: Vec<(&str, &str)> = raw["pages"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|p| Some((p["path"].as_str()?, p["permission"].as_str()?)))
        .collect();
    let mut pages = Map::new();
    if !guarded.is_empty() {
        // filial do cabeçalho que não vale mais (guardada de outra sessão) não derruba a carga do app: responde sem
        // filial, e a shell pergunta de novo depois de escolher uma
        let ctx = Ctx::new(engine, req).await.ok();
        for (path, code) in guarded {
            let ok = match &ctx {
                Some(ctx) => ctx.permitted(code),
                None => engine.0.hooks.permitted(code, None, req),
            };
            pages.insert(path.to_owned(), Value::Bool(ok));
        }
    }
    Ok(json!({ "data": raw, "pages": pages }))
}

/// O que a tela de login precisa antes de haver usuário: o nome do sistema e `auth`. Rota pública.
pub(crate) fn login(engine: &Engine) -> Value {
    let raw = &engine.0.app.raw;
    json!({ "name": raw["name"], "auth": raw.get("auth").cloned().unwrap_or(Value::Null) })
}

/// `{ data, capabilities }`: o JSON da entidade e o que o usuário pode fazer nela.
pub(crate) async fn entity(engine: &Engine, req: &Parts, name: &str) -> Result<Value> {
    let entity = engine.entity(name)?;
    let ctx = Ctx::new(engine, req).await?;
    let mut caps = ctx.active_caps(name);
    if engine.0.children.parent_of(name).is_some() {
        // filha `with_parent`: só se grava pelo formulário do pai
        (caps.create, caps.update, caps.delete) = (false, false, false);
    }
    if entity.singleton {
        caps.delete = false;
    }
    if entity.source.is_some() {
        (caps.create, caps.update, caps.delete) = (false, false, false);
    }
    let mut capabilities = serde_json::to_value(caps).map_err(|_| ApiError::internal())?;
    // ação exige read: quem não vê o registro não age sobre ele
    let active = ctx.active().map(|b| b.id.to_string());
    let actions: Map<String, Value> = entity
        .actions
        .iter()
        .map(|a| {
            let ok = caps.read && engine.0.hooks.action_allowed(name, &a.name, active.as_deref(), req);
            (a.name.clone(), Value::Bool(ok))
        })
        .collect();
    capabilities["actions"] = Value::Object(actions);
    capabilities["fields"] = access::meta(&ctx, entity);
    let mut out = json!({ "data": entity.raw, "capabilities": capabilities });
    if let Some(src) = &entity.source {
        // valores iniciais da faixa de parâmetros, com as datas relativas resolvidas pelo relógio do sistema
        out["paramDefaults"] = Value::Object(crate::crud::source::defaults(src, &engine.0.hooks.clock(req))?);
    }
    Ok(out)
}

/// Empresas e filiais que o usuário enxerga, a ativa e a sugerida.
pub(crate) async fn context(engine: &Engine, req: &Parts) -> Result<Value> {
    let ctx = Ctx::new(engine, req).await?;
    let (Some(org), Some(o)) = (&ctx.org, &engine.0.app.organization) else {
        return Ok(json!({
            "organization": null, "companies": [], "branches": [], "activeBranch": null, "defaultBranch": null
        }));
    };
    let title = |e: &str| engine.0.entities[e].title_field().map(|f| f.name.clone()).unwrap_or_default();
    let ids = org.allowed.iter().map(|b| b.id.to_string()).collect::<Vec<_>>().join(", ");
    let sql = format!(
        "SELECT b.\"id\", b.\"{bt}\", c.\"id\", c.\"{ct}\" FROM \"{branch}\" b JOIN \"{company}\" c ON c.\"id\" = b.\"{COMPANY_COL}\" \
         WHERE b.\"id\" IN ({ids}) ORDER BY c.\"{ct}\", c.\"id\", b.\"{bt}\", b.\"id\"",
        bt = title(&o.branch),
        ct = title(&o.company),
        branch = o.branch,
        company = o.company,
        ids = if ids.is_empty() { "NULL".into() } else { ids },
    );
    let rows = engine.0.store.conn().await?.query(&sql, &[]).await?;
    let (mut seen, mut companies, mut branches) = (Vec::new(), Vec::new(), Vec::new());
    for r in rows {
        let (bid, btitle, cid, ctitle) = (r.int(0)?.unwrap_or_default(), r.text(1)?, r.int(2)?.unwrap_or_default(), r.text(3)?);
        if !seen.contains(&cid) {
            seen.push(cid);
            companies.push(json!({ "id": cid.to_string(), "title": ctitle }));
        }
        branches.push(json!({ "id": bid.to_string(), "title": btitle, "company": cid.to_string() }));
    }
    Ok(json!({
        "organization": { "company": o.company, "branch": o.branch },
        "companies": companies,
        "branches": branches,
        "activeBranch": org.active.map(|b| b.id.to_string()),
        "defaultBranch": org.default.map(|b| b.to_string()),
    }))
}
