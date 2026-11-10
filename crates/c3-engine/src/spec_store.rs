//! Entidade lida de outro banco (`"store": "requisicoes"`): o sistema registra o banco com
//! `Engine::builder(...).store_named("requisicoes", store)` e a lista, a busca, os filtros, os totais e o registro
//! aberto leem dali, iguais. O motor só lê desse banco: gravação é 405, e sem ação, filha nem reference (o título de
//! um reference é um JOIN, que não cruza bancos). O registro de requisições num SQLite próprio, por volume e retenção.

use std::collections::HashMap;

use crate::spec::{Entity, FieldType, Scope};
use crate::store::Store;
use crate::Inner;

/// O que a entidade de outro banco não pode ter, porque o motor só lê dali e não junta bancos.
pub(crate) fn check_entity(e: &Entity) -> Result<(), String> {
    let Some(store) = &e.store else { return Ok(()) };
    let bad = |why: &str| Err(format!("{}.store '{store}': {why}", e.name));
    if store.is_empty() || !store.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_') {
        return bad("nome do banco em minúsculas, dígitos e _");
    }
    if e.source.is_some() || e.singleton || !e.actions.is_empty() {
        return bad("só leitura: sem source, singleton nem ações");
    }
    if e.scope != Scope::Group {
        return bad("scope 'group' (empresa e filial moram no banco do app)");
    }
    if let Some(f) = e.fields.iter().find(|f| matches!(f.ty, FieldType::Reference | FieldType::File)) {
        return bad(&format!("campo '{}': reference e file não cruzam bancos", f.name));
    }
    Ok(())
}

/// Subida dos bancos a mais: a spec bate com os registrados e cada banco tem as tabelas das entidades dele.
pub(crate) async fn check_stores(entities: &HashMap<String, Entity>, stores: &HashMap<String, Box<dyn Store>>) -> Result<(), String> {
    check_app(entities, stores)?;
    for (name, store) in stores {
        crate::boot::check_database(&**store, entities, true, Some(name)).await?;
    }
    Ok(())
}

/// Cada `store` citado precisa estar registrado, e ninguém aponta para uma entidade de outro banco.
pub(crate) fn check_app(entities: &HashMap<String, Entity>, stores: &HashMap<String, Box<dyn Store>>) -> Result<(), String> {
    for e in entities.values() {
        if let Some(s) = e.store.as_ref().filter(|s| !stores.contains_key(*s)) {
            return Err(format!("{}.store '{s}': banco não registrado (.store_named(\"{s}\", ...))", e.name));
        }
        for f in &e.fields {
            if let Some(t) = f.reference.as_ref().filter(|t| entities.get(*t).is_some_and(|x| x.store.is_some())) {
                return Err(format!(
                    "{}.{}: '{t}' é lida de outro banco e não pode ser referenciada",
                    e.name, f.name
                ));
            }
        }
    }
    Ok(())
}

/// Gravação numa entidade de outro banco: 405, o motor só lê dali.
pub(crate) fn guard_writes(e: &Entity) -> Result<(), crate::error::ApiError> {
    match e.store {
        Some(_) => Err(crate::error::ApiError::method_not_allowed("Lida de outro banco: só leitura.")),
        None => Ok(()),
    }
}

impl Inner {
    /// O banco de onde a entidade é lida: o dela (`store`) ou o do app.
    pub(crate) fn store_of(&self, e: &Entity) -> &dyn Store {
        match e.store.as_ref().and_then(|s| self.stores.get(s)) {
            Some(s) => &**s,
            None => &*self.store,
        }
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::spec::parse_entity;

    fn entity(extra: serde_json::Value) -> Result<Entity, String> {
        let mut raw = json!({ "name": "log", "store": "logs", "fields": [{ "name": "path", "type": "string" }] });
        raw.as_object_mut().unwrap().extend(extra.as_object().unwrap().clone());
        parse_entity(&raw.to_string()).map(|(e, _)| e)
    }

    #[test]
    fn so_leitura_sem_cruzar_bancos() {
        assert!(entity(json!({})).is_ok());
        for (extra, why) in [
            (json!({ "store": "Logs" }), "minúsculas"),
            (json!({ "singleton": true }), "só leitura"),
            (json!({ "scope": "company" }), "scope"),
            (json!({ "fields": [{ "name": "a", "type": "file" }] }), "não cruzam"),
        ] {
            let err = entity(extra).err().unwrap_or_else(|| panic!("{why} deveria ser recusado"));
            assert!(err.contains(why), "{err}");
        }
    }

    #[test]
    fn banco_registrado_e_ninguem_aponta() {
        let log = entity(json!({})).unwrap();
        let mut all = HashMap::from([("log".to_owned(), log.clone())]);
        let err = check_app(&all, &HashMap::new()).unwrap_err();
        assert!(err.contains("não registrado"), "{err}");
        let (mut other, _) =
            parse_entity(&json!({ "name": "x", "fields": [{ "name": "l", "type": "reference", "entity": "log" }] }).to_string()).unwrap();
        other.store = None;
        all.insert("x".into(), other);
        let mut stores: HashMap<String, Box<dyn Store>> = HashMap::new();
        stores.insert("logs".into(), Box::new(Fake));
        let err = check_app(&all, &stores).unwrap_err();
        assert!(err.contains("não pode ser referenciada"), "{err}");
        assert!(guard_writes(&log).is_err());
    }

    struct Fake;

    #[async_trait::async_trait]
    impl Store for Fake {
        async fn conn(&self) -> Result<Box<dyn crate::store::Conn>, crate::store::StoreError> {
            unimplemented!()
        }
        async fn begin(&self) -> Result<Box<dyn crate::store::Tx>, crate::store::StoreError> {
            unimplemented!()
        }
    }
}
