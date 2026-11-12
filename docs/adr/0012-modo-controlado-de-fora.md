# 0012. Modo claro/escuro trocado de fora da casca

## Status

Aceita em 12/11/2026 (issue #112, lacuna do PieceWork cecon/Piecework#240; completa o `defaultMode` do #96).

## Contexto

A casca já abria no modo que o app pede (`theme.defaultMode`) e a pessoa trocava pelo botão ou pelo painel. O app não
tinha como trocar o modo de uma casca montada a partir de código de fora dela (atalho do sistema, menu nativo da janela,
preferência do processo principal) nem saber que a pessoa trocou dentro dela. O PieceWork ouvia o evento `storage` com a
chave `<storageKey>-mode`, que é detalhe interno do provedor de tema (MUI). O próprio Storybook trocava o modo chamando
o `useColorScheme` do MUI por dentro.

## Decisão

- **`mode` e `onModeChange` no `C3ThemeProvider`**, e por isso também em `<C3Shell theme={...}>` e na tela de entrada.
  Um componente interno (`ModeBridge`) aplica `mode` pelo mesmo setter do botão e do painel, que já salva a escolha: a
  casca não remonta e a próxima abertura lembra.
- **`mode` vale quando muda**, não trava o modo. Se a pessoa trocar pela casca depois, a troca dela fica até o app mandar
  outro valor. `defaultMode` continua sendo só a escolha da primeira abertura.
- **`onModeChange({ preference, mode })` avisa toda troca depois da abertura**: pela casca, pelo app, por outra janela ou
  pelo sistema (com `system`). A abertura não avisa. `preference` é a escolha (`system` incluso); `mode` é o resolvido.
- A chave de armazenamento continua interna: nenhum app precisa conhecê-la.

## Consequências

- **Melhora**: o PieceWork tira o ouvinte do `storage`; o Electron leva o atalho e o menu nativo para a casca sem
  remontar; o Storybook passou a usar a mesma prop.
- **Piora**: o app que repassa o aviso para o próprio estado recebe também o eco da troca que ele pediu. O valor é o
  mesmo, então não há laço, mas o app não deve tratar o aviso como "a pessoa trocou".

## Alternativas consideradas

- **Modo totalmente controlado** (a casca só mostra o que o app manda): obrigaria todo app a guardar e repassar a
  escolha, e o botão da casca deixaria de funcionar sem `onModeChange`. Mais trabalho para o caso comum.
- **Controlador exportado** (`createModeController()` com `set` e `subscribe`): resolve o mesmo com mais API e um objeto
  a mais para o app passar adiante. A prop segue o padrão das outras opções do `theme`.
- **Documentar a chave do `storage`**: tornaria público um detalhe do MUI e não troca o modo da janela atual.
