//! Filhos gravados junto com o pai: seção `related` com `"save": "with_parent"` (spec/README.md, "Filhos gravados junto com o pai").
//!
//! A filha continua sendo uma entidade (campos, validação, tabela própria), mas só se grava pelo pai: a lista
//! vem no corpo do POST/PATCH dele, é validada linha a linha e entra na mesma transação (ou no `write` do
//! sistema, com escrita delegada). Na leitura de um registro, a lista vem inteira junto.

use std::collections::HashMap;

use serde_json::{Map, Value};

use crate::access::Access;
use crate::condition::Condition;
use crate::crud::{fetch_rows, Owner};
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::{Entity, FieldType};
use crate::store::Conn;
use crate::value::SqlValue;

/// Padrão e teto de linhas por pai: acima disso, a seção `related` comum (paginada, CRUD próprio).
pub const DEFAULT_MAX: usize = 200;
pub const MAX_ITEMS: usize = 500;

/// Uma seção `with_parent` de um pai.
#[derive(Debug, Clone)]
pub(crate) struct Child {
    /// Nome da entidade filha: chave da lista no corpo e na leitura do pai.
    pub key: String,
    /// A filha com a coluna do pai como `readOnly`: o motor preenche, o cliente nunca manda.
    pub entity: Entity,
    pub fk: String,
    pub min: usize,
    pub max: usize,
    /// ORDER BY da lista (alias `t`), sempre terminando no id.
    pub order: String,
    /// Lista de marcar (`display: checklist`): campo reference da filha com a opção marcada; não repete.
    pub option: Option<String>,
    /// `visibleWhen` da seção, sobre o registro do pai: escondida, a lista vale vazia.
    pub visible_when: Option<Condition>,
    /// `access` da seção: sem `view` a lista some da leitura; sem `edit`, não vem no corpo (ver `access.rs`).
    pub access: Access,
}

/// Filhos por pai e o pai de cada filha.
#[derive(Debug, Default)]
pub(crate) struct Children {
    by_parent: HashMap<String, Vec<Child>>,
    parent_of: HashMap<String, String>,
}

impl Children {
    pub fn of(&self, parent: &str) -> &[Child] {
        self.by_parent.get(parent).map(Vec::as_slice).unwrap_or_default()
    }

    /// Filha que só se grava pelo pai: o CRUD direto dela responde 403 e `capabilities` não oferece escrita.
    pub fn parent_of(&self, entity: &str) -> Option<&str> {
        self.parent_of.get(entity).map(String::as_str)
    }
}

pub(crate) fn parse(entities: &HashMap<String, Entity>) -> Result<Children, String> {
    let mut out = Children::default();
    let mut names: Vec<_> = entities.keys().collect();
    names.sort();
    for name in names {
        let parent = &entities[name];
        let sections = parent.raw.pointer("/views/form/sections").and_then(Value::as_array);
        for section in sections.into_iter().flatten() {
            let Some(related) = section.get("related") else { continue };
            if related.get("save").and_then(Value::as_str) != Some("with_parent") {
                check_separately(name, related)?;
                continue;
            }
            let mut child = parse_one(parent, related, entities)?;
            child.access = Access::parse(section.get("access"));
            if let Some(v) = section.get("visibleWhen") {
                let c = Condition::parse(v, parent).map_err(|e| format!("{name}: related '{}' visibleWhen: {e}", child.key))?;
                child.visible_when = Some(c);
            }
            if let Some(other) = out.parent_of.insert(child.key.clone(), name.clone()) {
                return Err(format!("{}: já é gravada junto com '{other}'; uma filha tem um pai só", child.key));
            }
            out.by_parent.entry(name.clone()).or_default().push(child);
        }
    }
    Ok(out)
}

