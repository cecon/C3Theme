# @c3theme/engine

Renderer da shell C3: lê o `/_meta` do backend (a spec em JSON) e monta layout, menu, rotas, listas,
formulários, painéis, quadro e calendário com o `@c3theme/ui`. O backend segue o contrato HTTP do C3
(spec v0) e cuida das próprias migrações.

## Instalação

```sh
npm install @c3theme/engine @c3theme/ui @mui/material @mui/system @emotion/react @emotion/styled \
  @emotion/cache react react-dom react-intl react-router swr
```

Peers: os mesmos do `@c3theme/ui` (que também é peer) mais `swr` 2.

## Exemplo mínimo

```tsx
import { C3Shell } from '@c3theme/engine';

export default function App() {
  return <C3Shell apiUrl="/api" />;
}
```

Sem backend (protótipo, vitrine estática, teste de tela), `createMemoryClient` atende a mesma porta em memória.
Para montar listas e formulários dentro do layout do próprio sistema, sem a shell, use `EngineProvider`,
`EntityList` e `EntityForm`.

## Licença

MIT. Veja o arquivo `LICENSE`.
