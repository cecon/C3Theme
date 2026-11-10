# Telas: app, lista, formulário, filhos, quadro, painel

Resumo. Quem decide são o `spec/v0/app.schema.json` e o `entity.schema.json` do commit instalado. Os detalhes estão no `spec/README.md`, nas seções "Layout e rotas", "Quadro e calendário", "Painel" e "Página custom e mestre-detalhe".

## App, layout e login

```json
{
  "specVersion": "0",
  "name": "ERP Exemplo",
  "entities": ["product", "unit"],
  "organization": { "company": "org_company", "branch": "branch" },
  "auth": { "identifier": "username", "forgotPassword": true, "register": false },
  "pages": [{ "path": "/painel", "title": "Painel", "dashboard": { "widgets": [] } }],
  "layout": {
    "orientation": "vertical",
    "user": "drawer",
    "header": { "search": true, "actions": ["assistente"] },
    "menu": [{ "title": "Estoque", "items": [{ "entity": "product" }] }],
    "footer": null
  }
}
```

- `entities` lista todas as entidades, inclusive as filhas.
- `layout.header.search: { "records": true }` faz o Ctrl K achar registros e mensagens pelo `GET /_search` do backend (o sistema implementa a porta `Search`); sem isso, só telas do menu. Não escreva paleta de busca própria.
- `layout.user`: `header` (avatar à direita, o padrão) ou `drawer` (cartão no pé do menu lateral). Use isso em vez de montar um cartão de usuário no `drawerFooter`, porque dois cartões já saíram duplicados num sistema.
- `auth` liga as telas de entrada da shell (login, esqueci a senha, cadastro, perfil). Quem autentica é o sistema, pela `AuthPort` do front. Sem `auth`, o sistema faz o login e passa o token em `headers`.
- Rotas são derivadas e ninguém as declara: `/{entity}`, `/{entity}/board`, `/{entity}/calendar`, `/{entity}/gallery`, `/{entity}/new?f.campo=valor`, `/{entity}/:id`.
- `pages[]`: `component` (React registrado) ou `dashboard`. `layout: "blank"` ocupa a tela toda (impressão, quiosque).

## Lista e menu

```json
"list": {
  "columns": [{ "field": "code", "width": 110 }, "description", "price", "active"],
  "search": ["code", "description"],
  "filters": ["category_id", "kind", "active"],
  "defaultSort": [{ "field": "description" }],
  "pageSize": 25,
  "presets": [
    { "id": "ativos", "label": "Ativos", "where": { "field": "active", "op": "eq", "value": true }, "default": true },
    { "id": "servicos", "label": "Serviços", "where": { "field": "kind", "op": "eq", "value": "service" },
      "defaults": { "kind": "service" } }
  ]
}
```

- `search` cobre só `string`, `text` e `email`. `filters` são os filtros livres da barra.
- `presets[].defaults` preenche o registro novo criado com aquele preset ativo.
- Coluna como objeto: `{ "field": "nome", "label": "Cliente", "avatar": true, "secondary": "email" }` (iniciais + e-mail embaixo) e `{ "field": "cidade", "join": ["uf"] }` ("Recife - PE"). `avatar: { "letters": 1, "tone": "neutral" }` dá uma letra cinza; `weight: "normal"` tira o negrito. Não escreva componente de célula para isso.
- `expand: { "fields": [{ "field": "email", "icon": "Sms" }], "stats": ["pedidos"], "notes": ["sobre"] }` abre a prévia do registro embaixo da linha.
- `presetTabs: { "all": "Todas" }` (presets como abas com contagem), `dateRange: { "field": "emissao", "label": "Emitidas" }` (período de/até), `searchHint`, `export: false` e `link: true` na coluna.
- `rowActions: ["view", "edit", "delete"]` põe Ver/Editar/Excluir na linha; com `delete`, vem a marcação e "Excluir (n)". `label.new` ("Nova fatura") troca o texto do botão de criar e `label.gender: "f"` acerta "selecionadas"/"Excluída". `rowActionsStyle: "quiet"` deixa os ícones cinza; `open: "dialog"` abre ver e criar num diálogo sobre a lista. `filters: [{ "field": "status", "all": "Todas" }]` troca o "Todos" do filtro.
- `refreshSeconds: 30` (3 a 3600) relê a página e os totais sozinha, só com a aba visível, sem perder seleção: fila que muda (requisições, comandas em uso). Não é tempo real.
- `"live": true` na entidade (ou `{ "sound": { "on": ["created"] } }`) relê lista, quadro, calendário e relatório na hora, por SSE (KDS, bicos, comandas). Gravação feita fora do motor precisa de `Live::notify` no backend. O registro aberto relê em leitura, não em edição.
- A lista já exporta CSV (até 10 mil linhas) e já tem o esqueleto de carregamento: não escreva isso de novo.
- Itens de menu: `{ "entity": "product" }` (título, ícone e rota saem da entidade), `{ "entity", "preset", "title", "icon", "badge": true }`, `{ "entity", "view": "board" }`, `{ "path": "/painel" }`, `{ "href": "https://..." }` e `children` para submenu.

