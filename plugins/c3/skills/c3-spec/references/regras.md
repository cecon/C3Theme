# Regras: ações, consultas, permissões, filial, desfazer, erros

Resumo. Os detalhes estão no `spec/README.md` do commit instalado, nas seções "Ações", "Consultar e preencher", "Permissões", "Grupo econômico, empresa e filial", "Versão e Desfazer" e "Erros".

## Ações

Cadastro grava pelo CRUD. **Fato de negócio muda por ação**: cancelar venda, reemitir nota, aprovar. Nunca faça isso com um PATCH no campo de situação, porque a ação estorna, chama a SEFAZ e mexe em outras tabelas.

```json
"actions": [
  { "name": "cancel", "label": "Cancelar pedido", "tone": "danger",
    "visibleWhen": { "field": "status", "op": "eq", "value": "open" },
    "input": { "fields": [{ "name": "reason", "type": "text", "label": "Motivo", "required": true, "minLength": 15 }] },
    "successMessage": "Pedido cancelado.", "bulk": true },
  { "name": "approve", "label": "Aprovar", "inverse": "reopen" },
  { "name": "reopen", "label": "Reabrir" },
  { "name": "import_sheet", "label": "Importar planilha", "target": "list",
    "input": { "fields": [{ "name": "sheet", "type": "file", "label": "Planilha", "accept": [".xlsx", ".csv"], "required": true }] } }
]
```

| Tipo               | Rota                                  | Corpo                       | Hook no c3-engine       |
| ------------------ | ------------------------------------- | --------------------------- | ----------------------- |
| de registro        | `POST /{e}/{id}/_actions/{a}`         | o input                     | `run_action`            |
| em lote (`bulk`)   | `POST /{e}/_actions/{a}`              | `{ ids: [1..100], input }`  | `run_action`, uma vez por registro |
| de lista (`target: list`) | `POST /{e}/_actions/{a}`       | `{ input }`                 | `run_list_action`       |

- O `input` tem os mesmos tipos e regras dos campos, mas as condições citam campos do próprio input. Ele não é gravado pelo motor: vai inteiro para o hook. `file` no input chega como veio (base64).
- `visibleWhen` é conferido antes da execução (409 se não vale). Mesmo assim, o sistema confere o estado de novo dentro da transação dele (`UPDATE ... WHERE status = 'open'`), porque o motor não segura transação durante a ação.
- A permissão vem de `capabilities.actions.{nome}` (`Hooks::action_allowed`), na filial dona do registro. Ação exige `read`.
- Sem `input` e sem `confirm`, a ação roda direto. `tone: danger` deixa o botão de confirmar vermelho.
- **Lote**: cada registro passa ou falha sozinho, e o que deu certo não é desfeito.
- **Fila de pendências**: um preset (ex.: `status = rejected`) + item de menu com `"badge": true` + ação `bulk`. A shell marca as linhas, roda a ação e deixa marcadas as que falharam, com o motivo.
- Ação de lista não tem `bulk` nem `visibleWhen`.
- Para fatos que só mudam por ação, deixe a situação `readOnly` e devolva `update`/`delete` falsos em `capabilities`.

## Consultar e preencher

```json
"lookups": [
  { "name": "cep", "field": "zip_code", "fills": ["street", "city", "state"], "trigger": "change" },
  { "name": "cnpj", "field": "cnpj", "fills": ["trade_name"], "trigger": "button", "label": "Consultar na Receita" }
]
```

- `POST /{e}/_lookups/{name}` com `{ "value": "01310100" }` devolve `{ data: { campo: valor } }`, só com campos de `fills`. Quem consulta é o sistema, em `Hooks::lookup` (timeout e cache são dele).
- `trigger: change` consulta quando o campo fica válido (CEP). `button` mostra um botão, para consulta lenta ou paga (CNPJ).
- Só preenche campo vazio ou que ainda tem o valor da consulta anterior. Falha vira aviso e nunca impede salvar. Nada é gravado antes do Salvar.
- Funciona em filha `with_parent`, com a permissão do pai. Não troque um lookup por um widget custom de CEP.

