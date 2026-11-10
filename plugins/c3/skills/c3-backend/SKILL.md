---
name: c3-backend
description: Liga o motor C3 a um backend Rust/Axum com o crate c3-engine - Store (sqlx ou rusqlite), migrations nas convenções do motor, Hooks (permissão, filial, validação, ações, lookups, arquivos), escrita delegada e modo só leitura. Use ao montar ou mudar o engine.router(), escrever migration de uma entidade do C3, implementar um hook ou investigar erro do build() do c3-engine.
---

# Backend com o c3-engine

O crate entrega `/_meta`, o CRUD genérico, condição → SQL, validação, escopo de filial e o formato de erro. O sistema entrega o banco (por um adaptador), as migrations, os JSONs da spec, a autenticação e as regras de negócio (Hooks). O crate **não cria nem altera tabela**.

Antes de tudo, confira o commit do `c3-engine` no `Cargo.lock` e leia `crates/c3-engine/README.md` e o `src/hooks.rs` daquele commit. A assinatura de um hook muda entre versões, e esta skill descreve a `main`.

## Dependência: escolha o adaptador do driver que o sistema já usa

| O sistema usa | Cargo.toml                                                                               | Store                                           |
| ------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| sqlx 0.8      | `c3-engine = { git = "https://github.com/cecon/C3Theme", features = ["sqlx"] }`          | `c3_engine::sqlx::SqlxStore::new(pool)`         |
| rusqlite 0.40 | `c3-engine = { git = "..." }` + `c3-engine-rusqlite = { git = "..." }`                    | `c3_engine_rusqlite::RusqliteStore::open(path)` |
| outro driver  | `c3-engine` sem features                                                                 | implemente `Store`, `Conn` e `Tx`               |

O Cargo aceita só um `links = "sqlite3"` por binário. Por isso **não ligue a feature `sqlx` num sistema rusqlite** (nem o contrário): o build quebra no `libsqlite3-sys`.

```rust
let pool = SqlitePoolOptions::new().connect_with(c3_engine::sqlx::sqlite_options(&url)?).await?;
sqlx::migrate!().run(&pool).await?;              // migrations são do sistema
let engine = c3_engine::Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
    .app(include_str!("../c3/app.json"))
    .entity(include_str!("../c3/product.json"))  // uma linha por entidade, filhas inclusive
    .hooks(Regras)
    .build()
    .await?;                                     // falha listando o que não bate entre JSON e banco
let app = Router::new().nest("/api", engine.router()).layer(auth);
```

- A conexão precisa de `foreign_keys` e da função `REGEXP`: use `c3_engine::sqlx::sqlite_options(url)` ou `c3_engine_rusqlite::prepare(conn)` no init do pool. O `build()` confere.
- Portas opcionais no builder: `.notifications(..)` (sino, trait `Notifications`) e `.search(..)` (Ctrl K com `header.search: { "records": true }`, trait `Search`: devolva só o que o usuário pode abrir). Sem elas, as rotas respondem 404 e a shell segue sem o recurso.
- `GET /_meta/login` precisa ficar **fora** da camada de autenticação (a shell desenha o login antes de haver usuário). O resto do `/_meta` exige token.

## Convenções de banco (o build() confere)

| Spec                                      | Coluna SQLite                                              |
| ----------------------------------------- | ---------------------------------------------------------- |
| entidade `product`                        | tabela `product`                                           |
| `id` implícito                            | `id INTEGER PRIMARY KEY`                                   |
| `string`, `text`, `email`, `date`, `datetime`, enum de texto | `TEXT`                  |
| `integer`, `boolean`, `flags`, enum inteiro | `INTEGER`                                                |
| `decimal` com `scale: N`                  | `INTEGER` com o valor × 10^N (`"12.50"` ↔ `1250`)          |
| `reference`                               | `INTEGER REFERENCES alvo (id)`                             |
| `file`                                    | `TEXT` com os metadados em JSON, gravados pelo sistema     |
| `scope: company`                          | `org_company_id INTEGER NOT NULL`                          |
| `scope: branch`                           | `org_company_id` e `org_branch_id INTEGER NOT NULL`        |

- Campo `readOnly` (`created_at`) é preenchido por `DEFAULT` ou trigger. `datetime` gravado pelo banco: `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`.
- `unique` na spec precisa do índice único na migration. Com `scope`, o índice inclui a coluna do escopo: `UNIQUE (org_branch_id, number)`.
- Nunca guarde `decimal` como `REAL` (perde precisão) nem como `TEXT` (`"10.00" < "9.00"`).

