//! Campo travado na alteração (spec/README.md, "Campo travado depois de gravado"): `readOnly` (calculado pelo
//! backend), `createOnly` (código da máquina) e `readOnlyWhen` sobre o registro como está gravado (custo só
//! enquanto o produto não tem custo). Antes, o `readOnly` enviado era descartado em silêncio e o PATCH respondia
//! 200 sem gravar; agora mudá-lo é 422, para o cliente da API saber que nada mudou.
//! A shell manda o registro inteiro no PATCH, então o mesmo valor passa; só mudar é recusado.

use serde_json::{Map, Value};

use crate::access;
use crate::error::{ApiError, FieldErrors};
use crate::org::Ctx;
use crate::spec::{Entity, Field, FieldType};
use crate::value;

/// Confere a alteração `patch` contra o registro gravado `before` (com reference já como id). Os erros vão
/// em `errors` com o `prefix` da linha (`itens.2.`), vazio no pai.
pub(crate) fn check(entity: &Entity, before: &Map<String, Value>, patch: &Map<String, Value>, prefix: &str, errors: &mut FieldErrors) {
    for f in &entity.fields {
        let locked = f.read_only || f.create_only || f.read_only_when.as_ref().is_some_and(|c| c.eval(before, entity));
        let Some(new) = patch.get(&f.name).filter(|_| locked) else {
            continue;
        };
        // senha vazia na alteração mantém a gravada (a leitura sempre traz null)
        if !same(f, new, before.get(&f.name)) && !(f.write_only && value::is_empty(Some(new))) {
            let message = if f.read_only {
                "Este campo é preenchido pelo sistema e não se altera por aqui."
            } else {
                "Este campo não pode mais ser alterado."
            };
            errors.add(&format!("{prefix}{}", f.name), "read_only", message);
        }
    }
}

/// O valor enviado é o mesmo de `old` (vazio é igual a vazio; o resto compara como o banco grava)?
pub(crate) fn same(f: &Field, new: &Value, old: Option<&Value>) -> bool {
    // reference como a leitura devolve ({ id, label }) vale o id: quem reenvia o registro lido não muda nada
    let id = |v: &'_ Value| -> Value {
        match v {
            Value::Object(o) if f.ty == FieldType::Reference => o.get("id").cloned().unwrap_or(Value::Null),
            v => v.clone(),
        }
    };
    let (new, old) = (&id(new), old.map(id));
    let old = old.as_ref();
    match (value::is_empty(Some(new)), value::is_empty(old)) {
        (true, true) => true,
        (false, false) => matches!((value::to_sql(f, new), value::to_sql(f, old.unwrap())), (Ok(a), Ok(b)) if a == b),
        _ => false,
    }
}

/// `check` do registro pai, depois da permissão por campo: qualquer campo travado alterado já é 422.
pub(crate) fn guard(ctx: &Ctx<'_>, entity: &Entity, before: &Map<String, Value>, patch: &Map<String, Value>) -> Result<(), ApiError> {
    access::check_write(ctx, entity, Some(before), patch)?;
    let mut errors = FieldErrors::default();
    check(entity, before, patch, "", &mut errors);
    if errors.is_empty() {
        Ok(())
    } else {
        Err(ApiError::validation(errors))
    }
}
