//! Download de arquivo: `GET /{entity}/{id}/_files/{field}` (spec/README.md#arquivo). O motor confere
//! permissão, escopo e o campo (como na leitura do registro); os bytes vêm do sistema (`Hooks::read_file`).

use axum::http::request::Parts;
use serde_json::Value;

use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::FieldType;
use crate::{Engine, RequestContext};

/// O que o sistema recebe para devolver o arquivo de um campo.
pub struct FileCall<'a> {
    pub entity: &'a str,
    /// Id do registro, como veio na URL (já conferido: existe, está no escopo e o usuário lê o campo).
    pub id: &'a str,
    pub field: &'a str,
    pub ctx: &'a RequestContext<'a>,
}

/// O arquivo como o sistema guardou.
#[derive(Debug, Clone)]
pub struct FileContent {
    pub name: String,
    pub content_type: Option<String>,
    pub data: Vec<u8>,
}

pub(crate) async fn run(engine: &Engine, req: &Parts, name: &str, id: &str, field: &str) -> Result<FileContent, ApiError> {
    // a leitura do registro já confere entidade, permissão, escopo e tira o campo que o usuário não vê
    let record = crate::crud::read(engine, req, name, id).await?;
    let entity = engine.entity(name)?;
    if !entity.field(field).is_some_and(|f| f.ty == FieldType::File) {
        return Err(ApiError::not_found(format!("'{field}' não é um campo de arquivo.")));
    }
    if !matches!(record.get(field), Some(Value::Object(_))) {
        return Err(ApiError::not_found("Sem arquivo."));
    }
    let ctx = Ctx::new(engine, req).await?;
    let rc = ctx.request_context();
    let call = FileCall {
        entity: name,
        id,
        field,
        ctx: &rc,
    };
    engine.0.hooks.read_file(call).await
}

/// `Content-Disposition` com o nome em UTF-8 (RFC 6266): baixa com o nome original, acento incluído.
pub(crate) fn disposition(name: &str) -> String {
    format!("attachment; filename*=UTF-8''{}", encode(name))
}

/// UTF-8 com %XX em tudo que não é letra, dígito, `.`, `-` ou `_` (o `decodeURIComponent` do navegador desfaz).
pub(crate) fn encode(text: &str) -> String {
    text.bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'.' | b'-' | b'_' => (b as char).to_string(),
            _ => format!("%{b:02X}"),
        })
        .collect()
}
