//! Conferências da subida (`EngineBuilder::build`): a conexão e o banco batem com as entidades, o modo só leitura
//! e campo só de escrita tem quem faça o hash.

use std::collections::HashMap;

use crate::children::Children;
use crate::{org, spec, store, FieldType, Hooks, Scope, SqlValue, Store};

/// O que o sistema precisa fazer pelo motor: gravar tudo no modo só leitura, e gravar quem tem campo `writeOnly`.
pub(crate) fn check_hooks(
    entities: &HashMap<String, spec::Entity>,
    children: &Children,
    hooks: &dyn Hooks,
    read_only: bool,
) -> Result<(), String> {
    if read_only {
        check_read_only(entities, children, hooks)?;
    }
    check_sources(entities, children)?;
    check_write_only(entities, children, hooks)
}

/// Consulta do sistema (`source: system`) não tem tabela nem registro: ninguém aponta para ela, não é filha e só tem
/// ação de lista (ação de registro precisaria reler a linha com os parâmetros, o que ainda não existe).
fn check_sources(entities: &HashMap<String, spec::Entity>, children: &Children) -> Result<(), String> {
    let mut names: Vec<_> = entities.keys().collect();
    names.sort();
    for name in names {
        let e = &entities[name];
        if let Some(f) = e
            .fields
            .iter()
            .find(|f| f.reference.as_ref().is_some_and(|r| entities[r].source.is_some()))
        {
            return Err(format!(
                "{name}.{}: reference para consulta do sistema (source system) não vale",
                f.name
            ));
        }
        if e.source.is_none() {
            continue;
        }
        if children.parent_of(name).is_some() {
            return Err(format!("{name}: consulta do sistema não pode ser filha with_parent"));
        }
        if let Some(a) = e.actions.iter().find(|a| !a.list) {
            return Err(format!(
                "{name}.actions.{}: consulta do sistema só tem ação de lista (target 'list')",
                a.name
            ));
        }
    }
    Ok(())
}

/// Modo só leitura: toda entidade gravável (fora as filhas, que vão na escrita do pai) precisa delegar a escrita.
fn check_read_only(entities: &HashMap<String, spec::Entity>, children: &Children, hooks: &dyn Hooks) -> Result<(), String> {
    let mut own: Vec<_> = entities
        .keys()
        .filter(|e| children.parent_of(e).is_none() && entities[*e].source.is_none() && !hooks.delegates_writes(e))
        .map(String::as_str)
        .collect();
    if own.is_empty() {
        return Ok(());
    }
    own.sort();
    Err(format!(
        "modo só leitura: o sistema precisa gravar estas entidades (Hooks::delegates_writes): {}",
        own.join(", ")
    ))
}

/// Campo `writeOnly` (senha) chega em texto puro: o motor não sabe fazer hash e não pode gravar assim. Só
/// sobe se quem grava a entidade é o sistema (`delegates_writes`, ou o pai de uma filha `with_parent`).
fn check_write_only(entities: &HashMap<String, spec::Entity>, children: &Children, hooks: &dyn Hooks) -> Result<(), String> {
    let mut names: Vec<_> = entities.keys().collect();
    names.sort();
    for name in names {
        let Some(f) = entities[name].fields.iter().find(|f| f.write_only || f.ty == FieldType::File) else {
            continue;
        };
        let writer = children.parent_of(name).unwrap_or(name);
        let (kind, what) = if f.write_only {
            ("writeOnly", "senha")
        } else {
            ("file", "arquivo")
        };
        if f.ty == FieldType::File && writer != name {
            return Err(format!("{name}.{}: type file ainda não vale em filha with_parent", f.name));
        }
        if !hooks.delegates_writes(writer) {
            return Err(format!(
                "{name}.{}: campo {kind} exige escrita delegada (Hooks::delegates_writes(\"{writer}\")); o motor não grava {what}",
                f.name
            ));
        }
        if entities[name].title_field().is_some_and(|t| t.write_only) {
            return Err(format!("{name}: titleField não pode ser writeOnly"));
        }
    }
    Ok(())
}

pub(crate) async fn check_database(store: &dyn Store, entities: &HashMap<String, spec::Entity>, read_only: bool) -> Result<(), String> {
    let mut conn = store.conn().await.map_err(|e| e.to_string())?;
    let regexp = store::scalar_int(&mut *conn, "SELECT 'Á' REGEXP '(?i)á'", &[]).await;
    if regexp.ok().flatten() != Some(1) {
        return Err("a conexão não tem REGEXP; veja como ligar no adaptador do Store (README do c3-engine)".into());
    }
    let fk = store::scalar_int(&mut *conn, "PRAGMA foreign_keys", &[])
        .await
        .map_err(|e| e.to_string())?;
    if fk != Some(1) {
        return Err("PRAGMA foreign_keys está desligado; veja como ligar no adaptador do Store (README do c3-engine)".into());
    }
    if read_only {
        let q = store::scalar_int(&mut *conn, "PRAGMA query_only", &[])
            .await
            .map_err(|e| e.to_string())?;
        if q != Some(1) {
            return Err(
                "modo só leitura com conexão que grava: ligue PRAGMA query_only no adaptador do Store (README do c3-engine)".into(),
            );
        }
    }
    let mut problems = Vec::new();
    let mut names: Vec<_> = entities.keys().collect();
    names.sort();
    for name in names.into_iter().filter(|n| entities[*n].source.is_none()) {
        let entity = &entities[name];
        let columns = store::column_texts(&mut *conn, "SELECT name FROM pragma_table_info(?)", &[SqlValue::Text(name.clone())])
            .await
            .map_err(|e| e.to_string())?;
        if columns.is_empty() {
            problems.push(format!("tabela '{name}' não existe"));
            continue;
        }
        let reserved = match entity.scope {
            Scope::Group => &[][..],
            Scope::Company => &[spec::COMPANY_COL][..],
            Scope::Branch => &[spec::COMPANY_COL, spec::BRANCH_COL][..],
        };
        for col in std::iter::once("id")
            .chain(reserved.iter().copied())
            .chain(entity.fields.iter().map(|f| f.name.as_str()))
        {
            if !columns.iter().any(|c| c == col) {
                problems.push(format!("coluna '{name}.{col}' não existe"));
            }
        }
        problems.extend(org::check_unique_indexes(&mut *conn, entity).await?);
    }
    if problems.is_empty() {
        Ok(())
    } else {
        Err(format!(
            "o banco não bate com as entidades (faltou migration?): {}",
            problems.join("; ")
        ))
    }
}
