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

## Cores nomeadas do app

`tokens.accents` declara cores comuns; `tokens.light.accents` e `tokens.dark.accents` sobrescrevem por modo.
Cada entrada tem `start` e `end` opcional. Aceita sRGB explícito em `#hex`, `rgb()` e `hsl()`, incluindo alpha.
Nomes ou cores inválidos são ignorados com aviso; um override inválido mantém a entrada válida anterior.

```tsx
<C3ThemeProvider
  tokens={{
    accents: { forge: { start: '#e04815', end: '#9f2db9' } },
    dark: { accents: { forge: { start: '#f29b59', end: '#f7c5e9' } } }
  }}
>
  <SoftAvatar color="accent:forge">AM</SoftAvatar>
  <StatusChip color="accent:forge" label="Desenvolvimento" />
</C3ThemeProvider>
```

A cor nomeada tem precedência sobre `tone`/`look`. Nome inexistente avisa uma vez e volta ao tom normal.
Alpha é composto sobre o `paper` do modo; a saída do gradiente é opaca. Texto preto só é escolhido quando
o limite inferior de todos os canais garante contraste; nos demais casos, os extremos são escurecidos
apenas o necessário para texto branco. A interpolação é explicitamente sRGB, com margem de 4,55:1 para
texto normal em todo o gradiente, não apenas nas pontas. Navegador sem essa interpolação usa o início
opaco como fundo. Isso atende o contraste de texto da [WCAG 2.2, 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum),
sem substituir a verificação de acessibilidade do aplicativo.

O motor declara a cor no avatar ou selo da lista; veja `spec/README.md`. Atualize `@c3theme/ui` e
`@c3theme/engine` juntos na mesma revisão do repositório: um dist antigo do UI não conhece essas props.

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

## Trocar o modo de fora da casca

Atalho do sistema, menu nativo da janela ou preferência do processo principal trocam o modo pela prop `mode`, sem
remontar a casca (a tela, o rascunho e a rolagem continuam). `onModeChange` avisa cada troca depois da abertura, inclusive
a que a pessoa faz pelo botão ou pelo painel. A escolha continua salva para a próxima abertura e o app não conhece a chave
de armazenamento.

```tsx
const [mode, setMode] = useState<ColorModePreference>();
window.desktop.onThemeShortcut((next) => setMode(next));

<C3Shell theme={{ storageKey: 'meu-app', mode, onModeChange: ({ preference }) => window.desktop.saveMode(preference) }} ... />
```

`mode` vale quando muda: se a pessoa trocar pela casca depois, a troca dela fica até o app mandar outro valor. Para só
escolher o modo da primeira abertura, use `defaultMode`. Decisão no [ADR 0012](../../docs/adr/0012-modo-controlado-de-fora.md).

O catálogo de componentes, com todas as variações, está no Storybook do repositório.

## Licença

MIT. Veja o arquivo `LICENSE`.
