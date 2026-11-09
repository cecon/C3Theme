# c3-engine

Backend Axum + SQLite do contrato C3 ([`spec/`](../../spec/README.md)). O sistema entrega o banco (por um adaptador), os JSONs da spec e as migrations; o crate entrega `/_meta`, o CRUD genérico, as condições (filtros, `visibleWhen`, `requiredWhen`), a validação e o formato de erro.

Uso completo em [`crates/c3-example`](../c3-example/src/main.rs).

## Banco: `Store` e adaptadores

O núcleo não tem driver SQLite. Ele gera o SQL (dialeto SQLite) e o executa por um `Store`, que o sistema entrega no `Engine::builder(store)`. Assim o motor usa a mesma biblioteca SQLite do sistema: o Cargo só aceita um pacote com `links = "sqlite3"` por binário, e um motor com driver próprio não entra num sistema que usa outra versão.

| Sistema usa   | Dependência                                        | Store                                                                   |
| ------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| sqlx 0.8      | `c3-engine = { git = "...", features = ["sqlx"] }` | `c3_engine::sqlx::SqlxStore::new(pool)`                                 |
| rusqlite 0.40 | `c3-engine` (sem features) e `c3-engine-rusqlite`  | `c3_engine_rusqlite::RusqliteStore::new(conexões)` ou `::open(caminho)` |
| outro driver  | `c3-engine` (sem features)                         | implemente `Store`, `Conn` e `Tx`                                       |

```toml
c3-engine = { git = "https://github.com/cecon/C3Theme" }
c3-engine-rusqlite = { git = "https://github.com/cecon/C3Theme" }
```

- O adaptador rusqlite roda cada chamada em `spawn_blocking`. Com pool próprio (r2d2, bb8), o sistema implementa `Connections` (três linhas, exemplo no [crate](../c3-engine-rusqlite/src/lib.rs)) e chama `c3_engine_rusqlite::prepare(conn)` no init de cada conexão.
- `c3-engine-rusqlite` fica num workspace próprio: sqlx e rusqlite linkam versões diferentes do `libsqlite3-sys`, e um workspace tem um lock só. Quando o sistema mudar a versão do rusqlite, o adaptador muda junto.
- Um `Store` para outro driver implementa três coisas: conexão de leitura, transação `BEGIN IMMEDIATE` (soltar sem `commit` desfaz) e a tradução do erro de unicidade e de chave estrangeira (`StoreErrorKind`).

## Convenções de banco

O crate não cria nem altera tabelas. No boot (`build()`), ele confere que tudo abaixo existe e falha com a lista do que faltou.

| Spec                                                  | Coluna SQLite                                         |
| ----------------------------------------------------- | ----------------------------------------------------- |
| entidade `customer`                                   | tabela `customer`                                     |
| `id` implícito                                        | `id INTEGER PRIMARY KEY` (trafega como string)        |
| `string`, `text`, `email`, `enum`, `date`, `datetime` | `TEXT` (enum com opções inteiras: `INTEGER`)          |
| `integer`                                             | `INTEGER`                                             |
| `decimal` (scale N)                                   | `INTEGER` com o valor × 10^N (`"1234.50"` ↔ `123450`) |
| `boolean`                                             | `INTEGER` 0/1                                         |
| `reference`                                           | `INTEGER REFERENCES alvo (id)`                        |
| `scope: company`                                      | `org_company_id INTEGER NOT NULL`                     |
| `scope: branch`                                       | `org_company_id` e `org_branch_id INTEGER NOT NULL`   |

