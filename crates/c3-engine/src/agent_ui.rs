//! Partes de interface que o assistente põe no chat (spec/v0/agent-ui.schema.json): `c3.form` (campos avulsos),
//! `c3.record` (rascunho de registro) e `c3.action` (confirmar uma ação). O agente só propõe: a gravação vai pelo
//! CRUD e pelas ações de sempre, com a permissão do usuário. O backend do sistema confere a parte com
//! [`Engine::check_agent_part`] antes de mandá-la ao chat (o modelo erra e pode ser induzido por texto de um
//! registro) e confere a resposta de um `c3.form` com [`Engine::check_agent_answer`].

use serde_json::{json, Map, Value};

use crate::error::{ApiError, FieldErrors};
use crate::field::Field;
use crate::spec::{Entity, FieldType};
use crate::spec_action::{parse_action, RawAction};
use crate::validation::{check_value, is_visible};
use crate::{value, Engine};

/// Senha/PIN e arquivo: o assistente nunca pede nem preenche.
fn forbidden(f: &Field) -> bool {
    f.write_only || f.ty == FieldType::File
}

fn ident(n: &str) -> bool {
    n.len() <= 63
        && n.starts_with(|c: char| c.is_ascii_lowercase())
        && n.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
}

fn object<'a>(v: Option<&'a Value>, what: &str) -> Result<Option<&'a Map<String, Value>>, String> {
    match v {
        None | Some(Value::Null) => Ok(None),
        Some(Value::Object(o)) => Ok(Some(o)),
        Some(_) => Err(format!("{what} precisa ser um objeto")),
    }
}

/// `suggested`: campo → de onde veio o valor (texto); só campos que a parte preenche.
fn check_suggested(p: &Map<String, Value>, filled: &Map<String, Value>) -> Result<(), String> {
    let Some(s) = object(p.get("suggested"), "suggested")? else {
        return Ok(());
    };
    match s.iter().find(|(k, v)| !filled.contains_key(*k) || !v.is_string()) {
        Some((k, _)) => Err(format!("suggested: '{k}' não é um campo preenchido")),
        None => Ok(()),
    }
}

impl Engine {
    /// Confere uma parte (`{ id, kind, payload }`) contra a spec carregada. `Err` diz o que está errado; o sistema
    /// troca a parte por texto em vez de mandá-la.
    pub fn check_agent_part(&self, part: &Value) -> Result<(), String> {
        let part = part.as_object().ok_or("a parte precisa ser um objeto")?;
        if !part.get("id").is_some_and(Value::is_string) {
            return Err("a parte precisa de id".into());
        }
        let payload = object(part.get("payload"), "payload")?.ok_or("a parte precisa de payload")?;
        match part.get("kind").and_then(Value::as_str) {
            Some("c3.form") => self.form_input(payload).map(|_| ()),
            Some("c3.record") => self.check_record(payload),
            Some("c3.action") => self.check_action(payload),
            Some(k) => Err(format!("kind '{k}' fora do catálogo do motor")),
            None => Err("a parte precisa de kind".into()),
        }
    }

    /// Confere a resposta de um `c3.form` (o `payload` que foi mandado e os `values` que voltaram), como o input de
    /// uma ação: campo desconhecido é 400; obrigatório, formato e regras viram 422. Devolve os valores limpos
    /// (campo escondido vai `null`). Reference é conferido no banco só quando o valor for usado numa gravação.
    pub fn check_agent_answer(&self, payload: &Value, values: &Map<String, Value>) -> Result<Map<String, Value>, ApiError> {
        let payload = payload
            .as_object()
            .ok_or_else(|| ApiError::bad_request("payload precisa ser um objeto"))?;
        let input = self.form_input(payload).map_err(ApiError::bad_request)?;
        let values = crate::action::parse_input(&input, values)?;
        let mut errors = FieldErrors::default();
        let mut out = Map::new();
        for f in &input.fields {
            let v = values.get(&f.name).cloned().unwrap_or(Value::Null);
            let shown = is_visible(&input, f, &values);
            if !shown || value::is_empty(Some(&v)) {
                let required = f.required || f.required_when.as_ref().is_some_and(|c| c.eval(&values, &input));
                if shown && required {
                    errors.add(&f.name, "required", "Campo obrigatório.");
                }
                out.insert(f.name.clone(), Value::Null);
                continue;
            }
            check_value(f, &v, &mut errors);
            out.insert(f.name.clone(), v);
        }
        if errors.is_empty() {
            Ok(out)
        } else {
            Err(ApiError::validation(errors))
        }
    }

