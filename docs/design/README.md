# Design do C3Theme (pranchas)

Cópia das pranchas do canvas de design "C3Theme — Componentes" (Claude Design), para quem trabalha no repositório, gente ou agente, ter a referência visual junto do código.

- Cada `*.dc.html` é uma prancha: HTML com estilos inline e um bloco `<script type="text/x-dc">` com os dados e a interação. Os `{{nome}}` vêm do `renderVals()` desse bloco; `<sc-for>` repete e `<sc-if>` mostra ou esconde.
- `canvas.json` diz a posição, o tamanho e o título de cada prancha.
- Abertas direto no navegador as pranchas não renderizam (dependem do `support.js` do editor). Para ver, use o canvas; para implementar, leia o HTML e o texto das notas.
- **A fonte da verdade é o código e a spec** (`packages/ui`, `spec/`, `docs/chat-agentico.md`). Se a prancha e a spec divergirem, vale a spec, e a prancha precisa ser atualizada.

## Índice

| Prancha | Arquivo | Assunto |
|---|---|---|
| 01 | `Main.dc.html` | Fundamentos: cores de marca, paleta semântica, tipografia, raios e sombra (`createC3Theme`) |
| 02 | `Botoes.dc.html` | Button, IconButton, SoftIconButton |
| 03 | `Selos.dc.html` | Chip, StatusChip, Badge, Dot, SoftAvatar |
| 04 | `Formularios.dc.html` | TextField, Select, Checkbox, Radio, Switch, Slider, OtpInput, PasswordStrength |
| 05 | `Feedback.dc.html` | Alert, LinearWithLabel, CircularWithLabel, Snackbar, Tooltip, Skeleton |
| 06 | `Navegacao.dc.html` | VerticalNav, Tabs, Breadcrumbs, Pagination, Stepper |
| 07 | `Superficies.dc.html` | Panel, tabela, Card, lista, Accordion, Dialog |
| 08 | `Layout.dc.html` | AppLayout (header, menu, conteúdo, rodapé) |
| 09 | `Tabela.dc.html` | `DataTable`: busca, ordenação, colunas, agrupamento, estado vazio |
| 10–12 | `CrudLista`, `CrudEditar`, `CrudExcluir` | CRUD de Clientes do seed (`apps/seed/src/pages/clientes`) |
| 13 | `PaiFilhos.dc.html` | `related` com `save: with_parent` e o `WriteCall.children` |
| 14 | `FormAbas.dc.html` | Abas por `tab` na seção, cabeçalho fixo, erros por aba |
| 15–17 | `CadPergunta`, `CadProdutoPerguntas`, `CadPromocao` | Lote 3: perguntas (proteína, guarnições), produto com perguntas, promoção leve 2 pague 1 |
| 18 | `ChatForm.dc.html` | Chat: `c3.form` inline |
| 19 | `ChatRecord.dc.html` | Chat: `c3.record` na área de trabalho (sugerido, crítico, diff) |
| 20 | `ChatAction.dc.html` | Chat: `c3.action`, `c3.view`, desfazer, aprovação por risco |
| 21 | `ChatContrato.dc.html` | `UiPart`, catálogo de 4 kinds, fases, métricas |
| 22 | `ChatDecisoes.dc.html` | Pontos frágeis resolvidos (seção 13 de `docs/chat-agentico.md`) |
| 23 | `ChatComposer.dc.html` | Caixa de mensagem do chat |

## O que é proposta e o que já existe

- **Já existe no código:** 01 a 08 (tema e componentes do `@c3theme/ui`), 09 a 12 (`DataTable`, `PageHeader` e o CRUD do seed), 13 e 14 (spec v0).
- **15 a 17, pela DSL:** `product`, `question` (+ `question_option`), `product_question` e `promotion` (+ `promotion_product`) em `spec/v0/examples`, servidos pelo `c3-example` (migration `0018_menu.sql`, regras em `src/menu.rs`) no menu Cardápio do engine-demo. Ficaram de fora o que a DSL não tem: arrastar para ordenar (é o campo Ordem), o segmentado do tipo de escolha (é um select), as prévias "Como fica na venda" e "Simulação", e as lojas da promoção.
- **18 a 23:** o chat está em `packages/chat` e as partes `c3.form`, `c3.record` e `c3.action` em `packages/engine/src/agent`; confira cada prancha contra o código antes de tratá-la como feita.
