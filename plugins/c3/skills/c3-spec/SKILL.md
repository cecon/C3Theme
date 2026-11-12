---
name: c3-spec
description: Escreve e corrige as telas de um sistema no motor C3 em JSON (app.json e entidades da spec v0) - campos, listas, formulários, abas, mestre-detalhe, quadro, calendário, painel, ações, permissões, consultas de CEP/CNPJ. Use ao criar ou mudar um JSON de entidade ou de app do C3, ao decidir entre JSON e tela React custom, ou ao corrigir erro do spec:check ou do boot do c3-engine.
---

# Telas do C3 em JSON

O sistema descreve as telas em JSON e a shell React (`@c3theme/engine`) monta tudo: menu, lista, formulário, detalhe, ações. O backend (`c3-engine` em Rust) lê os mesmos JSONs e garante as regras no servidor. Cada sistema continua dono do banco, das migrations, da autenticação e das regras de negócio.

## Antes de escrever

1. **Descubra a versão instalada.** Os pacotes entram por git, presos a um commit: `github:cecon/C3Theme#<sha>&path:packages/engine` no `package.json` e `git+https://github.com/cecon/C3Theme#<sha>` no `Cargo.lock`. Esta skill descreve a `main`. Um recurso que ainda não existe no commit instalado não funciona, e o boot recusa a chave. Front e backend precisam estar no mesmo commit.
2. **Quem decide é o schema, não esta skill.** Na dúvida sobre o nome de uma chave, leia `spec/v0/entity.schema.json` e `spec/v0/app.schema.json` daquele commit, e o `spec/README.md` para entender o porquê. Para ler sem clonar: `gh api repos/cecon/C3Theme/contents/spec/README.md?ref=<sha> -H "Accept: application/vnd.github.raw"`.
3. **Veja onde o sistema guarda os JSONs** (no `c3-example` eles ficam numa pasta e entram com `include_str!`). Siga o padrão que já existe: um arquivo por entidade e o nome da entidade igual ao da tabela.

## A escada: JSON primeiro, código por último

Suba um degrau só quando o de baixo não resolve:

1. **Convenção.** Entidade sem `views` já ganha lista e formulário.
2. **View.** `columns`, `search`, `filters`, `presets`, `sections`, `rows`, `tab`, `related`.
3. **Recurso declarado.** Ação, `lookup`, `access`, `visibleWhen`, quadro, calendário, painel (tabela abaixo).
4. **Widget de um campo ou de uma coluna.** `{ "field": "placa", "component": "placa-input" }` só naquela view.
5. **Seção custom.** Uma seção com `component` (recebe `record`, `onChange`, `editing`, `errors`, `id`, `dirty`).
6. **Página registrada.** `pages[].component` + `config` validado pelo `components/<nome>.schema.json`, para o que não é cadastro e nenhum degrau resolve (PDV com TEF). O que varia por loja vai no `config`, não no código. Relatório tabular é `views.report`, com parâmetros pela consulta do sistema.

**Por quê:** cada degrau acima é código que o sistema mantém sozinho, que não ganha as melhorias da shell e que costuma sair com outro visual. O erro mais comum já visto foi um campo custom com markup Bootstrap (`<label>` em cima, `<select>` nativo com "— Escolha —") no lugar de um `reference` comum. A tela ficou com dois visuais e perdeu busca, cadastro rápido e validação.

## Preciso de... → use