    /// Os campos de um `c3.form` como o input de uma ação (mesmos tipos, regras e condições).
    fn form_input(&self, p: &Map<String, Value>) -> Result<Entity, String> {
        let raw: RawAction = serde_json::from_value(json!({ "name": "form", "input": { "fields": p.get("fields") } }))
            .map_err(|e| format!("c3.form: fields inválidos: {e}"))?;
        let (action, _) = parse_action("agent", raw, &[], &ident)?;
        if !action.grids.is_empty() {
            return Err("c3.form: grade (type grid) não vale no formulário do assistente".into());
        }
        let input = action.input;
        if input.fields.is_empty() {
            return Err("c3.form precisa de fields".into());
        }
        for f in &input.fields {
            if forbidden(f) {
                return Err(format!("c3.form: campo '{}': o assistente não pede senha nem arquivo", f.name));
            }
            if let Some(target) = &f.reference {
                if !self.0.entities.contains_key(target) {
                    return Err(format!("c3.form: campo '{}' referencia entidade desconhecida", f.name));
                }
            }
        }
        let values = object(p.get("values"), "values")?.cloned().unwrap_or_default();
        if let Some(k) = values.keys().find(|k| input.field(k).is_none()) {
            return Err(format!("c3.form: values: campo '{k}' desconhecido"));
        }
        check_suggested(p, &values)?;
        Ok(input)
    }

    fn check_record(&self, p: &Map<String, Value>) -> Result<(), String> {
        let name = p.get("entity").and_then(Value::as_str).ok_or("c3.record precisa de entity")?;
        let entity = self.0.entities.get(name).ok_or_else(|| format!("entidade '{name}' desconhecida"))?;
        let is_new = match p.get("id") {
            None | Some(Value::Null) => true,
            Some(Value::String(_)) => false,
            Some(_) => return Err("id precisa ser texto".into()),
        };
        let values = object(p.get("values"), "values")?
            .filter(|v| !v.is_empty())
            .ok_or("c3.record precisa de values")?;
        for k in values.keys() {
            let ok = entity
                .field(k)
                .is_some_and(|f| !forbidden(f) && !f.read_only && (is_new || !f.create_only));
            if !ok {
                return Err(format!("c3.record: campo '{k}' não pode ser proposto"));
            }
        }
        check_suggested(p, values)
    }

    fn check_action(&self, p: &Map<String, Value>) -> Result<(), String> {
        let text = |k: &str| p.get(k).and_then(Value::as_str);
        let (Some(name), Some(_), Some(action)) = (text("entity"), text("id"), text("action")) else {
            return Err("c3.action precisa de entity, id e action".into());
        };
        let action = self
            .0
            .entities
            .get(name)
            .and_then(|e| e.action(action))
            .ok_or_else(|| format!("ação '{name}.{action}' desconhecida"))?;
        if action.list {
            return Err("c3.action: ação da lista não tem registro".into());
        }
        let input = object(p.get("input"), "input")?.cloned().unwrap_or_default();
        if let Some(k) = input.keys().find(|k| !action.input.field(k).is_some_and(|f| !forbidden(f))) {
            return Err(format!("c3.action: input: campo '{k}' não pode ser proposto"));
        }
        check_suggested(p, &input)
    }
}
