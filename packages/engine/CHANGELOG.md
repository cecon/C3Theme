# @c3theme/engine

Cada entrada diz o que muda para quem usa; **Quebra** marca o que exige mudar o app.

## 0.1.0 (2026-11-12)

- Zonas da casca (cecon/C3Theme#116 e #117): `layout.rails` declara o rail de servidores e o rail de páginas no app.json, e `spec/v0/app.schema.json` documenta a declaração.
- `<C3Shell>` ganhou a porta `rails` com os dados e as ações dos dois railes; `<C3Layout>` desenha as zonas nas bordas e mantém o restante da moldura igual. Sem `layout.rails`, a casca continua como antes (sem espaço reservado).
- Páginas do rail de páginas saem do menu da spec, com a primeira página fixa; páginas sem permissão continuam fora.

## Não lançado

- Dock de agentes opcional pela spec (`layout.agentDock`) e porta `agentDocks` da casca: três posições com espaço
  reservado, estados reativos, navegação por teclado e anúncio de mudanças. Guia: [agent-dock](../../docs/agent-dock.md).
- Mensagens fixadas (#120): `chat.pinned` declara a lista e navegação até mensagens antigas; `messageActions.when.meta`
  escolhe as ações pelo meta. A shell relê a mensagem e a lista depois das ações, sem perder o rascunho.
  Contrato e exemplo em [docs/chat-pinned.md](../../docs/chat-pinned.md).

- #118: `layout.sidebar` e porta `sidebars` montam lista lateral por servidor,
  com seções, fixados, preferências locais, menus acessíveis e cartões de estado.
  Sem a declaração, a navegação anterior permanece. Guia em `docs/sidebar.md`.
