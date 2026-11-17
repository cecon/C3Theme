# 0015. Pacote de entrada enxuto: o motor não baixa biblioteca pesada sozinho

## Status

Aceita em 17/11/2026 (issue #121).

## Contexto

Medindo o pedaço de entrada de um app que usa o motor, três bibliotecas entravam inteiras sem a tela precisar delas:

- o catálogo do `iconsax-reactjs` (6,5 MB): a casca fazia `import('iconsax-reactjs')` quando o app não passava `icons`.
  Como o motor, o `ui` e o `chat` também importam ícones soltos do mesmo pacote de forma estática, o bundler junta tudo
  (`INEFFECTIVE_DYNAMIC_IMPORT`) e a biblioteca inteira vai para a entrada, mesmo para quem passa `icons`;
- o `@hello-pangea/dnd` (152 kB): as rotas importavam o quadro (`EntityBoard`) de forma estática;
- o `qrcode-generator` (35 kB): o `DeviceLink` do `ui`, usado pela seção `pairing` do motor, importava o gerador direto.

## Decisão

1. **Ícones são do app.** O motor não tem mais nenhum `import()` do catálogo. Sem `icons` na casca, nome de ícone da
   spec não desenha nada (a tela continua, como já acontecia com nome desconhecido). Quem quer o catálogo inteiro
   importa `allIcons` do ponto de entrada à parte `@c3theme/engine/icons` e passa em `icons`; a escolha do peso fica
   explícita no código do app.
2. **Página pesada é `lazy`.** O quadro segue o caminho do painel, da documentação da API, do chat e do fluxo:
   `lazy(() => import(...))` nas rotas, com `PanelSkeleton` enquanto chega.
3. **Dependência pesada de componente do `ui` carrega quando o componente aparece.** O `QrCode` busca o gerador na
   primeira vez que desenha (`useQrModules`); até lá o quadro branco já ocupa o lugar, sem salto de layout.

## Consequências

- **Quebra** para app que não passava `icons` e contava com o catálogo automático: passa a ver as telas sem os ícones
  da spec até passar `icons` (os da lista ou `allIcons`). Demo e exemplo do Electron passam `allIcons`; o modelo do
  `create-app` já passava só os citados.
- Nova biblioteca pesada no motor ou no `ui` segue a mesma regra: entra por `lazy`/`import()` na página ou componente
  que a usa, nunca por import estático num caminho que toda tela carrega.
