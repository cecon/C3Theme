//! Pontos de extensão do sistema (`Hooks`) e a requisição que eles recebem.

use axum::http::request::Parts;
use serde_json::{Map, Value};

use crate::{
    ActionCall, ActionOutcome, ApiError, BulkActionCall, Capabilities, ChildWrite, Clock, Conn, FieldErrors, FileCall, FileContent,
    ListActionCall, LookupCall, OrgAccess, PrefillCall, Preview, PreviewCall, SourceCall, SourceSql, WriteCall,
};

/// Requisição em andamento, entregue ao hook `validate`.
pub struct RequestContext<'a> {
    pub req: &'a Parts,
    /// Filial ativa (cabeçalho `C3-Branch`), já conferida contra as filiais permitidas.
    pub active_branch: Option<String>,
    /// Empresa da filial ativa.
    pub active_company: Option<String>,
}

impl RequestContext<'_> {
    /// Autorização de outro usuário (`app.authorization`): os campos que a shell manda no cabeçalho `C3-Authorization`
    /// (JSON em base64) ao reenviar um pedido recusado com um dos códigos. Quem confere a senha e a permissão de quem
    /// libera, e grava a auditoria, é o sistema. Cabeçalho ausente ou malformado: `None`.
    pub fn authorization(&self) -> Option<Map<String, Value>> {
        let raw = self.req.headers.get("c3-authorization")?.to_str().ok()?;
        match serde_json::from_slice(&decode_base64(raw.trim())?).ok()? {
            Value::Object(m) => Some(m),
            _ => None,
        }
    }
}

/// Base64 padrão (com ou sem `=`), sem dependência a mais; caractere inválido devolve `None`.
fn decode_base64(s: &str) -> Option<Vec<u8>> {
    let mut out = Vec::with_capacity(s.len() * 3 / 4);
    let (mut acc, mut bits) = (0u32, 0u32);
    for c in s.bytes().filter(|c| *c != b'=') {
        let v = match c {
            b'A'..=b'Z' => c - b'A',
            b'a'..=b'z' => c - b'a' + 26,
            b'0'..=b'9' => c - b'0' + 52,
            b'+' => 62,
            b'/' => 63,
            _ => return None,
        };
        acc = (acc << 6) | u32::from(v);
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((acc >> bits) as u8);
            acc &= (1 << bits) - 1;
        }
    }
    Some(out)
}

