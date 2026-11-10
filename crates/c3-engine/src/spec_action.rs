//! Ações da entidade na spec (`actions`): o input vira uma entidade sem tabela, e `target: list` dispensa o registro.

use serde::Deserialize;
use serde_json::Value;

use crate::action_grid::split_spec;
use crate::condition::Condition;
use crate::field::parse_fields;
use crate::spec::{resolve_conditions, Entity, Field, FieldType};

/// Comando sobre um registro (`actions` da entidade). O motor valida e confere; quem executa é o sistema.
#[derive(Debug, Clone)]
pub struct Action {
    pub name: String,
    /// Condição sobre o registro: fora dela a ação responde 409.
    pub visible_when: Option<Condition>,
    /// Roda também em lote, sobre várias linhas da lista.
    pub bulk: bool,
    /// `bulk: "together"`: o lote é um fato só (uma baixa de vários recebíveis). O sistema executa uma vez sobre
    /// todos os ids (`Hooks::run_bulk_action`), tudo ou nada; vale também no registro sozinho.
    pub together: bool,
    /// Ação da lista, sem registro (`target: list`): importar, aplicar modelo.
    pub list: bool,
    /// Campos pedidos antes de rodar, como uma entidade sem tabela (as condições citam esses campos).
    pub input: Entity,
    /// Grades do input (`type: "grid"`): fora de `input.fields`, validadas linha a linha.
    pub grids: Vec<crate::action_grid::GridInput>,
    /// `prefill: true`: a shell pede ao sistema os valores iniciais do input (`.../_prefill`) antes de abrir.
    pub prefill: bool,
    /// `returns: "file"`: a resposta pode ser o arquivo (`ActionOutcome::file`), baixado pela shell.
    pub returns_file: bool,
    /// `preview: true`: antes de confirmar, o diálogo mostra a prévia do sistema (`.../_preview`, `Hooks::preview_action`).
    pub preview: bool,
    /// Ação que desfaz esta (`inverse`): o Desfazer da shell roda a inversa, com a versão conferida.
    pub inverse: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RawAction {
    pub(crate) name: String,
    visible_when: Option<Value>,
    /// `true` (um por um) ou `"together"` (uma execução sobre todos).
    bulk: Option<Value>,
    /// Somas das linhas marcadas (só a shell mostra); o motor confere os campos.
    #[serde(default)]
    summary: Vec<RawSummary>,
    target: Option<String>,
    inverse: Option<String>,
    #[serde(default)]
    prefill: bool,
    #[serde(default)]
    preview: bool,
    returns: Option<String>,
    #[serde(default)]
    input: RawInput,
}

#[derive(Deserialize)]
struct RawSummary {
    field: String,
}

#[derive(Deserialize, Default)]
struct RawInput {
    /// Cru: os de `type: "grid"` (grade) saem antes, em `action_grid::split_spec`.
    #[serde(default)]
    fields: Vec<Value>,
}

/// Monta a ação (nome já conferido) e devolve o `visibleWhen` cru, resolvido depois com os campos da entidade.
pub(crate) fn parse_action(
    name: &str,
    a: RawAction,
    fields: &[Field],
    ident: &dyn Fn(&str) -> bool,
) -> Result<(Action, Option<Value>), String> {
    let label = format!("{name}.actions.{}", a.name);
    let (bulk, together) = match &a.bulk {
        None | Some(Value::Bool(false)) => (false, false),
        Some(Value::Bool(true)) => (true, false),
        Some(Value::String(s)) if s == "together" => (true, true),
        Some(_) => return Err(format!("{label}.bulk: use true ou \"together\"")),
    };
    check_summary(&label, &a.summary, bulk, fields)?;
    let (plain, rows) = split_spec(&label, a.input.fields, ident)?;
    let (input_fields, input_conditions) = parse_fields(&label, plain, ident)?;
    if let Some(r) = rows.iter().find(|r| input_fields.iter().any(|f| f.name == r.name)) {
        return Err(format!("{label}: campo '{}' repetido", r.name));
    }
    if let Some(f) = input_fields.iter().find(|f| f.only_for_records()) {
        return Err(format!(
            "{label}: campo '{}' do input não pode ser readOnly, createOnly nem ter filter ou access",
            f.name
        ));
    }
    if let Some((i, ..)) = input_conditions.iter().find(|c| c.3.is_some()) {
        return Err(format!(
            "{label}: campo '{}' do input não pode ter readOnlyWhen",
            input_fields[*i].name
        ));
    }
    if let Some(r) = rows.iter().find(|r| r.from_selection.is_some()) {
        let col = r.row.field(r.from_selection.as_deref().unwrap_or_default());
        if !together || col.and_then(|c| c.reference.as_deref()) != Some(name) {
            return Err(format!(
                "{label}.{}: fromSelection só em ação bulk \"together\", numa coluna reference para '{name}'",
                r.name
            ));
        }
    }
    let mut input = Entity::fields_only(label, input_fields);
    resolve_conditions(&mut input, input_conditions)?;
    let list = a.target.as_deref() == Some("list");
    if list && (bulk || a.visible_when.is_some()) {
        return Err(format!(
            "{name}.actions.{}: ação de lista (target 'list') não tem registro: sem bulk nem visibleWhen",
            a.name
        ));
    }
    let returns_file = a.returns.as_deref() == Some("file");
    // um por um daria um arquivo por registro; em conjunto, o arquivo é um só (a remessa dos títulos marcados)
    if returns_file && bulk && !together {
        return Err(format!(
            "{name}.actions.{}: ação que devolve arquivo (returns 'file') só roda em lote com bulk \"together\"",
            a.name
        ));
    }
    let action = Action {
        name: a.name,
        visible_when: None,
        bulk,
        together,
        list,
        input,
        grids: rows,
        prefill: a.prefill,
        returns_file,
        preview: a.preview,
        inverse: a.inverse,
    };
    Ok((action, a.visible_when))
}

/// `inverse` aponta para outra ação de registro da mesma entidade, que roda sem perguntar nada (o Desfazer é um
/// clique). Entidade `undoable: false` não declara inversa: ali não existe Desfazer.
pub(crate) fn check_inverses(name: &str, undoable: bool, actions: &[Action]) -> Result<(), String> {
    for a in actions {
        let Some(inv) = &a.inverse else { continue };
        let label = format!("{name}.actions.{}.inverse", a.name);
        if !undoable {
            return Err(format!("{label}: entidade com undoable false não tem Desfazer"));
        }
        let target = actions
            .iter()
            .find(|x| x.name == *inv)
            .ok_or_else(|| format!("{label}: ação '{inv}' não existe"))?;
        if target.name == a.name {
            return Err(format!("{label}: a ação não desfaz a si mesma"));
        }
        if a.list || target.list {
            return Err(format!("{label}: ação de lista (target 'list') não tem Desfazer"));
        }
        if a.together || target.together {
            return Err(format!("{label}: ação em conjunto (bulk 'together') não tem Desfazer"));
        }
        if target.returns_file {
            return Err(format!("{label}: a inversa '{inv}' não pode devolver arquivo"));
        }
        if !target.input.fields.is_empty() || !target.grids.is_empty() {
            return Err(format!("{label}: a inversa '{inv}' roda num clique e não pode ter input"));
        }
    }
    Ok(())
}

/// `summary`: campos integer ou decimal da entidade, sem repetir, em ação que roda em lote.
fn check_summary(label: &str, summary: &[RawSummary], bulk: bool, fields: &[Field]) -> Result<(), String> {
    if !summary.is_empty() && !bulk {
        return Err(format!("{label}.summary: só vale em ação com bulk"));
    }
    for (i, s) in summary.iter().enumerate() {
        let numeric = fields
            .iter()
            .any(|f| f.name == s.field && !f.write_only && matches!(f.ty, FieldType::Integer | FieldType::Decimal));
        if !numeric {
            return Err(format!("{label}.summary: '{}' precisa ser campo integer ou decimal", s.field));
        }
        if summary[..i].iter().any(|x| x.field == s.field) {
            return Err(format!("{label}.summary: '{}' repetido", s.field));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::spec::parse_entity;

    fn entity(action: &str) -> Result<crate::spec::Entity, String> {
        let json = format!(
            r#"{{ "specVersion": "0", "name": "card", "label": {{ "singular": "R", "plural": "Rs" }},
                 "fields": [ {{ "name": "net", "type": "decimal", "scale": 2 }}, {{ "name": "code", "type": "string" }} ],
                 "actions": [ {action}, {{ "name": "reopen", "label": "Reabrir" }} ] }}"#
        );
        parse_entity(&json).map(|(e, _)| e)
    }

    #[test]
    fn bulk_true_ou_together() {
        let e = entity(r#"{ "name": "pay", "label": "P", "bulk": "together", "summary": [ { "field": "net" } ] }"#).unwrap();
        assert!(e.actions[0].bulk && e.actions[0].together);
        let e = entity(r#"{ "name": "pay", "label": "P", "bulk": true }"#).unwrap();
        assert!(e.actions[0].bulk && !e.actions[0].together);
        let err = entity(r#"{ "name": "pay", "label": "P", "bulk": "all" }"#).unwrap_err();
        assert!(err.contains("actions.pay.bulk"), "{err}");
    }

    #[test]
    fn arquivo_so_em_conjunto() {
        assert!(entity(r#"{ "name": "pay", "label": "P", "bulk": "together", "returns": "file" }"#).is_ok());
        let err = entity(r#"{ "name": "pay", "label": "P", "bulk": true, "returns": "file" }"#).unwrap_err();
        assert!(err.contains("together"), "{err}");
    }

    #[test]
    fn summary_numerico_e_com_bulk() {
        for (action, what) in [
            (
                r#"{ "name": "pay", "label": "P", "summary": [ { "field": "net" } ] }"#,
                "só vale em ação com bulk",
            ),
            (
                r#"{ "name": "pay", "label": "P", "bulk": true, "summary": [ { "field": "code" } ] }"#,
                "integer ou decimal",
            ),
            (
                r#"{ "name": "pay", "label": "P", "bulk": true, "summary": [ { "field": "net" }, { "field": "net" } ] }"#,
                "repetido",
            ),
        ] {
            let err = entity(action).unwrap_err();
            assert!(err.contains(what), "{err}");
        }
    }

    #[test]
    fn conjunto_sem_desfazer() {
        let err = entity(r#"{ "name": "pay", "label": "P", "bulk": "together", "inverse": "reopen" }"#).unwrap_err();
        assert!(err.contains("não tem Desfazer"), "{err}");
    }
}
