//! Consultar e preencher: `POST /{entity}/_lookups/{name}` com `{ value }` (spec/README.md#consultas).
//!
//! O motor confere a declaração, a permissão e o valor de origem; quem consulta a fonte externa (ViaCEP,
//! Receita) é o sistema (`Hooks::lookup`). O que volta é conferido contra `fills` e o tipo de cada campo.

use std::collections::HashMap;

use axum::http::request::Parts;
use serde::Deserialize;
use serde_json::{Map, Value};

use crate::crud::allow_read;
use crate::error::{ApiError, FieldErrors};
use crate::org::Ctx;
use crate::spec::{Entity, FieldType};
use crate::validation::check_value;
use crate::{Engine, RequestContext};

/// O que o sistema recebe para consultar.
pub struct LookupCall<'a> {
    pub entity: &'a str,
    pub lookup: &'a str,
    /// Valor do campo de origem, já conferido (formato, tamanho, dígito do CNPJ).
    pub value: &'a str,
    pub ctx: &'a RequestContext<'a>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Lookup {
    name: String,
    field: String,
    fills: Vec<String>,
}

/// Lê `lookups` do JSON da entidade (o schema já garantiu o formato; a subida confere os campos).
fn declared(entity: &Entity) -> Vec<Lookup> {
    entity
        .raw
        .get("lookups")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default()
}

/// Subida: origem é string legível; destinos existem, são graváveis, não são a origem; nomes sem repetir.
pub(crate) fn check_spec(entities: &HashMap<String, Entity>) -> Result<(), String> {
    for e in entities.values() {
        if e.raw
            .get("lookups")
            .is_some_and(|v| serde_json::from_value::<Vec<Lookup>>(v.clone()).is_err())
        {
            return Err(format!("{}: lookups mal formado", e.name));
        }
        let lookups = declared(e);
        for (i, l) in lookups.iter().enumerate() {
            let at = format!("{}.lookups.{}", e.name, l.name);
            if lookups[..i].iter().any(|x| x.name == l.name) {
                return Err(format!("{at}: nome repetido"));
            }
            if !e.readable_field(&l.field).is_some_and(|f| f.ty == FieldType::String) {
                return Err(format!("{at}: field '{}' precisa ser campo string que não seja writeOnly", l.field));
            }
            for name in &l.fills {
                let ok = e
                    .field(name)
                    .is_some_and(|f| !f.read_only && !f.write_only && f.ty != FieldType::File);
                if !ok || *name == l.field {
                    return Err(format!(
                        "{at}: '{name}' não pode ser preenchido (inexistente, origem, readOnly, writeOnly ou file)"
                    ));
                }
            }
        }
    }
    Ok(())
}

/// `body`: o corpo como veio (`None` se não era JSON). Devolve os campos para preencher.
pub(crate) async fn run(
    engine: &Engine,
    req: &Parts,
    name: &str,
    lookup_name: &str,
    body: Option<Value>,
) -> Result<Map<String, Value>, ApiError> {
    let entity = engine.entity(name)?;
    let lookup = declared(entity)
        .into_iter()
        .find(|l| l.name == lookup_name)
        .ok_or_else(|| ApiError::not_found(format!("Consulta '{lookup_name}' não existe.")))?;
    let ctx = Ctx::new(engine, req).await?;
    // quem consulta está preenchendo o formulário: precisa poder criar ou alterar. Filha `with_parent` só se
    // grava pelo pai, então vale a permissão do pai (a da filha costuma ser só leitura)
    let writer = engine.0.children.parent_of(name).map_or(entity, |p| &engine.0.entities[p]);
    allow_read(&ctx, writer, |c| c.create || c.update)?;

    let value = match body {
        Some(Value::Object(o)) if o.len() == 1 && o.get("value").is_some_and(Value::is_string) => o["value"].clone(),
        _ => return Err(ApiError::bad_request("Corpo precisa ser { \"value\": \"...\" }.")),
    };
    let source = entity.field(&lookup.field).expect("conferido na subida");
    let mut errors = FieldErrors::default();
    if value == "" {
        errors.add(&source.name, "required", "Campo obrigatório.");
    }
    check_value(source, &value, &mut errors);
    if !errors.is_empty() {
        return Err(ApiError::validation(errors));
    }

    let rc = ctx.request_context();
    let data = engine
        .0
        .hooks
        .lookup(LookupCall {
            entity: &entity.name,
            lookup: &lookup.name,
            value: value.as_str().unwrap(),
            ctx: &rc,
        })
        .await?;
    check_result(entity, &lookup, &data)?;
    Ok(data)
}

/// O sistema só devolve campos de `fills`, no formato trafegado (reference como `{ id, title }`). Fora disso
/// é erro do sistema, não do usuário: 500, com o motivo no log.
fn check_result(entity: &Entity, lookup: &Lookup, data: &Map<String, Value>) -> Result<(), ApiError> {
    for (key, v) in data {
        let f = entity.field(key).filter(|_| lookup.fills.contains(key));
        let ok = match (f, v) {
            (None, _) => false,
            (Some(_), Value::Null) => true,
            (Some(f), Value::Object(o)) if f.ty == FieldType::Reference => {
                o.get("id").and_then(Value::as_str).and_then(crate::value::parse_id).is_some()
            }
            (Some(f), _) if f.ty == FieldType::Reference => false,
            (Some(f), v) => {
                let mut errors = FieldErrors::default();
                check_value(f, v, &mut errors);
                errors.is_empty()
            }
        };
        if !ok {
            eprintln!(
                "c3-engine: lookup {}.{} devolveu '{key}' fora de fills ou do formato",
                entity.name, lookup.name
            );
            return Err(ApiError::internal());
        }
    }
    Ok(())
}
