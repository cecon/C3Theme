//! Partes de human-in-the-loop que o agente põe no chat (spec/v0/agent-ui.schema.json): `c3.tool` (ferramenta com
//! argumentos editáveis), `c3.plan` (plano editável) e `c3.browser` (navegador interno). Não citam entidade: a
//! conferência é de formato e de segurança (endereço só http(s), captura só imagem), para o sistema nunca mandar ao
//! chat o que a tela não pode mostrar. Quem roda a ferramenta é o agente, depois da resposta do humano.

use serde_json::{Map, Value};

const RISKS: [&str; 3] = ["low", "medium", "high"];
const ARG_TYPES: [&str; 6] = ["string", "text", "number", "boolean", "enum", "json"];
const MAX_ITEMS: usize = 50;

type Obj = Map<String, Value>;

fn text<'a>(p: &'a Obj, key: &str) -> Option<&'a str> {
    p.get(key).and_then(Value::as_str)
}

/// Só as chaves conhecidas (o schema tem `additionalProperties: false`).
fn only(p: &Obj, keys: &[&str], what: &str) -> Result<(), String> {
    match p.keys().find(|k| !keys.contains(&k.as_str())) {
        Some(k) => Err(format!("{what}: chave '{k}' desconhecida")),
        None => Ok(()),
    }
}

fn optional_text(p: &Obj, key: &str, max: usize, what: &str) -> Result<(), String> {
    match p.get(key) {
        None => Ok(()),
        Some(Value::String(s)) if s.chars().count() <= max => Ok(()),
        Some(_) => Err(format!("{what}: '{key}' precisa ser texto de até {max} caracteres")),
    }
}

fn required_text(p: &Obj, key: &str, max: usize, what: &str) -> Result<(), String> {
    match text(p, key) {
        Some(s) if !s.trim().is_empty() && s.chars().count() <= max => Ok(()),
        _ => Err(format!("{what} precisa de '{key}' (texto de 1 a {max} caracteres)")),
    }
}

fn risk(p: &Obj, what: &str) -> Result<(), String> {
    match p.get("risk") {
        None => Ok(()),
        Some(Value::String(r)) if RISKS.contains(&r.as_str()) => Ok(()),
        Some(_) => Err(format!("{what}: risk precisa ser low, medium ou high")),
    }
}

/// `allow`: objeto só com as chaves dadas, cada uma sim/não.
fn allow(p: &Obj, keys: &[&str], what: &str) -> Result<(), String> {
    let Some(v) = p.get("allow") else { return Ok(()) };
    let a = v.as_object().ok_or(format!("{what}: allow precisa ser um objeto"))?;
    only(a, keys, &format!("{what}: allow"))?;
    match a.iter().find(|(_, v)| !v.is_boolean()) {
        Some((k, _)) => Err(format!("{what}: allow.{k} precisa ser true ou false")),
        None => Ok(()),
    }
}

fn list<'a>(p: &'a Obj, key: &str, what: &str) -> Result<Option<&'a Vec<Value>>, String> {
    match p.get(key) {
        None => Ok(None),
        Some(Value::Array(a)) if a.len() <= MAX_ITEMS => Ok(Some(a)),
        Some(_) => Err(format!("{what}: '{key}' precisa ser uma lista de até {MAX_ITEMS}")),
    }
}

/// Endereço que a tela pode mostrar: http ou https, com algo depois do esquema.
pub(crate) fn is_web_url(s: &str) -> bool {
    ["https://", "http://"]
        .iter()
        .any(|scheme| s.len() > scheme.len() && s.get(..scheme.len()).is_some_and(|h| h.eq_ignore_ascii_case(scheme)))
}

/// Captura: endereço web, caminho do próprio app (`/capturas/1.png`, nunca `//outro`) ou imagem embutida em base64
/// (nunca HTML, SVG ou script).
pub(crate) fn is_frame(s: &str) -> bool {
    is_web_url(s)
        || s.strip_prefix('/').is_some_and(|rest| !rest.starts_with(['/', '\\']))
        || ["png", "jpeg", "webp", "gif"]
            .iter()
            .any(|t| s.starts_with(&format!("data:image/{t};base64,")))
}