| Preciso de                                           | Use                                                                                  | Detalhe                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Escolher um registro de outra tabela                 | `type: reference` + `entity` (opções filtradas: `filter`, com `{ "$field": "x" }`)   | [campos](references/campos.md#reference)                     |
| Lista fixa de valores                                | `enum` com `options[].value` **igual ao que o banco grava**; cor do selo em `color`  | [campos](references/campos.md#enum-e-flags)                  |
| Vários dias, canais (bits)                           | `flags`                                                                              | [campos](references/campos.md#enum-e-flags)                  |
| Dinheiro, quantidade                                 | `decimal` + `scale` (trafega string `"12.50"`); dinheiro ganha `currency: "BRL"`     | [campos](references/campos.md#tipos-e-formato-trafegado)     |
| CPF/CNPJ/telefone                                    | `string` + `format: cpf \| cnpj \| cpf_cnpj \| phone` (sem máscara no fio)          | [campos](references/campos.md#regras-por-campo)              |
| Senha, PIN                                           | `writeOnly: true` (exige escrita delegada no backend)                                | [campos](references/campos.md#regras-por-campo)              |
| Anexo                                                | `type: file` (exige escrita delegada; até 1 MB)                                      | [campos](references/campos.md#regras-por-campo)              |
| Campo que aparece ou é exigido conforme outro        | `visibleWhen` / `requiredWhen`                                                       | [campos](references/campos.md#condições)                     |
| Campo que não muda depois de gravado                 | `createOnly` ou `readOnlyWhen` (olha o registro gravado)                             | [campos](references/campos.md#regras-por-campo)              |
| CEP preenche endereço, CNPJ preenche razão social    | `lookups` na entidade + `Hooks::lookup`                                              | [regras](references/regras.md#consultar-e-preencher)         |
| Filtros prontos e itens de menu filtrados            | `views.list.presets` + `{ "entity", "preset" }` no menu                              | [telas](references/telas.md#lista-e-menu)                    |
| Fila de pendências com contador                      | preset + item de menu com `"badge": true` + ação `bulk`                              | [regras](references/regras.md#ações)                         |
| Cadastro grande                                      | `tab` nas seções                                                                     | [telas](references/telas.md#formulário)                      |
| Seções lado a lado, total do item e resumo da fatura | `width` na seção, `computed` na lista, `summary` na seção (só exibição)              | [telas](references/telas.md#formulário)                      |
| Filhos com CRUD próprio (clientes da empresa)        | seção `related` (`save: separately`, o padrão)                                       | [telas](references/telas.md#mestre-detalhe)                  |
| Itens que só existem no pai (itens do pedido)        | `related` + `save: with_parent` (uma transação)                                      | [telas](references/telas.md#mestre-detalhe)                  |
| Registro 1:1 (dados fiscais, endereço de entrega)    | `with_parent` + `maxItems: 1`                                                        | [telas](references/telas.md#mestre-detalhe)                  |
| N:N de marcar (permissões do perfil)                 | `with_parent` + `display: checklist` + `option`                                      | [telas](references/telas.md#mestre-detalhe)                  |
| Kanban / agenda                                      | `views.board` / `views.calendar`                                                     | [telas](references/telas.md#quadro-calendário-e-painel)      |
| Relatório agrupado com subtotais e impressão         | `views.report` (groupBy, subtotals, tree)                                            | [telas](references/telas.md#quadro-calendário-e-painel)      |
| Planta (mesas, pista, setor do KDS) e tempo real     | `views.map` (position ou groupBy, color) + `live` na entidade                        | [telas](references/telas.md#quadro-calendário-e-painel)      |
| Indicadores e gráficos                               | `pages[].dashboard` (kpi, chart, list, alert, filters)                              | [telas](references/telas.md#quadro-calendário-e-painel)      |
| Cancelar, reemitir, aprovar (fato de negócio)        | `actions` (nunca um `PATCH` no campo de situação)                                    | [regras](references/regras.md#ações)                         |
| Comando sem registro (importar planilha)             | ação com `target: list`                                                              | [regras](references/regras.md#ações)                         |
| Esconder ou travar campo, aba ou linhas por perfil   | `access`, `rowAccess` + `Hooks::permitted`                                           | [regras](references/regras.md#permissões)                    |
| Empresa e filial                                     | `organization` no app + `scope` na entidade                                          | [regras](references/regras.md#empresa-e-filial)              |
| Desfazer                                             | `inverse` na ação, `undoable: false` para documento fiscal                           | [regras](references/regras.md#versão-e-desfazer)             |
| Login                                                | `auth` no app.json + `AuthPort` no front                                             | [telas](references/telas.md#app-layout-e-login)              |

**Toda tela é JSON, sem exceção** ([ADR 0003](../../../../docs/adr/0003-motor-sem-excecoes.md)). Se nenhum degrau resolve, diga ao usuário que é uma lacuna do motor, abra a issue `lacuna: <o que falta>` no `cecon/C3Theme` com o caso real e use o degrau mais baixo que funcione até ela fechar, citando a issue no código. Os degraus 4 a 6 (widget, seção custom, página registrada) só valem com a issue aberta. Não esconda uma tela em TS nem crie um custom genérico para contornar a spec.

Não existe na spec v0 (então é lacuna: degrau custom com aviso, ou espera): gatilho de formulário ("ao escolher o cliente, preencher a condição"), campo calculado gravado (a fórmula do `summary` só mostra; o total gravado é regra do backend), netos (filho de filho `with_parent`), média, dois agrupamentos ou comparação entre períodos no painel, `access` nos campos de uma filha `with_parent`, operador de bit (`has`) em filtro de `flags`. Antes de contornar, confira na seção "Fora do v0" do `spec/README.md` do commit instalado, porque essa lista encolhe.

## Fluxo

1. Escreva ou altere o JSON. Comece de um exemplo: [examples/](examples) é um cadastro de produtos de ERP completo e validado (abas, `with_parent`, `lookup`, ações em lote e de lista, preset com `defaults`, `readOnlyWhen`).
2. Escreva a migration junto. Coluna nova sem migration derruba o boot. Veja as convenções de coluna na skill `c3-backend`.
3. Valide a pasta: num clone do C3Theme no mesmo commit, `pnpm install` e depois `node scripts/validate-spec.mjs <pasta-com-app.json>`. Ele confere o schema e as referências cruzadas: campo citado existe, operador vale para o tipo, preset do menu existe, valor de enum está em `options` etc.
4. Suba o backend. O `build()` do c3-engine confere o JSON contra o banco e lista tudo o que falta.
5. Abra a tela e teste o caminho feliz e um erro de validação.

## Armadilhas

- **`id` é sempre string** no JSON, e campo vazio vem `null`, nunca ausente.
- **`decimal` trafega string** (`"1234.50"`) e fica gravado como inteiro escalado no SQLite. Número JavaScript perde centavo.
- **`datetime` é UTC, com segundos e `Z`** (`"2026-10-17T02:55:17Z"`), sem fração e sem fuso.
- **`enum.value` é o valor exato do banco** (`"SEM BALANCA"`, `5102`). Não existe chave separada; o texto da tela é o `label`.
- **`reference` grava o id e lê `{ id, title }`.** O `title` vem do `titleField` da entidade apontada.
- **`minItems`, `maxItems`, `display` e `option` só valem em `with_parent`.** Em `separately` o spec:check e o boot recusam.
- **Filha `with_parent` não tem CRUD direto** (403): grava pelo pai, com o mesmo `scope`, e tem um pai só.
- **Seção com `visibleWhen` escondida apaga dados:** os campos gravam `null` e a lista `with_parent` fica vazia. Use só quando o dado deixa mesmo de valer.
- **Situação de fato de negócio é `readOnly`** e muda por ação. `readOnly` com valor diferente no PATCH é 422, não é ignorado.
- **`required` com `access`** precisa de `default`, senão quem não pode editar não consegue criar.
- **Usando abas, são pelo menos duas.** Seções sem `tab` vêm antes de todas as com `tab`.
- **A spec não cita MUI nem React.** Fale em intenção (`tone: danger`, `color: warning`). Os únicos pontos de contato com o código são `component` e `icon` (nome de ícone do `iconsax-reactjs`, ex.: `Box`, `Warning2`).
- **A shell valida por conveniência; quem garante é o backend.** Regra que importa vai também no `Hooks::validate`.
