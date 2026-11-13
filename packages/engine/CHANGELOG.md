# @c3theme/engine

## Não lançado

- Dock de agentes opcional pela spec (`layout.agentDock`) e porta `agentDocks` da casca: três posições com espaço
  reservado, estados reativos, navegação por teclado e anúncio de mudanças. Guia: [agent-dock](../../docs/agent-dock.md).
- Mensagens fixadas (#120): `chat.pinned` declara a lista e navegação até mensagens antigas; `messageActions.when.meta`
  escolhe as ações pelo meta. A shell relê a mensagem e a lista depois das ações, sem perder o rascunho.
  Contrato e exemplo em [docs/chat-pinned.md](../../docs/chat-pinned.md).

- #118: `layout.sidebar` e porta `sidebars` montam lista lateral por servidor,
  com seções, fixados, preferências locais, menus acessíveis e cartões de estado.
  Sem a declaração, a navegação anterior permanece. Guia em `docs/sidebar.md`.
