//! Grade no input de uma ação (`type: "grid"`): várias linhas digitadas de uma vez (contar cada forma de pagamento,
//! ajustar o preço de 50 produtos). Cada linha é validada como os campos do input; o erro volta em `formas.2.contado`.
//! `readOnly` na linha só trava a tela: o valor vai ao sistema (é o que identifica a linha, como a forma contada), e
//! o sistema confere de novo o que importa.

use serde_json::{Map, Value};

use crate::action::parse_input;
use crate::crud::Owner;
use crate::error::{ApiError, FieldErrors};
use crate::field::{parse_fields, RawField};
use crate::org::Ctx;
use crate::spec::{Action, Entity};
use crate::store::Conn;
use crate::validation::check_fields;

/// Teto de linhas de uma grade (o corpo da requisição tem 2 MB).
pub(crate) const MAX_ROWS: usize = 500;
const DEFAULT_MAX: usize = 200;

#[derive(Debug, Clone)]
pub struct GridInput {
    pub name: String,
    /// Os campos de cada linha, como uma entidade sem tabela.
    pub row: Entity,
    pub min_items: usize,
    pub max_items: usize,
    /// `fromSelection`: a coluna `reference` da própria entidade que a shell preenche com as linhas marcadas (uma por
    /// registro); só em ação `bulk: "together"`, e o motor confere que as linhas são exatamente a seleção.
    pub from_selection: Option<String>,
}

/// Separa as grades (`grid`) do input cru da spec; os outros seguem para `parse_fields`.
pub(crate) fn split_spec(label: &str, raw: Vec<Value>, ident: &dyn Fn(&str) -> bool) -> Result<(Vec<RawField>, Vec<GridInput>), String> {
    let mut fields = Vec::new();
    let mut rows = Vec::new();
    for f in raw {
        if f.get("type").and_then(Value::as_str) != Some("grid") {
            fields.push(serde_json::from_value(f).map_err(|e| format!("{label}: {e}"))?);
            continue;
        }
        let name = f.get("name").and_then(Value::as_str).unwrap_or_default().to_owned();
        let at = format!("{label}.{name}");
        if !ident(&name) {
            return Err(format!("{label}: nome de campo inválido '{name}'"));
        }
        let count = |k: &str| f.get(k).and_then(Value::as_u64).map(|n| n as usize);
        let required = f.get("required").and_then(Value::as_bool).unwrap_or(false);
        let min_items = count("minItems").unwrap_or(usize::from(required));
        let max_items = count("maxItems").unwrap_or(DEFAULT_MAX);
        if max_items == 0 || max_items > MAX_ROWS || min_items > max_items {
            return Err(format!("{at}: maxItems de 1 a {MAX_ROWS}, e minItems até ele"));
        }
        // readOnly na linha só trava a tela; para o motor o valor vem e é validado
        let sub: Vec<RawField> = f
            .get("fields")
            .and_then(Value::as_array)
            .filter(|a| !a.is_empty())
            .ok_or(format!("{at}: grid precisa de fields"))?
            .iter()
            .map(|c| {
                let mut c = c.clone();
                c.as_object_mut().map(|o| o.remove("readOnly"));
                if c.get("type").and_then(Value::as_str) == Some("grid") {
                    return Err(format!("{at}: grade dentro de grade não vale"));
                }
                serde_json::from_value(c).map_err(|e| format!("{at}: {e}"))
            })
            .collect::<Result<_, _>>()?;
        let (sub, conditions) = parse_fields(&at, sub, ident)?;
        if conditions.iter().any(|c| c.1.is_some() || c.2.is_some() || c.3.is_some()) {
            return Err(format!("{at}: campo da linha não tem visibleWhen, requiredWhen nem readOnlyWhen"));
        }
        if let Some(c) = sub.iter().find(|c| c.only_for_records() || c.ty == crate::FieldType::File) {
            return Err(format!(
                "{at}.{}: campo da linha não pode ser file, createOnly nem ter filter ou access",
                c.name
            ));
        }
        let from_selection = f.get("fromSelection").and_then(Value::as_str).map(str::to_owned);
        if let Some(col) = &from_selection {
            if !sub.iter().any(|c| c.name == *col && c.ty == crate::FieldType::Reference) {
                return Err(format!("{at}.fromSelection: '{col}' precisa ser uma coluna reference da grade"));
            }
        }
        rows.push(GridInput {
            name,
            row: Entity::fields_only(at, sub),
            min_items,
            max_items,
            from_selection,
        });
    }
    Ok((fields, rows))
}

