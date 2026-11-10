# @c3theme/flow

Editor de fluxo de trabalho (grafo de passos) sobre o `@c3theme/ui`. Tem duas partes:

- `@c3theme/flow/core`: contrato `{ nodes, edges }` e regras puras (`validateFlow`, `autoLayout`, `connect`,
  `unlink`, `traversedEdges`). Não depende de React nem da biblioteca do canvas.
- `@c3theme/flow`: o núcleo mais o `FlowEditor`. O canvas fica atrás da porta `FlowCanvasProps`; o adaptador
  padrão usa o React Flow (`@xyflow/react`, MIT).

## Instalação

```sh
npm install @c3theme/flow @c3theme/ui @mui/material @emotion/react @emotion/styled react react-dom react-intl
```

Instale o `@c3theme/ui` junto: ele é peer, e o npm não o publica nem o instala por você. O pacote importa o CSS
do React Flow, então use um bundler que aceite `import '*.css'` (Vite, webpack).

## Exemplo mínimo

```tsx
import { useState } from 'react';
import { FlowEditor } from '@c3theme/flow';
import type { FlowNodeKind } from '@c3theme/flow';
import type { FlowGraph } from '@c3theme/flow/core';

const kinds: FlowNodeKind[] = [/* tipos de passo do app: gatilho, agente, condição, fim... */];

function Fluxo() {
  const [graph, setGraph] = useState<FlowGraph>({ nodes: [], edges: [] });
  return <FlowEditor value={graph} onChange={setGraph} kinds={kinds} />;
}
```

Sem `onChange`, o editor fica só leitura.

Regras do app no tipo de passo: `max` (com 1, o tipo some do menu quando já existe), `removable: false` (não sai pelo
Delete nem pelo painel) e `defaults` (config do passo novo). No editor: `selectedId` + `onSelectedChange` para abrir o
passo de fora e `extraIssues` (`{ nodeId, message }`) para problemas que só o app valida. Saída com `optional: true` pode ficar solta (o fluxo termina ali); `validate` troca a validação do editor pela do app. Os textos em inglês estão em `FLOW_MESSAGES_EN`.

## Licença

MIT. Veja o arquivo `LICENSE`.