fn check_field(f: &Value) -> Result<(), String> {
    let f = f.as_object().ok_or("c3.tool: cada campo precisa ser um objeto")?;
    only(f, &["name", "label", "type", "options", "required", "readOnly"], "c3.tool: campo")?;
    required_text(f, "name", 128, "c3.tool: campo")?;
    if !text(f, "type").is_some_and(|t| ARG_TYPES.contains(&t)) {
        return Err(format!(
            "c3.tool: campo '{}': type fora de {ARG_TYPES:?}",
            text(f, "name").unwrap_or_default()
        ));
    }
    if ["required", "readOnly"].iter().any(|k| f.get(*k).is_some_and(|v| !v.is_boolean())) {
        return Err("c3.tool: required e readOnly são true ou false".into());
    }
    for o in list(f, "options", "c3.tool: campo")?.into_iter().flatten() {
        let ok = o.as_object().is_some_and(|o| o.get("value").is_some_and(Value::is_string));
        if !ok {
            return Err("c3.tool: cada opção precisa de value (texto)".into());
        }
    }
    optional_text(f, "label", 200, "c3.tool: campo")
}

pub(crate) fn check_tool(p: &Obj) -> Result<(), String> {
    only(p, &["tool", "args", "fields", "risk", "allow"], "c3.tool")?;
    let tool = p.get("tool").and_then(Value::as_object).ok_or("c3.tool precisa de tool")?;
    only(tool, &["name", "label", "description"], "c3.tool: tool")?;
    required_text(tool, "name", 128, "c3.tool: tool")?;
    optional_text(tool, "label", 128, "c3.tool: tool")?;
    optional_text(tool, "description", 1000, "c3.tool: tool")?;
    if !p.get("args").is_some_and(Value::is_object) {
        return Err("c3.tool precisa de args (objeto)".into());
    }
    for f in list(p, "fields", "c3.tool")?.into_iter().flatten() {
        check_field(f)?;
    }
    risk(p, "c3.tool")?;
    allow(p, &["edit", "respond", "always"], "c3.tool")
}

pub(crate) fn check_plan(p: &Obj) -> Result<(), String> {
    only(p, &["title", "steps", "allow"], "c3.plan")?;
    optional_text(p, "title", 200, "c3.plan")?;
    let steps = list(p, "steps", "c3.plan")?
        .filter(|s| !s.is_empty())
        .ok_or("c3.plan precisa de steps")?;
    let mut ids = std::collections::HashSet::new();
    for s in steps {
        let s = s.as_object().ok_or("c3.plan: cada passo precisa ser um objeto")?;
        only(s, &["id", "text", "detail", "required"], "c3.plan: passo")?;
        required_text(s, "id", 128, "c3.plan: passo")?;
        required_text(s, "text", 500, "c3.plan: passo")?;
        optional_text(s, "detail", 500, "c3.plan: passo")?;
        if s.get("required").is_some_and(|v| !v.is_boolean()) {
            return Err("c3.plan: required é true ou false".into());
        }
        if !ids.insert(text(s, "id").unwrap_or_default()) {
            return Err(format!("c3.plan: passo '{}' repetido", text(s, "id").unwrap_or_default()));
        }
    }
    allow(p, &["edit", "reorder", "remove"], "c3.plan")
}

pub(crate) fn check_browser(p: &Obj) -> Result<(), String> {
    only(
        p,
        &["url", "title", "frame", "intent", "target", "risk", "allowTakeover"],
        "c3.browser",
    )?;
    if !text(p, "url").is_some_and(is_web_url) {
        return Err("c3.browser: url precisa ser http(s)".into());
    }
    if p.get("frame").is_some_and(|f| !f.as_str().is_some_and(is_frame)) {
        return Err("c3.browser: frame só aceita http(s) ou data:image (png, jpeg, webp, gif) em base64".into());
    }
    required_text(p, "intent", 300, "c3.browser")?;
    optional_text(p, "title", 300, "c3.browser")?;
    if let Some(t) = p.get("target") {
        let in_page = |k: &str| t.get(k).and_then(Value::as_f64).is_some_and(|v| (0.0..=100.0).contains(&v));
        let only_xy = t.as_object().is_some_and(|o| o.len() == 2);
        if !(only_xy && in_page("x") && in_page("y")) {
            return Err("c3.browser: target precisa de x e y entre 0 e 100".into());
        }
    }
    if p.get("allowTakeover").is_some_and(|v| !v.is_boolean()) {
        return Err("c3.browser: allowTakeover é true ou false".into());
    }
    risk(p, "c3.browser")
}

#[cfg(test)]
#[path = "agent_hitl_tests.rs"]
mod tests;
