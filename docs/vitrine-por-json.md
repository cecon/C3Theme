# Vitrine por JSON: o que o motor já monta e o que falta

Meta (Eduardo, 05/11/2026): toda tela de negócio da vitrine sai do motor (`@c3theme/engine`) a partir de JSON, com
**o mesmo visual** da versão em código. Onde o motor não chega no mesmo resultado, a diferença é lacuna do motor, não
motivo para mudar o visual. O catálogo de componentes isolados (botões, chips, tokens, gráficos soltos), o chat e as
páginas públicas (login, preços, manutenção) continuam em código.

## Como está montado

- **Adaptador em memória** (`packages/engine/src/memory`): implementa a porta `C3Client` sem servidor, com lista
  (busca, filtro, data relativa, ordem, página), `_aggregate` (contagem, soma, por grupo e por mês), CRUD, validação de
  obrigatório e limites, filhas `with_parent`. Ações (de um registro e em lote) rodam pelo handler que o seed
  declara em `actions[entidade][ação]`, que devolve o patch do registro; sem handler, e prévias, consultas e arquivos,
  respondem 501. Exportado como
  `createMemoryClient`; serve também para protótipo e teste de tela.
- **Seção "Por JSON" da vitrine** (`apps/showcase/src/sections/motor`): specs em `spec/*.json` (validadas no
  `pnpm spec:check`), registros vindos dos mesmos dados das telas em código (`seed.ts`). Rotas da entidade na raiz
  (`/pessoa`, `/fatura/1026`), como o motor navega.
- Cada tela do motor tem a barra "Tela montada pelo motor", o botão de código, que **mostra o JSON** (um arquivo por
  aba), e o link "Ver a versão em código".

## Resultado da comparação

Nenhuma tela de negócio sai igual hoje. Por isso nenhuma tela em código foi trocada neste PR: as versões do motor ficam
ao lado, na seção "Por JSON", até cada lacuna abaixo fechar. A troca de cada tela é um PR próprio, com print das duas.

