# 0004. Moldura do desktop declarada no app.json, com a plataforma por porta

## Status

Aceita em 12/11/2026, fecha a lacuna da moldura do desktop do [ADR 0003](0003-motor-sem-excecoes.md) (issue #73).

## Contexto

Até aqui o app de desktop (Electron, Tauri) montava a moldura da janela em TS: `<C3Shell desktop={{ platform, translucent }}>`,
`theme.tokens={desktopTokens('mac')}` e, no main, as opções do `BrowserWindow` escritas à mão. Três lugares dizendo a
mesma coisa, e nenhum deles no app.json. O ADR 0003 tirou essa exceção.

Parte da moldura é do app (quer a barra do sistema ou a própria, menu translúcido, densidade) e parte só quem roda sabe
(em que sistema a janela abriu e se a tela tem o entalhe da câmera do Mac).

## Decisão

- O que é do app vai na spec: `layout.desktop` no app.json, com `titleBar` (`hidden` ou `system`), `translucent`,
  `drawerFrom`, `density` e `systemFont`. A chave só vale dentro de uma janela de desktop: no navegador é ignorada, então
  o mesmo app.json serve o site e o app de desktop.
- O que é de quem roda vem por uma **porta**: `DesktopHost { platform, notch? }`, passada em `<C3Shell desktopHost>`. A
  shell junta as duas (`desktopFrame`, sem React) e entrega o layout ao `C3Layout` pelo contexto do motor e a fonte e a
  densidade ao tema. Os tokens do sistema em `theme.tokens` vencem os da moldura.
- `@c3theme/electron` é só adaptador: `electronDesktop()` no renderer (a plataforma pelo `navigator`) e `windowFrame()`
  no main, que abre o `BrowserWindow` pela mesma declaração (`hiddenInset` ou `titleBarOverlay`, `vibrancy` ou mica).
- Antes de entrar, o app.json ainda não chegou: com a porta, as telas de entrada ganham a faixa de arrastar a janela
  pela plataforma (`WindowDragBar`).
- A prop `desktop` do `<C3Shell>` fica marcada como obsoleta e, se vier, vence a declaração (para quem já usa); sai numa
  versão maior.
- O entalhe chega no contexto do motor (`useEngine().desktop.notch`) para a faixa dos agentes, que entra na shell com o
  chat no app.json (issue #71).

## Consequências

- **Melhora**: uma declaração só para o renderer e o main; o app de desktop deixa de ter TS de moldura; a porta deixa o
  motor sem saber de Electron (Tauri é outro adaptador da mesma porta).
- **Piora**: o main precisa ler o mesmo app.json que o backend serve. No exemplo ele importa o arquivo; com backend remoto
  a declaração do main pode divergir da servida (a janela abre antes do login, quando o `GET /_meta/app` pode não ser
  permitido).
- **Custo**: nenhum nos backends (Rust e Node repassam o app.json como está) nem na conformidade.

## Alternativas consideradas

- **Plataforma no app.json**: rejeitada; o mesmo app roda no Mac e no Windows.
- **Ler o `layout.desktop` no main pelo `GET /_meta/app`**: rejeitada agora; em sistema com login a rota costuma pedir usuário, e a janela abre antes
  do login.
- **Menu nativo da janela (barra do Mac) montado do `layout.menu`**: fora desta decisão; vira issue `lacuna:` se um
  sistema pedir.
