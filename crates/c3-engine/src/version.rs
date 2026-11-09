//! Versão do registro (controle otimista, spec/README.md#versão-e-desfazer): `_version` em toda resposta com
//! registro; `If-Match` em alterar, excluir e ação grava só se a versão ainda é a mesma (senão 412 `stale`); e o
//! Desfazer (`C3-Undo: true`) exige a versão e respeita `undoable` e `inverse` da entidade.
//!
//! A versão é um hash do que o usuário vê do registro, então não depende de coluna no banco do sistema e não
//! revela campo escondido por `access`.

use axum::http::request::Parts;
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};

use crate::access;
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::{Entity, FieldType};

/// Chave reservada da versão no registro trafegado.
pub(crate) const KEY: &str = "_version";

/// Hash dos campos que vieram no registro já sem o que o usuário não vê (reference pelo id). O mesmo registro tem a
/// mesma versão na lista, na leitura e na resposta da gravação. Filhas `with_parent` e títulos de reference ficam
/// fora: mudam sem o registro mudar.
pub(crate) fn of_visible(entity: &Entity, record: &Map<String, Value>) -> String {
    let mut h = Sha256::new();
    let mut feed = |name: &str, v: &Value| {
        h.update(name.as_bytes());
        h.update([0]);
        h.update(v.to_string().as_bytes());
        h.update([0]);
    };
    feed("id", record.get("id").unwrap_or(&Value::Null));
    for f in &entity.fields {
        let Some(v) = record.get(&f.name) else { continue };
        let v = if f.ty == FieldType::Reference {
            v.get("id").unwrap_or(&Value::Null)
        } else {
            v
        };
        feed(&f.name, v);
    }
    h.finalize()[..12].iter().map(|b| format!("{b:02x}")).collect()
}

/// Versão de um registro lido do banco (ainda com tudo), como este usuário a recebeu.
pub(crate) fn of(ctx: &Ctx<'_>, entity: &Entity, record: &Map<String, Value>) -> String {
    let mut seen = record.clone();
    access::strip(ctx, entity, &mut seen);
    of_visible(entity, &seen)
}

/// O que o pedido exige do registro: as versões do `If-Match` (vazio = qualquer uma) e se é um Desfazer.
#[derive(Debug, Default)]
pub(crate) struct Expect {
    versions: Vec<String>,
    undo: bool,
}

impl Expect {
    /// Lê `If-Match` (`"v"`, `W/"v"`, lista separada por vírgula, `*` = qualquer) e `C3-Undo`.
    pub(crate) fn from(req: &Parts) -> Result<Self, ApiError> {
        let header = |name: &str| -> Result<Option<&str>, ApiError> {
            req.headers
                .get(name)
                .map(|v| v.to_str().map_err(|_| ApiError::bad_request(format!("Cabeçalho {name} inválido."))))
                .transpose()
        };
        let versions: Vec<String> = header("if-match")?
            .map(|raw| {
                raw.split(',')
                    .map(|t| t.trim().trim_start_matches("W/").trim_matches('"').to_owned())
                    .filter(|t| !t.is_empty() && t != "*")
                    .collect()
            })
            .unwrap_or_default();
        let undo = match header("c3-undo")? {
            None => false,
            Some("true") => true,
            Some(_) => return Err(ApiError::bad_request("C3-Undo só aceita 'true'.")),
        };
        if undo && versions.is_empty() {
            return Err(ApiError::bad_request(
                "Desfazer precisa do If-Match com a _version de depois da gravação.",
            ));
        }
        Ok(Expect { versions, undo })
    }

    /// Desfazer só onde a entidade deixa (`undoable`) e, numa ação, só a inversa de outra (`inverse`).
    pub(crate) fn allow_undo(&self, entity: &Entity, action: Option<&str>) -> Result<(), ApiError> {
        if !self.undo {
            return Ok(());
        }
        if !entity.undoable {
            return Err(ApiError::conflict("Este registro não tem Desfazer.", None));
        }
        if let Some(name) = action {
            if !entity.actions.iter().any(|a| a.inverse.as_deref() == Some(name)) {
                return Err(ApiError::conflict("Esta ação não desfaz nenhuma outra.", None));
            }
        }
        Ok(())
    }

    /// O registro ainda está na versão pedida? Senão 412 `stale`, antes de qualquer outra conferência do registro.
    pub(crate) fn check(&self, ctx: &Ctx<'_>, entity: &Entity, record: &Map<String, Value>) -> Result<(), ApiError> {
        if self.versions.is_empty() || self.versions.contains(&of(ctx, entity, record)) {
            Ok(())
        } else {
            Err(ApiError::stale())
        }
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::spec;

    fn entity() -> Entity {
        let fields = json!([{ "name": "name", "type": "string" }, { "name": "boss", "type": "reference", "entity": "t" }]);
        spec::parse_entity(&json!({ "name": "t", "fields": fields }).to_string()).unwrap().0
    }

    fn rec(v: Value) -> Map<String, Value> {
        v.as_object().unwrap().clone()
    }

    #[test]
    fn versao_muda_com_o_valor_e_ignora_titulo_de_reference_e_chaves_extras() {
        let e = entity();
        let a = of_visible(
            &e,
            &rec(json!({ "id": "1", "name": "Ana", "boss": { "id": "2", "title": "Beto" } })),
        );
        let renamed = rec(json!({ "id": "1", "name": "Ana", "boss": { "id": "2", "title": "Outro" }, "_can": {}, "kids": [] }));
        assert_eq!(a, of_visible(&e, &renamed));
        assert_ne!(
            a,
            of_visible(&e, &rec(json!({ "id": "1", "name": "Ana B", "boss": { "id": "2" } })))
        );
        assert_ne!(a, of_visible(&e, &rec(json!({ "id": "1", "name": "Ana", "boss": null }))));
        assert_ne!(a, of_visible(&e, &rec(json!({ "id": "3", "name": "Ana", "boss": { "id": "2" } }))));
        assert_eq!(a.len(), 24);
    }

    fn parts(headers: &[(&str, &str)]) -> Parts {
        let mut b = axum::http::Request::builder();
        for (k, v) in headers {
            b = b.header(*k, *v);
        }
        b.body(()).unwrap().into_parts().0
    }

    #[test]
    fn if_match_aceita_aspas_fraca_lista_e_asterisco() {
        let e = Expect::from(&parts(&[("if-match", "W/\"a1\", \"b2\"")])).unwrap();
        assert_eq!(e.versions, ["a1", "b2"]);
        assert!(Expect::from(&parts(&[("if-match", "*")])).unwrap().versions.is_empty());
    }

    #[test]
    fn desfazer_exige_versao_e_respeita_undoable_e_inverse() {
        assert_eq!(Expect::from(&parts(&[("c3-undo", "true")])).unwrap_err().code, "bad_request");
        assert_eq!(
            Expect::from(&parts(&[("c3-undo", "sim"), ("if-match", "a")])).unwrap_err().code,
            "bad_request"
        );
        let undo = Expect::from(&parts(&[("c3-undo", "true"), ("if-match", "a")])).unwrap();
        let mut e = entity();
        assert!(undo.allow_undo(&e, None).is_ok());
        assert_eq!(undo.allow_undo(&e, Some("reopen")).unwrap_err().code, "conflict");
        e.undoable = false;
        assert_eq!(undo.allow_undo(&e, None).unwrap_err().code, "conflict");
        assert!(Expect::default().allow_undo(&e, None).is_ok());
    }
}
