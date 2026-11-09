//! O que o sistema diz sobre o usuário: o que ele faz numa entidade e quais filiais enxerga.

use serde::Serialize;

/// O que o usuário atual pode fazer numa entidade (devolvido em `/_meta/entities/{e}` e aplicado no CRUD).
#[derive(Debug, Clone, Copy, Serialize)]
pub struct Capabilities {
    pub list: bool,
    pub read: bool,
    pub create: bool,
    pub update: bool,
    pub delete: bool,
}

impl Capabilities {
    pub const ALL: Capabilities = Capabilities {
        list: true,
        read: true,
        create: true,
        update: true,
        delete: true,
    };
    pub const NONE: Capabilities = Capabilities {
        list: false,
        read: false,
        create: false,
        update: false,
        delete: false,
    };
    pub const READ_ONLY: Capabilities = Capabilities {
        list: true,
        read: true,
        create: false,
        update: false,
        delete: false,
    };
}

/// Filiais que o usuário enxerga (só vale quando o app declara `organization`).
#[derive(Debug, Clone, Default)]
pub struct OrgAccess {
    /// Ids das filiais permitidas; `None` = todas. A matriz é uma filial como as outras: se o usuário
    /// da matriz enxerga as filiais, o sistema devolve a lista já expandida.
    pub branches: Option<Vec<String>>,
    /// Filial sugerida para abrir a sessão (a shell usa quando ainda não escolheu nenhuma).
    pub default_branch: Option<String>,
}

impl OrgAccess {
    pub fn all() -> Self {
        OrgAccess::default()
    }

    pub fn branches(ids: impl IntoIterator<Item = impl Into<String>>) -> Self {
        OrgAccess {
            branches: Some(ids.into_iter().map(Into::into).collect()),
            default_branch: None,
        }
    }

    pub fn default_branch(mut self, id: impl Into<String>) -> Self {
        self.default_branch = Some(id.into());
        self
    }
}
