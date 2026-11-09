# @c3theme/chat

Chat para pessoas e para assistente de IA. Tem duas partes:

- `@c3theme/chat/core`: contrato das mensagens, porta de transporte (`ChatTransport`) e hooks headless
  (`useMessageWindow`, `useDraft` e outros). Não depende de MUI.
- `@c3theme/chat`: o núcleo mais os componentes visuais sobre o `@c3theme/ui` (`MessageList`, `Composer`,
  `ConversationList`, `AssistantPanel` e outros).

## Instalação

Só o núcleo headless:

```sh
npm install @c3theme/chat react
```

Com os componentes visuais:

```sh
npm install @c3theme/chat @c3theme/ui @mui/material react react-dom react-intl
```

Peers: `react` 19 sempre; `@c3theme/ui`, `@mui/material`, `react-dom` e `react-intl` só para os componentes.

## Exemplo mínimo

```ts
import type { ChatTransport, Message } from '@c3theme/chat/core';
import { mergeMessages } from '@c3theme/chat/core';
```

O sistema implementa `ChatTransport` (HTTP, WebSocket, IPC) e os componentes conversam só com essa porta.

## Licença

MIT. Veja o arquivo `LICENSE`.