## Formulário

```json
"form": { "sections": [
  { "rows": [["code", "description"]] },
  { "tab": "Geral", "rows": [["kind", "category_id", "unit_id"], ["active"]] },
  { "tab": "Fiscal", "title": "Tributação", "visibleWhen": { "field": "kind", "op": "ne", "value": "service" },
    "rows": [["ncm", { "field": "cfop", "component": "cfop-picker" }]] }
] }
```

- `rows`: cada linha tem até 4 campos lado a lado, que empilham no celular. Um item é o nome do campo ou `{ "field", "component" }`.
- `tab`: seções com a mesma `tab` ficam juntas. Seções sem `tab` vêm antes e ficam fixas acima das abas. Usando abas, são pelo menos duas. A aba com erro abre sozinha ao salvar.
- `visibleWhen` na seção: escondida, os campos gravam `null` e a lista `with_parent` vale vazia (apaga o que havia). A condição não pode citar campo da própria seção, e um campo de seção condicional não aparece em outra seção.
- `access` na seção: veja [regras](regras.md#permissões).
- Seção custom: `{ "title": "Mapa", "component": "erp/mapa" }`.
- `afterCreate` (ao lado de `sections`): para onde ir depois de criar pela tela cheia, como `"/conversa/{id}"`. `{campo}` vira o valor gravado (de um reference, o id). Sem ele, abre o registro criado.
- `autosave: true` (ao lado de `sections`, só em `singleton`): a configuração abre editável e cada campo grava sozinho ao mudar (switch, select) ou ao sair (texto), sem Editar nem Salvar. Booleano vira linha de ajuste com switch à direita. Sem `titleField`, o título do singleton é o `label.singular`.
- `views.detail.component` troca o detalhe. Sem ele, o detalhe é o formulário em modo leitura.
- `pairing` na seção: ligar aparelho por QR ou código pelos campos do registro (`status`, `qr`, `code`, `states`) e ações de registro nos botões (`actions.qr/code/cancel/retry`). Não escreva componente custom para isso.
- `width` (de 12) na seção: seções seguidas que somam até 12 dividem a linha (Observações 7, Resumo 5).
- `views.form.initial`: valores do registro novo só no formulário; data aceita `{ "$date": "today", "offset": 15 }`. O `default` do campo vale também pela API.
- `views.form.actions: "footer"` põe Cancelar e gravar no fim; `submitLabel: { "new": "Criar fatura", "edit": "Salvar alterações" }` troca o texto.
- `summary` na seção e `computed` na lista `with_parent` mostram contas enquanto o usuário digita: `"sum(fatura_item, quantidade * preco)"`, `"subtotal * desconto / 100"`. Só exibição: o total gravado continua regra do backend (hook de gravação), com a mesma conta.
- `unit` no campo integer/decimal: "%" ou "kg" depois do número.
- `"grouping": false` no integer: porta, ano ou código sem separador de milhar ("8788", não "8.788").
- `{ "field": "cor", "display": "swatches" }`: enum com `color` em todas as opções vira bolinhas de cor. Com `actions: "footer"`, o formulário aberto num diálogo (calendário) usa o rodapé do diálogo.

## Mestre-detalhe

| Caso                                              | Declaração                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Filhos com vida própria (clientes da empresa)     | `{ "related": { "entity": "customer", "field": "company_id" } }`                 |
| Itens que só existem no pai (itens do pedido)     | `{ "related": { "entity": "sales_order_item", "field": "order_id", "save": "with_parent", "maxItems": 200 } }` |
| Um registro só (dados fiscais)                    | `with_parent` + `"maxItems": 1` (+ `"minItems": 1` se for obrigatório)          |
| Lista de marcar N:N (permissões do perfil)        | `with_parent` + `"display": "checklist", "option": "permission_id", "groupBy": "module"` |

- `separately` (o padrão): a seção só aparece em registro salvo, cada filho grava sozinho pelo CRUD da filha e a lista é paginada.
- `with_parent`: a lista inteira vem na leitura do pai (`"sales_order_item": [...]`), vai no corpo do POST/PATCH e **substitui a gravada**. Linha com `id` altera, sem `id` inclui, e a que não veio é excluída. Tudo grava numa transação. Erro de linha volta em `fields["sales_order_item.2.quantity"]`.
- A filha `with_parent` continua sendo uma entidade, com tabela, campos e migration próprios, o mesmo `scope` do pai e um pai só. O CRUD direto dela responde 403.
- Regra entre linhas (soma dos itens, ordem) vai no `Hooks::validate_children`.
- `maxItems` tem padrão 200 e teto 500. Acima disso, use `separately`.
- `columns` e `sort` escolhem o que a grade mostra. Com até 4 campos simples, a linha é editada no lugar; com mais, abre um diálogo.

## Quadro, calendário e painel

```json
"board": { "groupBy": "stage", "columns": ["todo", "doing", "done"], "fields": ["customer_id", "due_date"] },
"calendar": { "start": "due_date", "end": "end_date", "color": "stage", "fields": ["customer_id"] }
```

- `board.groupBy` e `calendar.color` são campos `enum`. Arrastar grava pelo PATCH normal, e só quando o usuário pode alterar e o campo não está travado.
- Cartão do quadro: `code` (acima do título), `due` (prazo em chip), `assignee` (avatar), `counters` (contadores com ícone) e `done` (valor da coluna de concluídos). Não escreva componente de cartão para isso. "Adicionar cartão" no pé da coluna vem por padrão (`quickAdd: false` tira).
- O calendário tem Mês, Semana, Dia e Agenda; arrastar ou esticar o evento remarca e selecionar dias cria no diálogo. Ponha `label.new` ("Novo evento") para o botão.
- Os presets da lista valem nas três telas. No menu, `"view": "board"`.
- Cartões: `"gallery": { "image": "foto_url", "subtitle": "resumo", "caption": ["autor"], "chip": "tipo", "size": "small", "viewer": true }` em `/{entity}/gallery`. `image` é campo string (URL) ou `{ "component": "nome" }`; sem imagem saem as iniciais. Não escreva página de cartões.
- Cabeçalho do registro com imagem: `"form": { "header": { "image": "foto_url", "subtitle": "resumo", "caption": ["autor"] } }`.
- Botão de ação na linha e no cartão: `"rowActions": ["view", { "action": "instalar" }]`, só para ação sem input, confirm ou returns.
- Relatório: `"report": { "groupBy": ["seller_id"], "columns": ["number", "customer_id", "total"], "subtotals": ["total"] }` em `/{entity}/report`, com subtotal, total geral e Imprimir. Até 10 mil linhas do filtro; árvore com `"tree": { "parent": "mae_id" }` só exibe (totais por nível vêm da consulta do sistema).
- Planta: `"map": { "color": "status", "position": { "x": "x", "y": "y" } }` (mesas; campos integer) ou `"groupBy": ["ilha_id", "bomba_id"]` (pista, setor do KDS) em `/{entity}/map`. Bloco colorido pelo enum, ações do registro no clique. Junte com `live` para acompanhar na hora.

```json
{ "path": "/painel", "title": "Painel", "dashboard": { "widgets": [
  { "type": "kpi", "title": "Em aberto", "entity": "sales_order", "preset": "em-aberto", "measure": "sum:total" },
  { "type": "chart", "title": "Por status", "entity": "customer", "groupBy": "status", "width": 4 },
  { "type": "chart", "title": "Por mês", "entity": "activity", "groupBy": "due_date", "interval": "month" },
  { "type": "list", "title": "Pendentes", "entity": "activity", "preset": "pendentes", "columns": ["subject", "due_date"], "sort": "due_date", "limit": 5 }
] } }
```

- `measure`: `count` (padrão) ou `sum:<campo integer ou decimal>`. O `groupBy` do chart aceita enum, boolean, reference ou data (com `interval`).
- KPI completo: `"icon": "ReceiptText", "tone": "primary", "count": true, "progress": { "label": "do total", "whole": { ... } }` (ícone, "25 faturas" e barra com %). Gráfico: `"chart": "area"` com `series` (cada uma com `where` e `tone`) e `"ranges": [6, 12]`; `"chart": "donut"` para a rosca com legenda.
- `{ "type": "ranking", "groupBy": "cliente_id", "measure": "sum:total", "caption": "{count} {label} em aberto", "flag": { "where": ..., "label": "{value} vencido" }, "action": "cobrar" }`: maiores grupos com chip e botão de ação do registro apontado. `{ "type": "feed", "entity": "aviso", "kind": "tipo", "text": "detalhe", "time": "quando", "icons": { ... } }`: avisos recentes. `{ "type": "heatmap", "entity": "turno", "groupBy": "quando", "measure": "count", "tone": "success", "bind": { "periodo": "quando" } }`: grade de atividade do ano, um quadrado por dia. Não escreva componente de painel para isso.
- `dashboard.actions`: botões no topo (`{ "label": "Nova fatura", "path": "/fatura/new", "icon": "Add", "variant": "contained" }`).
- `width` vai de 1 a 12. O filtro é `preset` e/ou `where`; o clique leva à lista com o mesmo recorte (`w` na URL).
- `{ "type": "alert", "entity": "sale", "preset": "sem-nfce", "text": "{count} vendas sem NFC-e", "tone": "error" }`: só aparece com contagem acima de zero.
- Filtro do usuário: `"filters": [{ "name": "periodo", "type": "period", "default": "month" }, { "name": "filial", "type": "reference", "entity": "branch" }]` no `dashboard`, e `"bind": { "periodo": "sold_at", "filial": "branch_id" }` em cada widget que usa. Widget sem `bind` não muda.
- Lê `GET /{entity}/_aggregate`, com o mesmo escopo e as mesmas permissões da lista. Média, dois agrupamentos e comparação entre períodos ainda não existem: para isso, página custom.
