//! Formato de erro único do contrato (spec/README.md#erros).

use std::collections::BTreeMap;

use axum::http::StatusCode;
use serde::Serialize;
use serde_json::json;

#[derive(Debug, Clone, Serialize)]
pub struct FieldError {
    pub code: &'static str,
    pub message: String,
}

/// Erros por campo, na ordem dos nomes (resposta estável para teste).
#[derive(Debug, Default, Clone)]
pub struct FieldErrors(BTreeMap<String, Vec<FieldError>>);

impl FieldErrors {
    pub fn add(&mut self, field: &str, code: &'static str, message: impl Into<String>) {
        self.0.entry(field.to_owned()).or_default().push(FieldError {
            code,
            message: message.into(),
        });
    }

    pub fn has(&self, field: &str) -> bool {
        self.0.contains_key(field)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// Fica só com os erros cujo código passa; campo sem erro sai.
    pub(crate) fn retain(&mut self, keep: impl Fn(&str) -> bool) {
        for list in self.0.values_mut() {
            list.retain(|e| keep(e.code));
        }
        self.0.retain(|_, list| !list.is_empty());
    }

    pub(crate) fn remove(&mut self, field: &str) {
        self.0.remove(field);
    }

    /// Junta os erros de uma linha filha com o prefixo dela (`items.2.` + `ean`).
    pub(crate) fn absorb(&mut self, prefix: &str, other: FieldErrors) {
        for (k, v) in other.0 {
            self.0.entry(format!("{prefix}{k}")).or_default().extend(v);
        }
    }
}

#[derive(Debug)]
pub struct ApiError {
    pub status: StatusCode,
    pub code: &'static str,
    pub message: String,
    pub fields: Option<FieldErrors>,
    /// Ação em conjunto recusada: o erro de cada registro barrado, na ordem dos ids (`records` na resposta).
    pub records: Vec<(String, ApiError)>,
}

impl ApiError {
    fn new(status: StatusCode, code: &'static str, message: impl Into<String>) -> Self {
        ApiError {
            status,
            code,
            message: message.into(),
            fields: None,
            records: Vec::new(),
        }
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, "bad_request", message)
    }

    pub fn forbidden() -> Self {
        Self::new(StatusCode::FORBIDDEN, "forbidden", "Você não tem permissão para esta ação.")
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, "not_found", message)
    }

    pub fn conflict(message: impl Into<String>, fields: Option<FieldErrors>) -> Self {
        ApiError {
            fields,
            ..Self::new(StatusCode::CONFLICT, "conflict", message)
        }
    }

    /// Operação que a entidade não tem (excluir uma configuração `singleton`): 405.
    pub fn method_not_allowed(message: impl Into<String>) -> Self {
        Self::new(StatusCode::METHOD_NOT_ALLOWED, "method_not_allowed", message)
    }

    /// `If-Match` com uma versão que não é mais a do registro: alguém gravou no meio. 412, nada muda.
    pub fn stale() -> Self {
        Self::new(
            StatusCode::PRECONDITION_FAILED,
            "stale",
            "Este registro mudou depois que você o abriu. Recarregue para ver como ele está.",
        )
    }

    pub fn validation(fields: FieldErrors) -> Self {
        ApiError {
            fields: Some(fields),
            ..Self::new(
                StatusCode::UNPROCESSABLE_ENTITY,
                "validation_failed",
                "Alguns campos precisam de atenção.",
            )
        }
    }

    /// Ação em conjunto (`bulk: "together"`) com registros barrados: 409 e nada roda. Cada um vem com o próprio
    /// erro, para o usuário desmarcar todos de uma vez.
    pub fn refused(total: usize, records: Vec<(String, ApiError)>) -> Self {
        let n = records.len();
        let message = if n == total {
            "Nada foi feito: nenhum dos registros marcados aceita esta ação.".to_string()
        } else {
            format!(
                "Nada foi feito: {n} dos {total} registros marcados não aceita{} esta ação.",
                if n == 1 { "" } else { "m" }
            )
        };
        ApiError {
            records,
            ..Self::new(StatusCode::CONFLICT, "refused", message)
        }
    }

    /// Fonte externa fora do ar ou lenta demais (consulta de CEP/CNPJ): 503, a tela segue sem preencher.
    pub fn unavailable(message: impl Into<String>) -> Self {
        Self::new(StatusCode::SERVICE_UNAVAILABLE, "unavailable", message)
    }

    pub fn internal() -> Self {
        Self::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "internal",
            "Algo deu errado. Tente de novo em instantes.",
        )
    }
}

impl ApiError {
    /// `{ code, message, fields? }`: o `error` da resposta (e de cada item que falhou numa ação em lote).
    pub fn body(&self) -> serde_json::Value {
        let mut error = json!({ "code": self.code, "message": self.message });
        if let Some(fields) = &self.fields {
            error["fields"] = serde_json::to_value(&fields.0).unwrap();
        }
        if !self.records.is_empty() {
            let records: Vec<_> = self.records.iter().map(|(id, e)| json!({ "id": id, "error": e.body() })).collect();
            error["records"] = json!(records);
        }
        error
    }
}