| Tela em código | Versão do motor | Diferença principal | Lacunas |
| --- | --- | --- | --- |
| Tabelas de dados › Paginação | `/pessoa` | catálogo, não tela de negócio: mostra as posições da paginação (numerada, "Ir para") e fica em código | L1 L2 L3 L5 |
| Clientes › Lista | `/cliente` | ✅ trocada: o menu "Lista de clientes" abre a tela do motor e a versão em código saiu. Ficou diferente: total à direita (L1) e rótulos na borda dos campos (#97). Criar, ver e editar abrem diálogo como antes (`open: "dialog"`); "Todas" no filtro vem de `filters[].all` | — |
| Faturas › Lista | `/fatura` | ✅ trocada: o menu "Lista de faturas" abre a tela do motor. Avatar de uma letra cinza e nome em peso normal (`avatar: { letters: 1, tone: "neutral" }`, `weight`), ícones cinza em contorno (`rowActionsStyle: "quiet"`), "Marcar como pagas" em lote (ação `bulk`, rodada pelo handler do seed). Ficou diferente: valor à direita (L1); a ação em lote pede confirmação dizendo quantas faturas, que a tela em código não pedia; ver e nova abrem o registro do motor, cujo dado é separado das telas de detalhe e formulário em código até elas virarem motor | — |
| Faturas › Nova / Editar | `/fatura/new` | Dados da fatura, itens na linha com o total do item, Observações e Resumo lado a lado, resumo recalculado e Cancelar/Criar fatura no rodapé já saem iguais. Falta: o número sugerido, cliente e endereços em cartões (escolher cliente, editar endereço, "Usar o de cobrança") e Pré-visualizar | L11 L14 L34 |
| Faturas › Detalhe | `/fatura/1026` | documento da fatura (cabeçalho do emissor, endereços, totais), Imprimir/Baixar PDF | L15 |
| Faturas › Painel | `/apps/faturas/painel` | ✅ trocada: o menu "Painel de faturas" abre a página do `app.json` e a versão em código saiu. KPI com ícone, contagem e barra (`icon`, `count`, `progress`), área com duas séries e 6/12 meses (`chart: "area"`, `series`, `ranges`), rosca com legenda (`chart: "donut"`), "Maiores devedores" (`ranking` com `flag` e o botão Cobrar pela ação `cobrar`) e notificações (`feed` da entidade `notificacao`). A receita vem da entidade `receita_mes` (mês, faturado, recebido), com a mesma série da tela em código, uma série por medida (`series[].measure`) e o eixo em mil (`axisScale`); as faturas continuam as 28 de antes | — |
| Kanban › Quadro | `/tarefa/board` | cartão e coluna iguais. Ficou diferente: sem o menu da coluna (renomear, excluir e marcar concluída mexem nas opções do enum, que são da spec), sem as abas Quadro/Backlog (L21) e com a troca lista/quadro no topo; a cor do avatar vem do registro, não de um campo do membro | L21 |
| Kanban › Backlog | — | história com filhos expansíveis, critérios, comentários | L21 |
| Calendário | `/evento/calendar` | ✅ trocada: o menu "Calendário" abre a tela do motor e a versão em código saiu. O diálogo do evento ficou igual: "Editar evento"/"Novo evento", Excluir, Cancelar e Salvar/"Criar evento" no rodapé (`actions: "footer"` num diálogo), cor em bolinhas (`display: "swatches"`, com o tom Principal) e, no dia inteiro, início e fim só como data, o fim mostrado como o último dia. Ficou diferente: a confirmação de excluir usa o texto padrão do motor e o fim antes do início é recusado ao gravar, não enquanto digita | — |
| Clientes › Cartões | — | grade de cartões com avatar, contatos, interesses e situação | L25 |
| Painéis › Padrão e Analítico, Widgets | — | banner, KPI com minigráfico, checklist de versão, feed, cartões de pessoa | L16 L17 L26 |
| E-commerce (produtos, detalhe, checkout) | — | vitrine de loja com foto, nota, carrinho, passos de compra | L27 |
| Perfil › Usuário e Conta | — | cabeçalho de perfil, abas de configuração | L28 |
| Formulários › Layouts, Validação, Assistente | — | rótulo à esquerda, grupos com divisória, passos (wizard), barra de ações fixa | L10 L29 L30 |
| Tabelas MUI e demais Tabelas de dados | — | são demonstração de recurso de tabela (arrastar coluna, redimensionar, virtualizar, agrupar, edição na célula). Ficam como catálogo; o recurso que o motor quiser oferecer entra como lacuna própria | L31 |

## Lacunas do motor

Ordem sugerida: as que afetam mais telas primeiro. Cada uma vira um PR com spec, motor, conformidade e print.

**Lista**

- **L1. Número alinhado à direita e moeda.** ✅ Feito: integer/decimal ficam à direita em toda tabela do motor (lista,
  total, filhas, grade, widget) e o decimal ganhou `"currency": "BRL"` (ISO 4217), que mostra `R$ 9.568,20` em lista,
  registro, painel e totais e põe o símbolo no campo de digitação. O CSV continua só com o número, para a planilha
  somar.
- **L2. Célula composta.** ✅ Feito: coluna com `label`, `secondary` (segunda linha apagada), `join` ("Recife - PE") e
  `avatar` (iniciais, ou foto de um campo string), sem componente custom.
- **L3. Paginação numerada.** Vitrine usa páginas numeradas, primeira/última e "Ir para"; o motor usa a barra do MUI.
  Escolher um padrão só (o do `@c3theme/ui`) e usar nos dois.
- **L4. Ações na linha.** ✅ Feito: `views.list.rowActions` põe Ver, Editar (diálogo sobre a lista, já editando) e
  Excluir (confirmação) na coluna "Ações", cada um com a sua permissão. Com excluir, a lista ganha marcação e
  "Excluir (n)". A barra da lista virou uma linha só, como na vitrine: busca ("Em 42 clientes") e filtros à
  esquerda, Exportar CSV e o botão de criar à direita, sem o título repetido no cartão; `label.new` dá "Novo
  cliente".
- **L5. Coluna de código (#).** Mostrar o id ou um campo sequencial como primeira coluna discreta.
- **L6. Máscara de telefone e CPF na lista.** ✅ Feito: `format: "phone"` (10 ou 11 dígitos no fio, mesma regra no
  Rust e na shell, casos em `conformance/documents.json`) mostra e digita `(11) 98123-4567`; CPF já saía com
  máscara na lista.
- **L7. Linha expansível com detalhe.** ✅ Feito: `views.list.expand` (`fields` com ícone, `stats` em destaque,
  `notes` com texto longo e flags) abre a prévia embaixo da linha com os dados que a linha já trouxe.
- **L8. Presets como abas com contagem.** ✅ Feito: `views.list.presetTabs` (`all` dá o rótulo da primeira aba), uma
  contagem por aba com a busca e os filtros da barra. Junto: `searchHint` (placeholder da busca), `export: false` e
  `link` na coluna (número da fatura abre o registro).
- **L9. Filtro por período.** ✅ Feito: `views.list.dateRange` (campo date) põe "Emitidas de" e "até" na barra, com
  `gte`/`lte`.
- **Busca.** ✅ Feito com L4: rótulo "Buscar" e placeholder "Em 42 clientes".

- **L32. Código quebrando no celular.** ✅ Feito: valor sem espaço (código "FAT-2026-1026", data, e-mail, valor em
  R$) fica numa linha só na célula da lista; texto com espaço continua quebrando entre palavras e a tabela rola na
  horizontal.

**Formulário**

- **L10. Seções lado a lado.** ✅ Feito: `width` (de 12) na seção; seções seguidas que somam até 12 dividem a linha
  e ficam da mesma altura. Linha de 2 a 4 campos fica em duas colunas no tablet.
- **L11. Valor inicial calculado.** ✅ Datas: `views.form.initial` com data relativa (emissão hoje, vencimento em 15
  dias), só no formulário (o `default` do campo vale pela API). Falta o número da próxima fatura, que é do backend
  (pedir os valores do registro novo ao servidor, como o `_prefill` da ação).
- **L12. Itens editáveis na própria grade.** ✅ Feito: a linha no lugar ganhou larguras (número com 2 colunas, texto
  com o resto), "Adicionar item" no fim, "Descrição do item 2" no rótulo, `minItems` linhas vazias no registro novo
  e a lixeira travada no mínimo.
- **L13. Campo calculado e resumo.** ✅ Feito como exibição: `computed` na lista (total do item) e `summary` na seção
  (subtotal, desconto, impostos, total), com fórmulas de `formulas.mjs` conferidas pelo `spec:check`. O total gravado
  continua regra do backend; na vitrine, o `onSave` do adaptador em memória faz a mesma conta. `unit: "%"` no campo.
- **L14. Botões no rodapé e cabeçalho do registro.** ✅ `views.form.actions: "footer"` e `submitLabel` ("Criar
  fatura", "Salvar alterações"), sem o título repetido enquanto edita. Falta Pré-visualizar, que depende do documento
  da fatura (L15).
- **L34. Cliente e endereços em cartões.** A tela em código escolhe o cliente num diálogo e mostra cartões de cliente,
  endereço de cobrança e de entrega (Editar, "Usar o de cobrança"); o motor tem nome e e-mail soltos.

**Detalhe e documento**

- **L15. Documento do registro.** Detalhe da fatura é um documento (emissor, cliente, endereços, itens, totais) com
  Imprimir e Baixar. Proposta: `views.detail` com layout de documento, ou página registrada.

**Painel**

- **L16. KPI rico.** ✅ Ícone com cor, contagem e barra com "% do total" (`icon`, `tone`, `count`, `progress`). Falta
  a variação com seta e o minigráfico dos Painéis Padrão e Analítico.
- **L17. Gráficos.** ✅ `chart: "area"` com `series` (cada uma com filtro e cor) e `ranges` (6/12 meses);
  `chart: "donut"` com legenda (cor, %, valor).
- **L18. Lista agrupada no painel.** ✅ `ranking`: agrupa por um reference, soma, mostra a contagem, o chip de `flag`
  e o botão de uma ação de registro da entidade agrupada. Notificações viraram entidade (`notificacao`) com o widget
  `feed` (ícone e cor pelo enum, "há 12 min").

**Quadro**

- **L19. Cartão do quadro.** ✅ Feito: `views.board.code` (acima do título), `due` (prazo em chip pela data),
  `assignee` (avatar com iniciais), `counters` (comentários com ícone) e `done` (coluna de concluídos: título
  riscado e prazo verde). Enum de `fields` vira chip na linha do prazo; clicar abre o registro num diálogo.
- **L20. Coluna do quadro.** ✅ Feito: coluna em cartão como a da tela em código, contagem em chip, visto na coluna
  `done` e "Adicionar cartão" no pé (cria com o título; se faltar campo obrigatório, abre o formulário com o que
  foi digitado). O menu da coluna não entra: as colunas são as opções do enum, definidas na spec.
- **L21. Backlog.** Lista hierárquica (história com tarefas) não existe no motor.

**Calendário**

- **L22. Dia inteiro.** ✅ Feito: `views.calendar.allDay` aponta um campo boolean; verdadeiro, o evento aparece sem
  hora.
- **L23. Fim exclusivo e evento de vários dias.** ✅ Feito: em `datetime` o fim é exclusivo (terminar às 00:00 não
  ocupa o dia); em `date` continua o último dia. Evento de vários dias é uma barra contínua na semana, com até 3
  faixas e "+N mais". A semana de 4 a 5 e a viagem de 19 a 21 saem iguais à tela em código.
- **L24. Semana, Dia e Agenda.** ✅ Feito: o motor passou a usar o mesmo FullCalendar da tela em código, com a barra
  (`CalendarToolbar`) e os estilos (`calendarStyles`) no `@c3theme/ui`. Ganhou Semana, Dia e Agenda, "Hoje" à
  esquerda, cabeçalho em caixa alta, borda colorida, selecionar um período para criar e arrastar ou esticar para
  remarcar (PATCH com `If-Match`). A grade própria do motor saiu.
- **L33. Diálogo do evento.** ✅ Feito: formulário com `actions: "footer"` aberto num diálogo vira um diálogo comum
  (título, campos sem cartão, Excluir à esquerda e Cancelar/gravar no rodapé, tela cheia no celular, cursor no
  primeiro campo); `{ "field": "cor", "display": "swatches" }` mostra o enum com cores em bolinhas (`SwatchField` no
  `@c3theme/ui`); com o `allDay` do calendário ligado, início e fim são editados só como data, o fim inclusivo, e
  ligar ou desligar o dia inteiro ajusta as horas (meia-noite, ou 9h às 10h).

**Outras visões**

- **L25. Visão em cartões** (grade de cartões por registro, com campos escolhidos).
- **L26. Banner e checklist no painel** (conteúdo, não dado): componente registrado.
- **L27. Loja.** Catálogo com foto, nota, preço riscado, carrinho e checkout em passos: fora do escopo do motor de
  cadastro; página registrada.
- **L28. Perfil do usuário.** Cabeçalho com avatar e abas de configuração: página registrada ou `singleton` com
  layout de perfil.
- **L29. Rótulo à esquerda e grupos com divisória** no formulário.
- **L30. Assistente em passos (wizard)** para cadastro longo.
- **L31. Recursos de tabela** (ocultar/arrastar/redimensionar coluna, densidade, zebrado, rodapé com média): decidir
  quais o motor oferece por preferência do usuário, sem spec.

## O que não é lacuna do motor

- O campo de data das telas em código (Faturas › Nova) ainda usa o seletor do MUI X, diferente do `DateField` do
  `@c3theme/ui` que o motor usa. A correção é na tela em código.
- No registro aberto pela vitrine (`/fatura/1026`) o título da página vem do menu ("Lista de faturas"). É do layout da
  vitrine, que não conhece a rota do registro; a shell do motor resolve isso no `C3Shell`.