- Campos `readOnly` (ex.: `created_at`) são preenchidos pelo banco (`DEFAULT`) ou por trigger; o crate não grava neles.
- `datetime` gravado pelo banco precisa sair no formato da spec: `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`.
- `unique` e o comportamento de exclusão vêm das constraints da migration; o crate só traduz a violação em `409 conflict`.
- Com `scope`, todo campo `unique` precisa de índice único em (coluna do escopo, campo), ex.: `UNIQUE (org_branch_id, number)`. O `build()` confere.
- A filial (`organization.branch`) precisa da coluna `org_company_id`. Sugestão: `UNIQUE (org_company_id, id)` na filial e FK composta `(org_company_id, org_branch_id) REFERENCES branch (org_company_id, id)` nas tabelas de filial, para o banco recusar filial de outra empresa. Exemplo em [`0002_org.sql`](../c3-example/migrations/0002_org.sql).
- A conexão precisa de `foreign_keys` ligado e da função `REGEXP` (usada por `contains` e pela busca, com maiúsculas Unicode): no sqlx, crie o pool com `c3_engine::sqlx::sqlite_options(url)`; no rusqlite, `c3_engine_rusqlite::prepare(conn)`. O `build()` confere os dois.

## Hooks

```rust
struct Regras;

#[c3_engine::async_trait]
impl c3_engine::Hooks for Regras {
    // o middleware de autenticação do sistema põe o usuário em req.extensions
    fn org_access(&self, req: &Parts) -> OrgAccess {
        OrgAccess::branches(["1", "2"]).default_branch("1") // padrão: todas as filiais
    }
    fn capabilities(&self, entity: &str, branch: Option<&str>, req: &Parts) -> Capabilities {
        // branch: a filial ativa ou a dona do registro; None sem organization
        Capabilities::ALL
    }
    // roda na mesma transação da gravação, depois da validação do schema
    async fn validate(&self, ctx: &RequestContext<'_>, entity: &str, record: &Map<String, Value>,
                      conn: &mut dyn Conn, errors: &mut FieldErrors) {
        if entity == "customer" && record["vip"] == true && record["company_id"].is_null() {
            errors.add("company_id", "required", "Cliente VIP precisa de empresa.");
        }
    }
    // listas with_parent como vão ficar, depois do validate do pai e de cada linha: regra entre linhas
    async fn validate_children(&self, ctx: &RequestContext<'_>, entity: &str, record: &Map<String, Value>,
                               children: &[ChildWrite], conn: &mut dyn Conn, errors: &mut FieldErrors) {
        // ex.: a soma dos itens não passa do total; erro da linha em "sales_order_item.{index}.quantity"
    }
    // branch segue a regra de capabilities: a filial dona do registro
    fn action_allowed(&self, entity: &str, action: &str, branch: Option<&str>, req: &Parts) -> bool {
        true // ex.: a chave "vendas.cancelar" do perfil do usuário naquela filial
    }
    // permissão, escopo, visibleWhen e input já conferidos; aqui entra o caso de uso do sistema
    async fn run_action(&self, call: ActionCall<'_>) -> Result<ActionOutcome, ApiError> {
        match (call.entity, call.action) {
            ("venda", "cancelar") => {
                vendas::cancelar(call.id, call.input["motivo"].as_str().unwrap()).await?;
                Ok(ActionOutcome::message("Venda cancelada."))
            }
            _ => Err(ApiError::internal()),
        }
    }
}
```

`run_action` e `write` recebem o `Store` do motor (`call.store`) para quem grava por ele. Sistema com escritor próprio, transação e auditoria dele ignora o `Store`. O motor não segura transação durante a ação, então a regra confere de novo o estado dentro da transação dela. Ação declarada sem `run_action` responde 500 e loga o nome.

Com `organization` no `app.json`, o crate resolve por requisição as filiais do usuário (`org_access`) e a filial ativa (`C3-Branch`), e aplica o escopo sozinho em lista, contagem, leitura, alteração, exclusão, título e validação de `reference`. O sistema não escreve filtro de filial.

Gravações do motor (criar, alterar, excluir) rodam numa transação `BEGIN IMMEDIATE`: o registro é lido, validado e gravado sem ninguém mudá-lo no meio, e o filtro de escopo vai no próprio `UPDATE`/`DELETE`.

### Escrita delegada

Sistema que grava tudo por um escritor próprio (outro ORM, auditoria e lançamentos na mesma transação) não deixa o motor gravar. Com `delegates_writes`, o motor continua fazendo a parte do contrato e passa a gravação ao sistema:

```rust
fn delegates_writes(&self, entity: &str) -> bool {
    entity == "titulo" // os outros cadastros o motor grava
}
// permissão, escopo, schema, references e validate já conferidos
async fn write(&self, call: WriteCall<'_>) -> Result<i64, ApiError> {
    match call.op {
        WriteOp::Create => titulos::criar(call.values, call.branch).await,         // devolve o id novo
        WriteOp::Update => titulos::alterar(call.id.unwrap(), call.before, call.values).await,
        WriteOp::Delete => titulos::excluir(call.id.unwrap(), call.before).await,
    }
}
```

- O motor valida numa conexão de leitura, **sem transação**, e solta a conexão antes de chamar `write`: um escritor com pool próprio travaria no lock de escrita do SQLite. O que só a transação garante (unicidade, registro que sumiu, regra do `validate`) o sistema confere de novo e devolve como erro do contrato: `ApiError::conflict` com o campo, `ApiError::not_found`, `ApiError::validation`.
- `values` traz todo campo gravável no formato trafegado (o mesmo do input da ação: reference só o id, campo escondido ou vazio `null`); `before`, o registro como estava, para a auditoria. Na alteração, `values` já é o registro inteiro com o patch aplicado.
- O motor relê o registro depois pela leitura de sempre e responde como no CRUD. O cliente não sabe quem gravou: no `c3-example` o pedido é gravado pelo sistema (com auditoria) e a suíte de conformidade passa igual.
- Delegar sem implementar `write` responde 500 e loga a entidade.
- Filhos `with_parent` (spec, "Filhos gravados junto com o pai") chegam em `call.children`: um `ChildWrite` por seção enviada (`entity`, `field`, `rows`). Cada `ChildRow` traz `op`, `id`, `before`, `values` (sem a coluna do pai) e `index`, que é a posição da linha no corpo. Grave na ordem recebida (excluir, alterar, incluir) e na mesma transação do pai. Na criação, a coluna do pai é o id que o próprio `write` acabou de gerar. Um erro que só a gravação descobre numa linha volta com a chave `"{entity}.{index}.{campo}"`. Exemplo: `crates/c3-example/src/items.rs`.

### Motor só leitura

Quando o motor gravar seria um erro e não uma opção (escritor único, auditoria e lançamentos na transação do sistema), ligue `read_only()` no builder. O `build()` passa a recusar:

- entidade que não delega a escrita (`delegates_writes`); a filha gravada com o pai vai na escrita dele e não precisa;
- conexão do motor sem `PRAGMA query_only`.

```rust
// rusqlite (o mesmo libsqlite3-sys do sistema): c3_engine_rusqlite::prepare_read_only(conn) no init do pool,
// ou RusqliteStore::open_read_only(caminho)
let engine = Engine::builder(RusqliteStore::open_read_only(&caminho)).hooks(Sistema).read_only().app(...).build().await?;
// sqlx: um pool só do motor
let leitura = SqlitePoolOptions::new().connect_with(c3_engine::sqlx::sqlite_options_read_only(&url)?).await?;
```

Com WAL, a leitura do motor não bloqueia o escritor do sistema. O motor monta o SELECT pelos nomes das colunas das entidades e confere todas no boot: uma migração que renomeia coluna derruba o boot com a lista do que falta, nunca lê dado errado em silêncio. O `store` que `run_action` e `write` recebem também é `query_only`: o sistema grava pelo escritor dele.

## Limitações do v0

- Mensagens de erro só em português (o contrato prevê `Accept-Language`).
- Sem concorrência otimista nem agregações (ver "Fora do v0" na spec). Filhos no mesmo save só num nível (sem netos).
- Só SQLite: o SQL gerado é do dialeto SQLite. Postgres entra quando houver um sistema precisando (o `Store` já separa o driver; falta separar o dialeto).

## Testes

`cargo test` (na raiz) roda os testes do núcleo com o adaptador sqlx e os casos de [`spec/v0/conformance/conditions.json`](../../spec/v0/conformance/conditions.json) contra o avaliador Rust. `pnpm conformance` (na raiz) sobe o `c3-example` e roda a suíte HTTP completa.

O adaptador rusqlite tem testes próprios: `cargo test --manifest-path crates/c3-engine-rusqlite/Cargo.toml`.