/// Chaves que só existem em `with_parent`: numa seção `separately` o motor não teria como cumpri-las (cada filho
/// grava sozinho), e ignorar em silêncio deixa a 2ª linha passar num `maxItems: 1`.
fn check_separately(parent: &str, related: &Value) -> Result<(), String> {
    // `display` só vale o padrão (`table`): qualquer outro é de with_parent
    let display = related.get("display").is_some_and(|d| d.as_str() != Some("table"));
    let only = ["minItems", "maxItems", "option", "groupBy"];
    match only.iter().find(|k| related.get(**k).is_some()).or(display.then_some(&"display")) {
        Some(k) => Err(format!(
            "{parent}: related '{}': '{k}' só vale com save 'with_parent'",
            related.get("entity").and_then(Value::as_str).unwrap_or_default()
        )),
        None => Ok(()),
    }
}

fn parse_one(parent: &Entity, related: &Value, entities: &HashMap<String, Entity>) -> Result<Child, String> {
    let get = |k: &str| related.get(k).and_then(Value::as_str).unwrap_or_default();
    let (key, fk) = (get("entity"), get("field"));
    let label = format!("{}: related '{key}'", parent.name);
    let mut entity = entities
        .get(key)
        .cloned()
        .ok_or_else(|| format!("{label}: entidade desconhecida"))?;
    if entity.fields.iter().any(|f| !f.access.is_free()) || entity.raw.get("rowAccess").is_some() {
        return Err(format!(
            "{label}: filha with_parent ainda não aceita access nos campos nem rowAccess"
        ));
    }
    if entity.scope != parent.scope {
        return Err(format!("{label}: a filha precisa ter o mesmo scope do pai"));
    }
    let f = entity
        .fields
        .iter_mut()
        .find(|f| f.name == fk)
        .filter(|f| f.ty == FieldType::Reference && f.reference.as_deref() == Some(parent.name.as_str()))
        .ok_or_else(|| format!("{label}: '{fk}' precisa ser reference para '{}'", parent.name))?;
    f.read_only = true;
    let num = |k: &str, default: usize| related.get(k).and_then(Value::as_u64).map_or(default, |n| n as usize);
    let (min, max) = (num("minItems", 0), num("maxItems", DEFAULT_MAX));
    if max > MAX_ITEMS || min > max {
        return Err(format!("{label}: minItems/maxItems fora da faixa (0 <= min <= max <= {MAX_ITEMS})"));
    }
    let mut order = Vec::new();
    for part in get("sort").split(',').filter(|p| !p.is_empty()) {
        let (desc, name) = part.strip_prefix('-').map_or((false, part), |n| (true, n));
        if entity.field(name).is_none() {
            return Err(format!("{label}: sort cita campo inexistente '{name}'"));
        }
        order.push(format!("t.\"{name}\" IS NULL, t.\"{name}\" {}", if desc { "DESC" } else { "ASC" }));
    }
    order.push("t.\"id\" ASC".into());
    let option = parse_option(&label, &entity, fk, related, entities)?;
    Ok(Child {
        key: key.to_owned(),
        entity,
        fk: fk.to_owned(),
        min,
        max,
        order: order.join(", "),
        option,
        visible_when: None,
        access: Access::default(),
    })
}

/// `display: checklist`: `option` é um reference da filha (fora a coluna do pai) e `groupBy`, se houver, é campo
/// da entidade das opções. Fora do checklist, as duas chaves não valem.
fn parse_option(
    label: &str,
    entity: &Entity,
    fk: &str,
    related: &Value,
    entities: &HashMap<String, Entity>,
) -> Result<Option<String>, String> {
    let get = |k: &str| related.get(k).and_then(Value::as_str);
    if get("display") != Some("checklist") {
        if get("option").is_some() || get("groupBy").is_some() {
            return Err(format!("{label}: option/groupBy só valem com display 'checklist'"));
        }
        return Ok(None);
    }
    let opt = get("option").unwrap_or_default();
    let target = entity
        .field(opt)
        .filter(|f| opt != fk && f.ty == FieldType::Reference)
        .and_then(|f| f.reference.as_deref())
        .ok_or_else(|| format!("{label}: checklist precisa de 'option', um reference da filha que não seja '{fk}'"))?;
    if let Some(group) = get("groupBy") {
        if !entities.get(target).is_some_and(|t| t.field(group).is_some()) {
            return Err(format!("{label}: groupBy '{group}' não é campo de '{target}'"));
        }
    }
    Ok(Some(opt.to_owned()))
}

