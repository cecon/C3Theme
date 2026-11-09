# @c3theme/flow

Instale fixando o commit (`github:cecon/C3Theme#<sha>&path:packages/flow`). Cada entrada diz o que muda para quem usa; **Quebra** marca o que exige mudar o app.

## 0.3.0 (2026-11-09)

- Saída que pode ficar sem ligação (issue #3): `FlowPort.optional` não gera `unlinkedOutput`; e a prop `validate` no `FlowEditor` troca a validação do editor pela do app. Sem quebra.

## 0.2.0 (2026-11-09)

- Regras do app (issue #151): `max`, `removable: false` e `defaults` no tipo de passo; `selectedId`/`onSelectedChange` (seleção controlada, opcional) e `extraIssues` no `FlowEditor`. Novos `canAdd` e `isRemovable` no núcleo. Sem quebra.

## 0.1.0 (2026-11-09)

- Pronto para o npm (issue #145): `publishConfig`, `repository`, README e tag `flow-v*` no `release.yml`. Ainda não publicado.
- Primeira versão (issue #126): `FlowEditor` com canvas (arrastar, ligar saída com entrada, zoom, mover a vista, minimapa, organizar), tipos de nó do app com saídas rotuladas e formulário, situação ao vivo por nó com o caminho percorrido, validação marcada no nó e valor controlado `{ nodes, edges }`.
- Núcleo puro em `@c3theme/flow/core`; canvas atrás da porta `FlowCanvasProps`, adaptador padrão React Flow (`@xyflow/react` 12, MIT).