## Permissões

1. **Entidade**: `capabilities` (`list`, `read`, `create`, `update`, `delete`, `actions`) calculadas pelo `Hooks::capabilities`. A shell esconde o que não pode; o backend responde 403 de qualquer jeito.
2. **Campo e seção**: `"access": { "view": "codigo.ver", "edit": "codigo.alterar" }`, com códigos opacos para o motor, respondidos por `Hooks::permitted(código, filial, req)`. Sem `view`, o campo some da leitura, da lista e dos filtros (citá-lo é 400). Sem `edit`, aparece travado, e mudar o valor é `422 forbidden`.
3. **Linha**: `"rowAccess": [{ "permission": "empresa.fornecedor", "where": { ... } }]`. O usuário vê a união dos `where` dos códigos que tem. Regra do usuário logado usa `{ "$user": "seller" }`, respondido por `Hooks::user_value` (só com `eq`, `ne` e `in`; sem valor, a regra não mostra nada).

Ainda não existe: `access` nos campos de uma filha `with_parent`, `rowAccess` na filha, `access` em input de ação.

## Empresa e filial

```json
"organization": { "company": "org_company", "branch": "branch" }
```

| `scope` da entidade | Colunas reservadas                  | Quem vê                              |
| ------------------- | ----------------------------------- | ------------------------------------ |
| `group` (padrão)    | nenhuma                             | todo usuário                         |
| `company`           | `org_company_id`                    | quem acessa alguma filial da empresa |
| `branch`            | `org_company_id` + `org_branch_id`  | quem acessa aquela filial            |

- O escopo é fixo por entidade. Se dois clientes precisam de escopos diferentes, são duas entidades. Não existe "filial vazia = compartilhado".
- O cabeçalho `C3-Branch` é a filial ativa, onde se grava. `?branches=1,2` são as filiais em exibição, só leitura. O backend cruza tudo com as filiais permitidas (`Hooks::org_access`): o sistema não escreve filtro de filial.
- Registro fora do escopo é 404, nunca 403.

## Versão e Desfazer

- Todo registro traz `_version`. `If-Match: "<versão>"` em PATCH, DELETE e ação só grava se ninguém mudou o registro no meio; senão, `412 stale`.
- Desfazer é a gravação de sempre com `C3-Undo: true` e o `If-Match` da versão de depois. Uma ação desfaz com `"inverse": "<outra ação sem input>"`.
- `"undoable": false` na entidade (documento fiscal, título baixado) recusa qualquer Desfazer e proíbe `inverse`.
- O formulário da shell ainda não manda `If-Match`; quem manda é o rascunho do assistente.

## Erros

Formato único, com `message` pronta para o usuário:

```json
{ "error": { "code": "validation_failed", "message": "Alguns campos precisam de atenção.",
  "fields": { "email": [{ "code": "unique", "message": "Já existe um cliente com este e-mail." }] } } }
```

| HTTP | `code`              | Quando                                              |
| ---- | ------------------- | --------------------------------------------------- |
| 400  | `bad_request`       | query, corpo ou condição malformada                 |
| 401  | `unauthorized`      | sem token (a shell volta ao login)                  |
| 403  | `forbidden`         | sem permissão                                       |
| 404  | `not_found`         | não existe ou está fora do escopo                   |
| 409  | `conflict`          | unique, FK impedindo exclusão, `visibleWhen` da ação |
| 412  | `stale`             | `If-Match` com versão velha                         |
| 422  | `validation_failed` | regra do schema ou de negócio, com `fields`         |
| 500  | `internal`          | o resto, sem stack trace                            |

Erro de regra de negócio do sistema volta neste formato (`ApiError::validation`, `ApiError::conflict`), com a chave do campo. Assim a shell mostra o erro no lugar certo.