/// O input cru de uma ação: os campos comuns por `parse_input` (desconhecido = 400, ausente = default) e as grades
/// como vieram, para `check`.
pub(crate) fn parse(action: &Action, obj: &Map<String, Value>) -> Result<Map<String, Value>, ApiError> {
    let mut obj = obj.clone();
    let rows = take(&action.grids, &mut obj);
    let mut out = parse_input(&action.input, &obj)?;
    out.extend(rows);
    Ok(out)
}

/// Tira do corpo as grades (o resto passa por `parse_input` como sempre).
pub(crate) fn take(rows: &[GridInput], obj: &mut Map<String, Value>) -> Map<String, Value> {
    rows.iter()
        .filter_map(|r| obj.remove(&r.name).map(|v| (r.name.clone(), v)))
        .collect()
}

/// Valida cada grade e devolve as linhas no formato que o sistema recebe (todo campo presente; vazio = null).
pub(crate) async fn check(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    rows: &[GridInput],
    owner: Owner,
    raw: &Map<String, Value>,
    errors: &mut FieldErrors,
) -> Result<Map<String, Value>, ApiError> {
    let mut out = Map::new();
    for r in rows {
        let items = match raw.get(&r.name) {
            None | Some(Value::Null) => Vec::new(),
            Some(Value::Array(a)) => a.clone(),
            Some(_) => return Err(ApiError::bad_request(format!("'{}' precisa ser uma lista de linhas.", r.name))),
        };
        if items.len() > r.max_items {
            errors.add(&r.name, "max_items", format!("No máximo {} linhas.", r.max_items));
        } else if items.len() < r.min_items {
            errors.add(&r.name, "min_items", format!("Informe pelo menos {} linha(s).", r.min_items));
        }
        let mut lines = Vec::with_capacity(items.len());
        for (i, item) in items.iter().enumerate() {
            let obj = item
                .as_object()
                .ok_or_else(|| ApiError::bad_request(format!("Linha {i} de '{}' precisa ser um objeto.", r.name)))?;
            let line = parse_input(&r.row, obj)?;
            let mut line_errors = FieldErrors::default();
            check_fields(conn, ctx, &r.row, owner, &line, false, &mut line_errors).await?;
            errors.absorb(&format!("{}.{i}.", r.name), line_errors);
            let normalized: Map<String, Value> = r
                .row
                .fields
                .iter()
                .map(|f| {
                    let v = line.get(&f.name).cloned().unwrap_or(Value::Null);
                    (f.name.clone(), if f.ty.is_textual() && v == "" { Value::Null } else { v })
                })
                .collect();
            lines.push(Value::Object(normalized));
        }
        out.insert(r.name.clone(), Value::Array(lines));
    }
    Ok(out)
}

/// Grade `fromSelection`: as linhas são exatamente os registros marcados, um por linha. Fora disso, 422 na grade.
pub(crate) fn check_selection(rows: &[GridInput], input: &Map<String, Value>, ids: &[String]) -> Result<(), ApiError> {
    let mut errors = FieldErrors::default();
    for r in rows {
        let Some(col) = &r.from_selection else { continue };
        let mut got: Vec<String> = input
            .get(&r.name)
            .and_then(Value::as_array)
            .map(|lines| {
                lines
                    .iter()
                    .map(|l| match &l[col.as_str()] {
                        Value::String(s) => s.clone(),
                        v => v.to_string(),
                    })
                    .collect()
            })
            .unwrap_or_default();
        let mut want = ids.to_vec();
        got.sort();
        want.sort();
        if got != want {
            errors.add(&r.name, "selection", "As linhas precisam ser os registros marcados, um por linha.");
        }
    }
    if errors.is_empty() {
        Ok(())
    } else {
        Err(ApiError::validation(errors))
    }
}
