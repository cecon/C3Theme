//! Documentos da spec v0 (app.json e entidades) carregados em memória.
//!
//! O JSON original é guardado como veio para ser servido em `/_meta`; os campos tipados
//! aqui são só o que o backend precisa para validar, gravar e consultar.

use serde::Deserialize;
use serde_json::Value;

use crate::condition::Condition;
pub use crate::field::Field;
use crate::field::{parse_fields, RawField};
pub use crate::spec_action::Action;
use crate::spec_action::{check_inverses, parse_action, RawAction};
pub use crate::spec_source::Source;
use crate::spec_source::{parse_source, RawParams};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FieldType {
    String,
    Text,
    Email,
    Integer,
    Decimal,
    Boolean,
    Date,
    Datetime,
    Enum,
    /// Conjunto de opções marcadas, gravado como inteiro: cada opção é um bit (dias da semana 1–127).
    Flags,
    Reference,
    /// Arquivo em base64 (`{ name, contentType, data }`); na entidade, a coluna guarda os metadados e grava o sistema.
    File,
}

impl FieldType {
    pub fn is_textual(self) -> bool {
        matches!(self, FieldType::String | FieldType::Text | FieldType::Email)
    }
}

/// Dono dos registros (spec: `scope`). Só vale quando o app declara `organization`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Scope {
    #[default]
    Group,
    Company,
    Branch,
}

/// Colunas reservadas do escopo: o backend preenche na criação e nunca muda.
pub const COMPANY_COL: &str = "org_company_id";
pub const BRANCH_COL: &str = "org_branch_id";

#[derive(Debug, Clone)]
pub struct Entity {
    pub name: String,
    pub scope: Scope,
    pub fields: Vec<Field>,
    pub title_field: Option<String>,
    pub search: Vec<String>,
    pub actions: Vec<Action>,
    /// `undoable: false` (documento fiscal): nenhum Desfazer, nem de gravação nem de ação.
    pub undoable: bool,
    /// Configuração de registro único por escopo (`singleton`): criar o segundo é 409, excluir é 405.
    pub singleton: bool,
    /// Tempo real (`live`): gravações e ações avisam quem está com a tela aberta (`GET /{entity}/_events`).
    pub live: bool,
    /// Consulta do sistema (`source: system`): sem tabela, só leitura, com parâmetros.
    pub source: Option<Box<Source>>,
    /// JSON exatamente como veio, servido em `/_meta/entities/{name}`.
    pub raw: Value,
}

impl Entity {
    /// Entidade sem tabela, só com campos: o input de uma ação, os parâmetros de uma consulta.
    pub(crate) fn fields_only(name: String, fields: Vec<Field>) -> Entity {
        Entity {
            name,
            scope: Scope::Group,
            fields,
            title_field: None,
            search: Vec::new(),
            actions: Vec::new(),
            undoable: false,
            singleton: false,
            live: false,
            source: None,
            raw: Value::Null,
        }
    }

    pub fn field(&self, name: &str) -> Option<&Field> {
        self.fields.iter().find(|f| f.name == name)
    }

    /// Campo que pode ser lido, filtrado e ordenado: todos menos os só de escrita (filtrar por uma senha
    /// revelaria o valor aos poucos).
    pub fn readable_field(&self, name: &str) -> Option<&Field> {
        self.field(name).filter(|f| !f.write_only)
    }

    /// Campo que uma condição pode citar: os legíveis e o `id` implícito.
    pub fn condition_field(&self, name: &str) -> Option<&Field> {
        if name == "id" {
            return Some(crate::field::id_field());
        }
        self.readable_field(name)
    }

    pub fn action(&self, name: &str) -> Option<&Action> {
        self.actions.iter().find(|a| a.name == name)
    }

