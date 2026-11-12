# @c3theme/ui

Tema, layout e componentes da C3 sobre o MUI: provedor de tema (claro/escuro, cores, fonte, tamanho de campo),
layout de aplicação com menu, campos, tabelas, painéis, skeletons e avisos.

## Instalação

```sh
npm install @c3theme/ui @mui/material @mui/system @emotion/react @emotion/styled @emotion/cache \
  react react-dom react-intl react-router
```

Peers obrigatórios: `react` e `react-dom` 19, `@mui/material` e `@mui/system` 9, `@emotion/react`,
`@emotion/styled` e `@emotion/cache` 11, `react-intl` 12 e `react-router` 8.
Opcional: `@tanstack/react-table` 8, só para quem importa `@c3theme/ui/table`.

## Exemplo mínimo

```tsx
import { C3ThemeProvider, Panel } from '@c3theme/ui';

export default function App() {
  return (
    <C3ThemeProvider>
      <Panel title="Olá">Primeira tela com o tema C3.</Panel>
    </C3ThemeProvider>
  );
}
```

## Modo inicial

`defaultMode="light"`, `"dark"` ou `"system"` escolhe o modo na primeira abertura. O padrão continua `"system"`.
A escolha salva da pessoa tem prioridade nas próximas aberturas; o app não precisa escrever em chaves internas do armazenamento.

```tsx
<C3ThemeProvider defaultMode="dark" storageKey="meu-app">
  <App />
</C3ThemeProvider>
```

Na shell do motor, use `<C3Shell theme={{ defaultMode: 'dark', storageKey: 'meu-app' }} ... />`.
Isso também configura o tema das telas de entrada antes do login.

O catálogo de componentes, com todas as variações, está no Storybook do repositório.

## Licença

MIT. Veja o arquivo `LICENSE`.
