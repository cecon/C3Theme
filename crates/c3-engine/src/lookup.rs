//! Consultar e preencher: `POST /{entity}/_lookups/{name}` com `{ value }` (spec/README.md#consultas).
//!
//! O motor confere a declaração, a permissão e o valor de origem; quem consulta a fonte externa (ViaCEP,
//! Receita) é o sistema (`Hooks::lookup`). O que volta é conferido contra `fills` e o tipo de cada campo.

use std::collections::HashMap;

use axum::http::request::Parts;
use serde::Deserialize;
use serde_json::{Map, Value};

use crate::crud::{allow_read, Owner};
use crate::error::{ApiError, FieldErrors};
use crate::org::Ctx;
use crate::spec::{Entity, Field, FieldType};
use crate::validation::{check_fields, check_value};
use crate::{Engine, RequestContext};

/// O que o sistema recebe para consultar.
pub struct LookupCall<'a> {
    pub entity: &'a str,
    pub lookup: &'a str,
    /// Valor do campo de origem, já conferido (formato, tamanho, dígito do CNPJ). Origem `reference`: o id,
    /// de um registro que existe e está no escopo da filial ativa.
    pub value: &'a str,
    /// Os campos de `with` como estão no formulário (ainda não gravados), conferidos como os da gravação
    /// (`reference` no escopo); o que veio vazio chega `null`.
    pub with: &'a Map<String, Value>,
    pub ctx: &'a RequestContext<'a>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Lookup {
    name: String,
    field: String,
    fills: Vec<String>,
    /// Outros campos do formulário que vão junto (`with`): a média depende da conta e também do centro e do ano.
    #[serde(default)]
    with: Vec<String>,
}

/// Origem: texto (CEP, CNPJ) ou `reference` (a conta escolhida), legível.
fn source_ok(f: Option<&Field>) -> bool {
    f.is_some_and(|f| matches!(f.ty, FieldType::String | FieldType::Reference))
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
            if !source_ok(e.readable_field(&l.field)) {
                return Err(format!(
                    "{at}: field '{}' precisa ser campo string ou reference que não seja writeOnly",
                    l.field
                ));
            }
            for (k, name) in l.with.iter().enumerate() {
                let ok = e.readable_field(name).is_some_and(|f| f.ty != FieldType::File);
                if !ok || *name == l.field || l.with[..k].contains(name) {
                    return Err(format!(
                        "{at}.with: '{name}' precisa ser campo legível, não file, sem repetir e diferente da origem"
                    ));
                }
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

    let (value, with) = parse_body(&lookup, body)?;
    let source = entity.field(&lookup.field).expect("conferido na subida");
    let mut errors = FieldErrors::default();
    if value.is_empty() {
        errors.add(&source.name, "required", "Campo obrigatório.");
    } else if source.ty == FieldType::String {
        check_value(source, &Value::String(value.clone()), &mut errors);
    }
    if !errors.is_empty() {
        return Err(ApiError::validation(errors));
    }
    let with = check_with(engine, &ctx, entity, &lookup, &value, with).await?;

    let rc = ctx.request_context();
    let data = engine
        .0
        .hooks
        .lookup(LookupCall {
            entity: &entity.name,
            lookup: &lookup.name,
            value: &value,
            with: &with,
            ctx: &rc,
        })
        .await?;
    check_result(entity, &lookup, &data)?;
    Ok(data)
}

/// Corpo: `{ value }` e, com `with` declarado, `{ value, with: { campo: valor } }` (só os campos de `with`).
fn parse_body(lookup: &Lookup, body: Option<Value>) -> Result<(String, Map<String, Value>), ApiError> {
    let bad = || ApiError::bad_request("Corpo precisa ser { \"value\": \"...\" } (e \"with\" com os campos declarados).");
    let Some(Value::Object(mut o)) = body else { return Err(bad()) };
    let Some(Value::String(value)) = o.remove("value") else {
        return Err(bad());
    };
    let with = match o.remove("with") {
        None | Some(Value::Null) => Map::new(),
        Some(Value::Object(w)) if w.keys().all(|k| lookup.with.contains(k)) => w,
        Some(_) => return Err(bad()),
    };
    if !o.is_empty() {
        return Err(bad());
    }
    Ok((value, with))
}

/// Confere a origem `reference` e os campos de `with` como na gravação (tipo, regras, `reference` existente no
/// escopo da filial ativa), sem obrigatório: o formulário ainda está pela metade. Erro vai no campo, 422.
async fn check_with(
    engine: &Engine,
    ctx: &Ctx<'_>,
    entity: &Entity,
    lookup: &Lookup,
    value: &str,
    mut with: Map<String, Value>,
) -> Result<Map<String, Value>, ApiError> {
    let source = entity.field(&lookup.field).expect("conferido na subida");
    let mut names: Vec<&str> = lookup.with.iter().map(String::as_str).collect();
    let mut record = with.clone();
    if source.ty == FieldType::Reference {
        names.push(&source.name);
        record.insert(source.name.clone(), Value::String(value.to_owned()));
    }
    if names.is_empty() {
        return Ok(with);
    }
    crate::validation::normalize_refs(entity, &mut record);
    let fields = names
        .iter()
        .map(|n| loose(entity.field(n).expect("conferido na subida"), *n == source.name))
        .collect();
    let probe = Entity::fields_only(format!("{}.lookups.{}", entity.name, lookup.name), fields);
    let owner = ctx.active().map_or_else(Owner::default, |b| Owner::of_new(entity, b));
    let mut errors = FieldErrors::default();
    let mut conn = engine.0.store.conn().await?;
    check_fields(&mut *conn, ctx, &probe, owner, &record, false, &mut errors).await?;
    if !errors.is_empty() {
        return Err(ApiError::validation(errors));
    }
    for name in &lookup.with {
        let v = record.remove(name).unwrap_or(Value::Null);
        with.insert(name.clone(), if v == Value::String(String::new()) { Value::Null } else { v });
    }
    Ok(with)
}

/// O campo só com as regras do valor: sem obrigatório (salvo a origem), condições, filtro, acesso ou unique.
fn loose(f: &Field, required: bool) -> Field {
    Field {
        required,
        read_only: false,
        create_only: false,
        unique: false,
        visible_when: None,
        required_when: None,
        read_only_when: None,
        ref_filter: None,
        access: Default::default(),
        ..f.clone()
    }
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