    /// Campo mostrado quando outra entidade aponta para esta: `titleField` ou o primeiro campo de texto.
    pub fn title_field(&self) -> Option<&Field> {
        match &self.title_field {
            Some(name) => self.field(name),
            None => self.fields.iter().find(|f| f.ty.is_textual()),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawEntity {
    name: String,
    #[serde(default)]
    scope: Scope,
    title_field: Option<String>,
    fields: Vec<RawField>,
    #[serde(default)]
    views: RawViews,
    #[serde(default)]
    actions: Vec<RawAction>,
    #[serde(default = "yes")]
    undoable: bool,
    #[serde(default)]
    singleton: bool,
    live: Option<Value>,
    source: Option<String>,
    params: Option<RawParams>,
}

fn yes() -> bool {
    true
}

#[derive(Deserialize, Default)]
struct RawViews {
    #[serde(default)]
    list: RawList,
}

#[derive(Deserialize, Default)]
struct RawList {
    #[serde(default)]
    search: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct App {
    pub entities: Vec<String>,
    pub organization: Option<Organization>,
    pub raw: Value,
}

/// Entidades do sistema que são a empresa (CNPJ raiz) e a filial (estabelecimento).
#[derive(Debug, Clone, Deserialize)]
pub struct Organization {
    pub company: String,
    pub branch: String,
}

#[derive(Deserialize)]
struct RawApp {
    entities: Vec<String>,
    organization: Option<Organization>,
}

pub fn parse_app(json: &str) -> Result<App, String> {
    let raw: Value = serde_json::from_str(json).map_err(|e| format!("app.json inválido: {e}"))?;
    let app: RawApp = serde_json::from_value(raw.clone()).map_err(|e| format!("app.json inválido: {e}"))?;
    Ok(App {
        entities: app.entities,
        organization: app.organization,
        raw,
    })
}

/// Primeira passada: estrutura e tipos. Condições são resolvidas depois, porque precisam de todos os campos.
/// visibleWhen/requiredWhen/readOnlyWhen de cada campo (pelo índice), ainda em JSON.
pub type FieldConditions = Vec<(usize, Option<Value>, Option<Value>, Option<Value>)>;

/// Condições ainda em JSON: as dos campos e o visibleWhen de cada ação (na ordem de `actions`).
pub struct Pending {
    pub fields: FieldConditions,
    pub actions: Vec<Option<Value>>,
}

pub fn parse_entity(json: &str) -> Result<(Entity, Pending), String> {
    let raw: Value = serde_json::from_str(json).map_err(|e| format!("entidade inválida: {e}"))?;
    let parsed: RawEntity = serde_json::from_value(raw.clone()).map_err(|e| format!("entidade inválida: {e}"))?;
    let name = parsed.name.clone();
    // nomes viram identificadores SQL (entre aspas); mesmo assim só aceitamos o formato da spec
    let ident = |n: &str| {
        n.len() <= 63
            && n.starts_with(|c: char| c.is_ascii_lowercase())
            && n.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
    };
    if !ident(&name) {
        return Err(format!("nome de entidade inválido '{name}'"));
    }
    let (fields, conditions) = parse_fields(&name, parsed.fields, &ident)?;
    let mut actions: Vec<Action> = Vec::new();
    let mut action_conditions = Vec::new();
    for a in parsed.actions {
        if !ident(&a.name) {
            return Err(format!("{name}: nome de ação inválido '{}'", a.name));
        }
        if actions.iter().any(|x| x.name == a.name) {
            return Err(format!("{name}: ação '{}' repetida", a.name));
        }
        let (action, visible_when) = parse_action(&name, a, &fields, &ident)?;
        actions.push(action);
        action_conditions.push(visible_when);
    }
    check_inverses(&name, parsed.undoable, &actions)?;
    let source = parse_source(&name, parsed.source, parsed.params, &ident)?;
    let entity = Entity {
        name,
        scope: parsed.scope,
        fields,
        title_field: parsed.title_field,
        search: parsed.views.list.search,
        actions,
        undoable: parsed.undoable,
        singleton: parsed.singleton,
        live: parsed.live.is_some_and(|v| !v.is_null() && v != Value::Bool(false)),
        source,
        raw,
    };
    Ok((
        entity,
        Pending {
            fields: conditions,
            actions: action_conditions,
        },
    ))
}

/// Resolve as condições dos campos e o visibleWhen das ações (que cita campos do registro).
pub fn resolve_entity(entity: &mut Entity, pending: Pending) -> Result<(), String> {
    resolve_conditions(entity, pending.fields)?;
    for (i, v) in pending.actions.into_iter().enumerate() {
        if let Some(v) = v {
            let label = format!("{}.actions.{}.visibleWhen", entity.name, entity.actions[i].name);
            entity.actions[i].visible_when = Some(Condition::parse(&v, entity).map_err(|e| format!("{label}: {e}"))?);
        }
    }
    Ok(())
}

pub(crate) fn resolve_conditions(entity: &mut Entity, conditions: FieldConditions) -> Result<(), String> {
    for (i, visible, required, locked) in conditions {
        let label = format!("{}.{}", entity.name, entity.fields[i].name);
        if let Some(v) = visible {
            entity.fields[i].visible_when = Some(Condition::parse(&v, entity).map_err(|e| format!("{label}.visibleWhen: {e}"))?);
        }
        if let Some(v) = required {
            entity.fields[i].required_when = Some(Condition::parse(&v, entity).map_err(|e| format!("{label}.requiredWhen: {e}"))?);
        }
        if let Some(v) = locked {
            entity.fields[i].read_only_when = Some(Condition::parse(&v, entity).map_err(|e| format!("{label}.readOnlyWhen: {e}"))?);
        }
    }
    Ok(())
}
