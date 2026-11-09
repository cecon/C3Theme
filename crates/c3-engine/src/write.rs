//! Escrita delegada ao sistema (`Hooks::delegates_writes`): o motor valida e confere permissão e escopo como
//! no CRUD, e quem grava criar, alterar e excluir é o sistema, com o escritor, a transação e a auditoria dele.
//! O contrato HTTP não muda: o cliente não sabe quem gravou.

use serde_json::{Map, Value};

use crate::crud::{writable, Owner};
use crate::error::ApiError;
use crate::org::Ctx;
use crate::spec::{Entity, FieldType};
use crate::validation::is_visible;
use crate::{RequestContext, Store};

/// Qual escrita o sistema deve fazer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WriteOp {
    Create,
    Update,
    Delete,
}

/// O que o sistema recebe para gravar.
pub struct WriteCall<'a> {
    pub entity: &'a str,
    pub op: WriteOp,
    /// Id do registro (alterar e excluir; já conferido: existe, está no escopo e o usuário pode mexer nele).
    pub id: Option<i64>,
    /// Registro como estava, no formato trafegado (alterar e excluir), para a auditoria do antes → depois.
    pub before: Option<&'a Map<String, Value>>,
    /// Criar e alterar: todo campo gravável, já validado e no formato trafegado (reference vem só o id;
    /// decimal como no contrato). Campo escondido por `visibleWhen` ou vazio vem `null`. Campo `writeOnly`
    /// (senha) só vem quando chegou valor novo, em texto puro: o hash é do sistema; sem a chave, mantenha o
    /// gravado. Excluir: vazio.
    pub values: &'a Map<String, Value>,
    /// Empresa e filial donas do registro (na criação, as da filial ativa). `None` em entidade sem esse escopo.
    pub company: Option<i64>,
    pub branch: Option<i64>,
    /// Filhos gravados junto com o pai (seções `related` com `save: with_parent`), já validados. Só vem a
    /// seção que o corpo trouxe; no excluir, todos os filhos do registro. Grave na mesma transação do pai.
    pub children: &'a [ChildWrite],
    /// Requisição e filial ativa (o usuário está em `ctx.req.extensions`).
    pub ctx: &'a RequestContext<'a>,
    /// Banco do motor, para o sistema que grava pelo mesmo `Store`. Quem tem escritor próprio ignora.
    pub store: &'a dyn Store,
}

/// Filhos de uma seção `related` com `save: with_parent`.
#[derive(Debug, Clone)]
pub struct ChildWrite {
    /// Entidade filha; também é a chave da lista no corpo e na leitura do pai.
    pub entity: String,
    /// Coluna da filha que aponta para o pai. Na criação do pai, o sistema preenche com o id que acabou de gerar.
    pub field: String,
    /// Excluir, alterar e incluir, nessa ordem (assim uma linha que sai libera o valor `unique` para a que entra).
    pub rows: Vec<ChildRow>,
}

/// Uma linha filha a gravar. Empresa e filial donas são as do pai (`WriteCall::company`/`branch`).
#[derive(Debug, Clone)]
pub struct ChildRow {
    pub op: WriteOp,
    /// Id da linha (alterar e excluir; já conferido: é filha deste pai).
    pub id: Option<i64>,
    /// Posição da linha na lista enviada (alterar e incluir). Erro de uma linha volta em
    /// `fields["{entity}.{index}.{campo}"]`, para a shell marcar a linha certa.
    pub index: Option<usize>,
    /// Linha como estava, no formato trafegado (alterar e excluir).
    pub before: Option<Map<String, Value>>,
    /// Alterar e incluir: campos graváveis da filha, validados, sem a coluna do pai. Excluir: vazio.
    pub values: Map<String, Value>,
}

/// O que vai para o sistema gravar: os campos graváveis, escondido ou vazio como `null`. Campo só de escrita
/// (senha) vem só quando chegou um valor novo; sem a chave, o sistema mantém o gravado. Arquivo: o novo vem
/// com `data`, `null` remove e, sem a chave, fica o gravado.
pub(crate) fn values(entity: &Entity, record: &Map<String, Value>) -> Map<String, Value> {
    writable(entity)
        .filter_map(|f| {
            let v = record.get(&f.name).cloned().unwrap_or(Value::Null);
            let keep = is_visible(entity, f, record) && !crate::value::is_empty(Some(&v));
            match (keep, f.write_only) {
                (false, true) => None,
                (true, _) if f.ty == FieldType::File && !crate::field::file::is_new(&v) => None,
                _ => Some((f.name.clone(), if keep { v } else { Value::Null })),
            }
        })
        .collect()
}

/// Chama o escritor do sistema. O motor não segura conexão nem transação aqui: um escritor com pool
/// próprio travaria no lock de escrita do SQLite. Por isso o sistema confere de novo o que importa
/// (unicidade, registro que sumiu) dentro da transação dele e devolve o erro do contrato.
#[allow(clippy::too_many_arguments)] // um argumento por campo do WriteCall
pub(crate) async fn run(
    ctx: &Ctx<'_>,
    entity: &Entity,
    op: WriteOp,
    id: Option<i64>,
    before: Option<&Map<String, Value>>,
    owner: Owner,
    values: &Map<String, Value>,
    children: &[ChildWrite],
) -> Result<i64, ApiError> {
    let rc = ctx.request_context();
    ctx.engine
        .0
        .hooks
        .write(WriteCall {
            entity: &entity.name,
            op,
            id,
            before,
            values,
            company: owner.company,
            branch: owner.branch,
            children,
            ctx: &rc,
            store: &*ctx.engine.0.store,
        })
        .await
}