/// Pontos de extensão do sistema. Tudo tem padrão: sem hooks, todo mundo pode tudo
/// (menos rodar ações, que só o sistema sabe executar).
#[async_trait::async_trait]
pub trait Hooks: Send + Sync + 'static {
    /// Filiais que o usuário da requisição enxerga. O motor cruza com o cabeçalho `C3-Branch` e com o
    /// parâmetro `branches`, e aplica o resultado em todo SQL que gera.
    fn org_access(&self, _req: &Parts) -> OrgAccess {
        OrgAccess::all()
    }

    /// Permissões do usuário da requisição (o middleware de autenticação do sistema coloca o usuário em `req.extensions`).
    /// `branch` é a filial em questão: a ativa (metadados, criação, entidade sem escopo) ou a dona do registro.
    /// Sem `organization` no app, vem sempre `None`.
    fn capabilities(&self, _entity: &str, _branch: Option<&str>, _req: &Parts) -> Capabilities {
        Capabilities::ALL
    }

    /// Regras de negócio além do schema. Roda depois da validação do schema, com o registro completo
    /// no formato trafegado (em update, o registro atual com as alterações aplicadas), dentro da mesma
    /// transação da gravação: `conn` enxerga o banco como a gravação vai enxergar. Com `delegates_writes`,
    /// roda antes, sem transação: a regra que precisa de garantia vai também no `write` do sistema.
    async fn validate(
        &self,
        _ctx: &RequestContext<'_>,
        _entity: &str,
        _record: &Map<String, Value>,
        _conn: &mut dyn Conn,
        _errors: &mut FieldErrors,
    ) {
    }

    /// Regras que olham o pai junto com as listas `with_parent` (linhas comparadas entre si, total contra o pai).
    /// Roda depois de `validate` do pai e de cada linha, só quando nada falhou, na mesma conexão. `children`
    /// traz as seções que o corpo enviou como vão ficar: `Create`/`Update` com os valores (o erro de uma linha vai
    /// em `"{entity}.{index}.{campo}"`) e `Delete` com a linha que sai. Seção que não veio fica como está gravada.
    async fn validate_children(
        &self,
        _ctx: &RequestContext<'_>,
        _entity: &str,
        _record: &Map<String, Value>,
        _children: &[ChildWrite],
        _conn: &mut dyn Conn,
        _errors: &mut FieldErrors,
    ) {
    }

    /// Quem grava criar, alterar e excluir da entidade: `false` (padrão) = o motor, pelo `Store`, numa transação
    /// dele; `true` = o sistema, em `write`. Com `true`, o motor faz tudo o que faz no CRUD (permissão, escopo,
    /// schema, references, `validate`) numa conexão de leitura, sem transação, e só então chama `write`.
    fn delegates_writes(&self, _entity: &str) -> bool {
        false
    }

    /// Grava a escrita já validada e devolve o id do registro (o novo, na criação). Volta como erro do
    /// contrato o que só a gravação descobre: `ApiError::conflict` para unicidade (com o campo) ou registro em
    /// uso, `ApiError::not_found` se ele sumiu, `ApiError::validation` para regra conferida na transação.
    /// O motor relê o registro depois, pela mesma leitura do CRUD.
    async fn write(&self, call: WriteCall<'_>) -> Result<i64, ApiError> {
        eprintln!(
            "c3-engine: {} delega a escrita mas o sistema não implementa write ({:?})",
            call.entity, call.op
        );
        Err(ApiError::internal())
    }

    /// Se o usuário pode rodar a ação (`capabilities.actions` em `/_meta` e 403 na rota). `branch` segue a
    /// regra de `capabilities`: a filial dona do registro (ou a ativa). Exige também `read` nessa filial.
    fn action_allowed(&self, _entity: &str, _action: &str, _branch: Option<&str>, _req: &Parts) -> bool {
        true
    }

    /// Se o usuário tem um código de permissão citado no JSON (`access` em campo e seção, `rowAccess` na entidade).
    /// Os códigos são do sistema; o motor não interpreta. `branch` é a filial ativa. Memorizado por requisição.
    fn permitted(&self, _code: &str, _branch: Option<&str>, _req: &Parts) -> bool {
        true
    }

    /// Valor do usuário logado citado em `rowAccess` como `{"$user": chave}` (o id do vendedor, a empresa dele), no
    /// formato trafegado do campo comparado. `None` (ou null): a regra não mostra nenhuma linha.
    fn user_value(&self, _key: &str, _req: &Parts) -> Option<Value> {
        None
    }

    /// Relógio das datas relativas dos filtros (`{"$date": "today"}`, `{"$now": true}`): agora, o fuso do sistema e,
    /// se houver, o dia operacional ("hoje" da loja que fecha o caixa depois da meia-noite). Padrão: UTC.
    fn clock(&self, _req: &Parts) -> Clock {
        Clock::system()
    }

    /// SELECT de uma consulta do sistema (`source: system`) com os parâmetros pedidos: colunas `id` (estável, único
    /// na consulta), uma por campo e, com `scope`, as de empresa e filial. Os `?` casam com `values`. O motor põe o
    /// SELECT no lugar da tabela, com filiais, `where`, busca, ordem e página por fora. Parâmetro entra sempre como `?`
    /// em `values`, nunca concatenado no texto do SQL: o valor vem do usuário.
    async fn source(&self, call: SourceCall<'_>) -> Result<SourceSql, ApiError> {
        eprintln!("c3-engine: {} é source system mas o sistema não implementa source", call.entity);
        Err(ApiError::internal())
    }

    /// Executa a ação, já com permissão, `visibleWhen` e input conferidos pelo motor. É aqui que o sistema
    /// chama a regra de negócio dele (cancelar venda, reemitir nota), com a transação e a auditoria dele.
    /// O motor não segura transação durante a chamada (um escritor próprio travaria no lock do SQLite),
    /// então a regra confere de novo o estado dentro da transação dela. O motor relê o registro depois.
    async fn run_action(&self, call: ActionCall<'_>) -> Result<ActionOutcome, ApiError> {
        eprintln!(
            "c3-engine: ação {}.{} declarada mas sem run_action no sistema",
            call.entity, call.action
        );
        Err(ApiError::internal())
    }

    /// Executa uma ação em conjunto (`bulk: "together"`) uma vez sobre todos os ids: receber vários recebíveis num
    /// movimento só. Tudo ou nada, na transação do sistema: o motor já conferiu cada registro, mas não segura o
    /// estado, então a regra confere de novo (outro usuário pode ter recebido uma parcela no meio). Rodada do
    /// detalhe de um registro, chega com um id só.
    async fn run_bulk_action(&self, call: BulkActionCall<'_>) -> Result<ActionOutcome, ApiError> {
        eprintln!(
            "c3-engine: ação {}.{} com bulk \"together\" declarada mas sem run_bulk_action no sistema",
            call.entity, call.action
        );
        Err(ApiError::internal())
    }

    /// Executa uma ação da lista (`target: list`), sem registro: importar, aplicar modelo. Permissão
    /// (`action_allowed` na filial ativa, com `list` na entidade) e input já conferidos pelo motor.
    async fn run_list_action(&self, call: ListActionCall<'_>) -> Result<ActionOutcome, ApiError> {
        eprintln!(
            "c3-engine: ação de lista {}.{} declarada mas sem run_list_action no sistema",
            call.entity, call.action
        );
        Err(ApiError::internal())
    }

    /// Valores iniciais do input de uma ação `prefill: true` (a grade de contagem com uma linha por forma de
    /// pagamento), no formato trafegado. Permissão, escopo e `visibleWhen` já conferidos; o motor descarta o que o
    /// input não declara. Padrão: nada (o input abre com os `default`).
    async fn action_prefill(&self, _call: PrefillCall<'_>) -> Result<Map<String, Value>, ApiError> {
        Ok(Map::new())
    }

    /// Prévia da ação `preview: true`, antes de confirmar: texto, valores para os campos vazios do input e uma tabela.
    /// O input pode estar pela metade (o que falta vem `null`). Padrão: prévia vazia.
    /// O hook não pode gravar nada: o motor não abre transação na prévia, então nada seria desfeito. Ela roda a cada
    /// campo que o usuário deixa, e o usuário pode cancelar. Calcular com o banco é permitido; gravar, não.
    async fn preview_action(&self, _call: PreviewCall<'_>) -> Result<Preview, ApiError> {
        Ok(Preview::default())
    }

    /// Consulta uma fonte externa (`lookups` da entidade) e devolve os campos para preencher, só os de `fills`,
    /// no formato trafegado (reference como `{ id, title }`). Sem resultado: `ApiError::not_found`; fonte fora
    /// do ar: `ApiError::unavailable`. A falha nunca impede salvar: a tela só deixa de preencher.
    async fn lookup(&self, call: LookupCall<'_>) -> Result<Map<String, Value>, ApiError> {
        eprintln!(
            "c3-engine: consulta {}.{} declarada mas sem lookup no sistema",
            call.entity, call.lookup
        );
        Err(ApiError::internal())
    }

    /// Devolve o arquivo de um campo `file` (download), já com permissão, escopo e acesso ao campo conferidos.
    /// Só é chamado quando a coluna tem metadados (há arquivo). Sumiu do armazenamento: `ApiError::not_found`.
    async fn read_file(&self, call: FileCall<'_>) -> Result<FileContent, ApiError> {
        eprintln!(
            "c3-engine: {}.{} é file mas o sistema não implementa read_file",
            call.entity, call.field
        );
        Err(ApiError::internal())
    }
}

#[cfg(test)]
mod tests {
    use axum::http::Request;

    use super::RequestContext;

    fn ctx_with(value: Option<&str>) -> Option<serde_json::Map<String, serde_json::Value>> {
        let mut req = Request::builder();
        if let Some(v) = value {
            req = req.header("c3-authorization", v);
        }
        let (parts, ()) = req.body(()).unwrap().into_parts();
        RequestContext {
            req: &parts,
            active_branch: None,
            active_company: None,
        }
        .authorization()
    }

    #[test]
    fn le_a_autorizacao_do_cabecalho() {
        // {"usuario":"ana","motivo":"liberação"} em UTF-8 e base64
        let m = ctx_with(Some("eyJ1c3VhcmlvIjoiYW5hIiwibW90aXZvIjoibGliZXJhw6fDo28ifQ==")).unwrap();
        assert_eq!(m["usuario"], "ana");
        assert_eq!(m["motivo"], "liberação");
        assert!(ctx_with(None).is_none());
        assert!(ctx_with(Some("não é base64")).is_none());
        assert!(ctx_with(Some("WzFd")).is_none()); // [1]: não é objeto
    }
}
