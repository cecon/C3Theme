//! O que a ação devolve (spec/README.md, "Arquivo e registro aberto pela ação"): o aviso, o arquivo de uma ação
//! `returns: "file"` (SPED, TXT da balança, CSV) e o registro que a shell abre depois (`open`: a nota criada a
//! partir do XML). O arquivo vai como o próprio corpo da resposta, com `Content-Disposition`, e não em base64
//! dentro do JSON: sem os 33% a mais e sem o arquivo inteiro duas vezes na memória.

use axum::http::{header, HeaderValue};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::{json, Value};

use crate::download::{disposition, encode};
use crate::error::ApiError;
use crate::spec::{Action, Entity};
use crate::{Engine, FileContent};

/// Resultado de uma ação que deu certo.
#[derive(Debug, Default)]
pub struct ActionOutcome {
    /// Aviso para o usuário ("Venda cancelada; NFC-e cancelada na SEFAZ."). Sem ele, a shell usa `successMessage`.
    pub message: Option<String>,
    /// Arquivo que a shell baixa. Só em ação `returns: "file"`; nas outras, o motor responde 500.
    pub file: Option<FileContent>,
    /// Registro que a shell abre depois (o rascunho criado pela ação).
    pub open: Option<OpenRecord>,
}

/// Registro que a shell abre: `/{entity}/{id}`. Sem `entity`, a da própria ação.
#[derive(Debug, Clone)]
pub struct OpenRecord {
    pub entity: Option<String>,
    pub id: String,
}

impl ActionOutcome {
    pub fn message(message: impl Into<String>) -> Self {
        ActionOutcome {
            message: Some(message.into()),
            ..Default::default()
        }
    }

    pub fn file(file: FileContent) -> Self {
        ActionOutcome {
            file: Some(file),
            ..Default::default()
        }
    }

    /// Abre o registro `id` (da entidade da ação, ou de `entity`) depois de rodar.
    pub fn open(mut self, entity: Option<&str>, id: impl Into<String>) -> Self {
        self.open = Some(OpenRecord {
            entity: entity.map(str::to_owned),
            id: id.into(),
        });
        self
    }

    pub fn with_message(mut self, message: impl Into<String>) -> Self {
        self.message = Some(message.into());
        self
    }
}

/// Resposta HTTP da ação.
pub(crate) enum ActionReply {
    Json(Value),
    File { file: FileContent, message: Option<String> },
}

impl ActionReply {
    /// O JSON, para quem não aceita arquivo (lote).
    pub(crate) fn into_json(self) -> Result<Value, ApiError> {
        match self {
            ActionReply::Json(v) => Ok(v),
            ActionReply::File { .. } => Err(ApiError::internal()),
        }
    }
}

impl IntoResponse for ActionReply {
    fn into_response(self) -> Response {
        match self {
            ActionReply::Json(v) => Json(v).into_response(),
            ActionReply::File { file, message } => {
                let mut res = file.data.into_response();
                let h = res.headers_mut();
                let ty = file.content_type.as_deref().unwrap_or("application/octet-stream");
                let ty = HeaderValue::from_str(ty).unwrap_or_else(|_| {
                    eprintln!(
                        "c3-engine: arquivo '{}' com Content-Type inválido '{ty}'; vai como octet-stream",
                        file.name
                    );
                    HeaderValue::from_static("application/octet-stream")
                });
                h.insert(header::CONTENT_TYPE, ty);
                // o navegador não adivinha outro tipo (um .txt do sistema não vira HTML)
                h.insert(header::X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff"));
                if let Ok(v) = HeaderValue::from_str(&disposition(&file.name)) {
                    h.insert(header::CONTENT_DISPOSITION, v);
                }
                // o aviso vai num cabeçalho, em UTF-8 com %XX (cabeçalho só leva ASCII)
                if let Some(Ok(v)) = message.map(|m| HeaderValue::from_str(&encode(&m))) {
                    h.insert("c3-message", v);
                }
                res
            }
        }
    }
}

/// Confere o que o sistema devolveu contra a spec e monta a resposta; `data` é o registro relido (ação de registro).
/// Arquivo em ação sem `returns: "file"` ou `open` para entidade que não existe é erro do sistema: 500.
pub(crate) fn reply(
    engine: &Engine,
    entity: &Entity,
    action: &Action,
    outcome: ActionOutcome,
    data: Option<Value>,
) -> Result<ActionReply, ApiError> {
    build(|e| engine.entity(e).is_ok(), entity, action, outcome, data)
}

fn build(
    known: impl Fn(&str) -> bool,
    entity: &Entity,
    action: &Action,
    outcome: ActionOutcome,
    data: Option<Value>,
) -> Result<ActionReply, ApiError> {
    let ActionOutcome { message, file, open } = outcome;
    let broken = |what: &str| {
        eprintln!("c3-engine: ação {}.{} {what}", entity.name, action.name);
        ApiError::internal()
    };
    if let Some(file) = file {
        if !action.returns_file {
            return Err(broken("devolveu arquivo sem returns: \"file\" na spec"));
        }
        return Ok(ActionReply::File { file, message });
    }
    let mut body = json!({ "message": message });
    if let Some(data) = data {
        body["data"] = data;
    }
    if let Some(o) = open {
        let target = o.entity.unwrap_or_else(|| entity.name.clone());
        if !known(&target) {
            return Err(broken(&format!("pediu para abrir '{target}', que não está no app")));
        }
        body["open"] = json!({ "entity": target, "id": o.id });
    }
    Ok(ActionReply::Json(body))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn action(returns_file: bool) -> (Entity, Action) {
        let entity = Entity::fields_only("product".into(), Vec::new());
        let action = Action {
            name: "go".into(),
            visible_when: None,
            bulk: false,
            together: false,
            list: true,
            input: Entity::fields_only("product.actions.go".into(), Vec::new()),
            grids: Vec::new(),
            prefill: false,
            returns_file,
            preview: false,
            inverse: None,
        };
        (entity, action)
    }

    fn file() -> FileContent {
        FileContent {
            name: "a.txt".into(),
            content_type: None,
            data: b"oi".to_vec(),
        }
    }

    #[test]
    fn arquivo_so_com_returns_file() {
        let (e, a) = action(false);
        assert!(build(|_| true, &e, &a, ActionOutcome::file(file()), None).is_err());
        let (e, a) = action(true);
        assert!(matches!(
            build(|_| true, &e, &a, ActionOutcome::file(file()), None),
            Ok(ActionReply::File { .. })
        ));
    }

    #[test]
    fn open_confere_a_entidade() {
        let (e, a) = action(false);
        let known = |x: &str| x == "product";
        assert!(build(known, &e, &a, ActionOutcome::default().open(Some("nota"), "1"), None).is_err());
        let Ok(ActionReply::Json(v)) = build(known, &e, &a, ActionOutcome::message("ok").open(None, "7"), None) else {
            panic!("esperava JSON");
        };
        assert_eq!(v["open"], json!({ "entity": "product", "id": "7" }));
        assert_eq!(v["message"], "ok");
    }
}