## Hooks: onde cada regra entra

Tudo tem padrão: sem hooks, todo mundo pode tudo, menos rodar ação.

| Hook                                  | Responde                                                          |
| ------------------------------------- | ----------------------------------------------------------------- |
| `org_access(req)`                     | filiais que o usuário enxerga e a padrão (`OrgAccess::branches`)  |
| `capabilities(entity, branch, req)`   | list/read/create/update/delete da entidade naquela filial         |
| `action_allowed(entity, action, branch, req)` | se pode rodar a ação (filial dona do registro)            |
| `permitted(code, branch, req)`        | códigos de `access` e `rowAccess` (memorizado por requisição)     |
| `user_value(key, req)`                | valor de `{ "$user": key }` no `rowAccess`                        |
| `validate(ctx, entity, record, conn, errors)` | regra de negócio de um registro, na transação da gravação |
| `validate_children(...)`              | regra entre linhas `with_parent` (soma dos itens, ordem)          |
| `delegates_writes(entity)` + `write(call)` | o sistema grava pelo escritor dele                           |
| `run_action(call)` / `run_list_action(call)` | executa a ação de registro (e em lote) e a de lista        |
| `lookup(call)`                        | consulta CEP, CNPJ etc. e devolve os campos de `fills`            |
| `read_file(call)`                     | bytes de um campo `file` para o download                          |

- O usuário chega pelo middleware de autenticação do sistema, em `req.extensions`. O motor não guarda usuário nem perfil.
- Erro de regra volta no formato do contrato: `errors.add("campo", "codigo", "Mensagem pronta para o usuário.")` no `validate`; `ApiError::validation(fields)`, `ApiError::conflict(msg, Some(fields))`, `ApiError::not_found(msg)`, `ApiError::unavailable(msg)` (fonte fora do ar) nos outros. Linha filha usa a chave `"sales_order_item.{index}.campo"`.
- O motor **não segura transação** durante `run_action` nem `write`. Confira de novo o estado dentro da sua transação (`UPDATE ... WHERE status = 'open'` e veja as linhas afetadas), senão duas pessoas cancelam a mesma venda.
- O escopo de filial é aplicado pelo motor em todo SQL que ele gera. Não escreva filtro de filial; dentro de `run_action`, porém, o SQL é seu, e a filial vem em `call`.

## Escrita delegada e modo só leitura

Use `delegates_writes` quando o sistema já tem escritor único, auditoria ou lançamentos na mesma transação. Ele é obrigatório para entidade com `writeOnly` (o motor não faz hash de senha) ou com `file`.

- O motor valida (schema, references, escopo, `validate`) numa conexão de leitura **sem transação** e solta a conexão antes de chamar `write`. Unicidade e registro que sumiu, o sistema confere de novo e devolve como `ApiError`.
- `call.values` traz todo campo gravável no formato trafegado (reference só o id, decimal em string). `call.before` traz o registro anterior, para a auditoria. Na alteração, `values` já tem o patch aplicado.
- Filhos `with_parent` chegam em `call.children`. Grave na ordem recebida (excluir, alterar, incluir) e na mesma transação do pai. Exemplo: `crates/c3-example/src/items.rs`.
- `.read_only()` no builder faz o `build()` recusar entidade que não delega e conexão sem `PRAGMA query_only` (`c3_engine_rusqlite::prepare_read_only` / `RusqliteStore::open_read_only`, ou `c3_engine::sqlx::sqlite_options_read_only`). É o modo do Nati: o motor só lê e toda escrita passa pelo Diesel dele. Com WAL, a leitura não bloqueia o escritor.

## Assistente no chat (servidor)

Antes de mandar uma parte de tela ao chat, `engine.check_agent_part(&part)`; se der `Err`, troque por texto. Na resposta de um `c3.form`, `engine.check_agent_answer(&payload, &values)`. Para manter uma pendente por conversa: `supersede_agent_parts(&mut parts)` e `check_agent_reply(&part, action, version)`. Detalhes na skill `c3-chat`.

## Testar

- `build()` é o primeiro teste: suba o binário e leia a lista de erros.
- `cargo test` do sistema, com banco temporário, cobrindo os hooks (permissão negada, regra de negócio, ação com estado errado).
- `pnpm conformance` do C3Theme testa a implementação do contrato contra o CRM de exemplo, não o seu sistema. Rodá-lo contra o seu backend vai falhar por causa das entidades.
- Confira à mão: lista com filtro, criar com erro de validação, alterar sem permissão (403), registro de outra filial (404).
