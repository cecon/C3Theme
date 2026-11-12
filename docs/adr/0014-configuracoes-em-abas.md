# 0014. Configurações em abas, com busca, atalho e confirmação

## Status

Aceita em 12/11/2026 (issue #110, pedido do Piecework; estende o `autosave` do singleton e as abas por `tab` da seção).

## Contexto

O app desktop do Piecework tem uma tela de configurações com várias abas (Geral, Avançado, Atalhos), uma busca que
leva ao ajuste, ajustes que só existem no desktop, atalhos de teclado editáveis, ajustes perigosos que pedem
confirmação e ajustes que só valem depois de reiniciar. O motor já montava a configuração que grava sozinha
(`views.form.autosave` em entidade `singleton`), mas sem abas, sem busca e sem esses quatro comportamentos. Pelo
[ADR 0003](0003-motor-sem-excecoes.md), a tela não pode ser escrita em TS pelo sistema.

## Decisão

1. **Abas**: no `autosave`, as seções com `tab` viram abas como no formulário comum, e a aberta fica em `?tab=` para dar
   link direto ("abrir em Atalhos") e sobreviver ao recarregar.
2. **Busca** (`views.form.search: true`): procura no rótulo, na ajuda (`help`/`hint`), no título da seção e em
   `keywords` do campo, sem acento e sem maiúsculas (`settingsSearch.ts`, puro). Escolher um resultado abre a aba e
   rola até a linha, que fica destacada por um instante.
3. **`format: "shortcut"`**: o atalho trafega na forma canônica (`Ctrl+Alt+Shift+Meta+Tecla`; sem modificador só
   `F1`–`F24`), validado igual na shell, no c3-engine e no engine-node pelos casos de `conformance/documents.json`.
   Atalho repetido no mesmo registro é `unique`. A shell captura a tecla pelo `KeyboardEvent.code` (não depende do
   layout do teclado) e mostra os símbolos no Mac.
4. **`confirmChange`** no campo: antes do `PATCH`, abre um diálogo com `message`, `effect` e `confirmLabel`; com `when`,
   só confirma quando a condição vale sobre o valor novo. Cancelar volta o valor e nada é gravado.
5. **`restart`** no campo (`true` ou o texto): depois de gravar, um aviso fixo pede para reiniciar o app.
6. **`platforms`** na seção: a shell recebe a plataforma pela prop `platform` do `<C3Shell>` (porta; padrão `desktop`
   quando há `desktopHost`, senão `mobile` abaixo do breakpoint `sm` e `web` acima) e esconde as seções de outras
   plataformas, inclusive da busca.

`keywords`, `confirmChange`, `restart`, `search` e `platforms` são só tela: o backend ignora. `pnpm spec:check` recusa
`search`, `confirmChange` e `restart` fora do `autosave`.

## Consequências

- A tela de configurações do Piecework sai inteira do JSON (Storybook: "Telas/Configurações pelo motor").
- Esconder seção por plataforma não é segurança: o campo continua no registro e na API. Ajuste que não pode ser
  gravado em uma plataforma precisa de regra no backend.
- A confirmação e o aviso de reinício vivem só na shell; quem grava pela API não é perguntado.

## Alternativas consideradas

- **Página registrada em TS** para as configurações: contraria o ADR 0003 e cada app refaria a busca e os atalhos.
- **Atalho como `string` com `pattern`**: não garante a ordem dos modificadores nem acha atalho repetido, e a captura
  da tecla ficaria com o sistema.
- **Plataforma detectada só pelo user agent**: não distingue o Electron de um navegador; a porta deixa o host dizer.