/// Linhas filhas de um pai, no formato trafegado e na ordem da seção.
pub(crate) async fn rows(conn: &mut dyn Conn, ctx: &Ctx<'_>, child: &Child, parent_id: i64) -> Result<Vec<Map<String, Value>>, ApiError> {
    let filter = format!("t.\"{}\" = ? ORDER BY {}", child.fk, child.order);
    fetch_rows(conn, ctx, &child.entity, &filter, &[SqlValue::Int(parent_id)]).await
}

/// Põe no registro lido do pai a lista de cada seção `with_parent`.
pub(crate) async fn attach(conn: &mut dyn Conn, ctx: &Ctx<'_>, parent: &Entity, record: &mut Map<String, Value>) -> Result<(), ApiError> {
    let Some(id) = record.get("id").and_then(Value::as_str).and_then(|s| s.parse().ok()) else {
        return Ok(());
    };
    for child in ctx.engine.0.children.of(&parent.name) {
        let list = rows(conn, ctx, child, id).await?;
        record.insert(child.key.clone(), Value::Array(list.into_iter().map(Value::Object).collect()));
    }
    Ok(())
}

/// CRUD direto numa filha `with_parent` contornaria o escritor e a transação do pai.
pub(crate) fn guard_direct_write(ctx: &Ctx<'_>, entity: &str) -> Result<(), ApiError> {
    match ctx.engine.0.children.parent_of(entity) {
        Some(_) => Err(ApiError::forbidden()),
        None => Ok(()),
    }
}

/// Listas enviadas no corpo do pai, por seção (índice em `Children::of`).
pub(crate) type Sent = Vec<(usize, Vec<Map<String, Value>>)>;

/// Tira do corpo do pai as listas `with_parent`. Ausente na criação é lista vazia (vale o `minItems`);
/// ausente na alteração, os filhos não mudam.
pub(crate) fn take(ctx: &Ctx<'_>, parent: &Entity, body: &mut Map<String, Value>, creating: bool) -> Result<Sent, ApiError> {
    let mut out = Vec::new();
    let denied = crate::access::denied(ctx, parent);
    for (i, child) in ctx.engine.0.children.of(&parent.name).iter().enumerate() {
        let v = match body.remove(&child.key) {
            Some(_) if denied.hidden.contains(&child.key) || denied.read_only.contains(&child.key) => {
                return Err(crate::access::forbidden(&child.key))
            }
            Some(v) => v,
            None if creating => Value::Array(Vec::new()),
            None => continue,
        };
        let bad = || ApiError::bad_request(format!("'{}' precisa ser uma lista de objetos.", child.key));
        let Value::Array(items) = v else { return Err(bad()) };
        let rows = items
            .into_iter()
            .map(|r| match r {
                Value::Object(o) => Ok(o),
                _ => Err(bad()),
            })
            .collect::<Result<Vec<_>, _>>()?;
        out.push((i, rows));
    }
    Ok(out)
}

/// Dono das linhas filhas: sempre o do pai.
pub(crate) fn owner_cols(owner: Owner) -> Vec<(&'static str, i64)> {
    use crate::spec::{BRANCH_COL, COMPANY_COL};
    [(COMPANY_COL, owner.company), (BRANCH_COL, owner.branch)]
        .into_iter()
        .filter_map(|(c, id)| id.map(|id| (c, id)))
        .collect()
}
