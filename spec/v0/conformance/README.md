# Conformidade

`pnpm conformance` sobe o `crates/c3-example` num banco novo e roda `packages/conformance` duas vezes no mesmo banco (a suíte precisa ser repetível). Outro backend que sirva o CRM de exemplo roda a mesma suíte com `node packages/conformance/src/cli.mjs <url-da-api>`.

- [`conditions.json`](conditions.json): casos da linguagem de condição; rodam na shell (TS), no `spec:check` e no `cargo test`.
- [`relative-dates.json`](relative-dates.json): `$date` e `$now` com relógio, fuso e dia operacional fixos; rodam no `cargo test` e no adaptador em memória do `@c3theme/engine`.
- [`documents.json`](documents.json): CPF e CNPJ (`format`), inclusive o CNPJ alfanumérico; rodam no `spec:check` (validador da shell) e no `cargo test`.

## Dados e usuários fixos do escopo (empresa e filial)

Os testes do grupo `escopo` contam com isto já no banco do backend testado (no `c3-example`, a migration `0002_org.sql`):

| Empresa (`org_company`) | Filiais (`branch`)           |
| ----------------------- | ---------------------------- |
| 1 Alfa Combustíveis     | 1 Alfa Matriz, 2 Alfa Centro |
| 2 Beta Conveniência     | 3 Beta Loja 1                |

E com estes usuários, identificados por `Authorization: Bearer <nome>`:

| Usuário           | Filiais | Permissões                                                                                           | Filial padrão |
| ----------------- | ------- | ---------------------------------------------------------------------------------------------------- | ------------- |
| sem Authorization | todas   | tudo                                                                                                 | 1             |
| `ana`             | 1, 2    | tudo na 1; na 2 só leitura, e nenhum acesso a `seller`                                               | 1             |
| `beto`            | 3       | tudo                                                                                                 | 3             |
| `caio`            | todas   | tudo, mas dos códigos de permissão só `empresa.cliente` e `empresa.propria`; `caio@7` é da empresa 7 | 1             |

O que a suíte confere: filial ativa (`C3-Branch`) conferida contra as permitidas; criação na filial ativa; registro de outra filial responde 404 em ler, alterar e excluir; lista e `total` só com as filiais pedidas e permitidas; `_can` por linha; `reference` para registro invisível (`not_found`) ou de outra filial (`out_of_scope`); título de `reference` ilegível vem `null`; `unique` por filial; `scope: company`.
