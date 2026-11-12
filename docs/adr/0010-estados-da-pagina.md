# 0010. Estados da página declarados na spec

## Status

Proposta em 12/11/2026 (issue #99, lacuna do PieceWork cecon/piecework#292), aguardando Eduardo. O mesmo `$defs/states`
serve ao chat (issue #101, ADR 0011).

## Contexto

O PieceWork exige que toda tela que busca dado tenha cinco estados, cada um com texto e ação próprios: carregando,
vazio, erro, sem permissão e offline. No motor, a página da spec não tinha onde declarar isso:

- Página sem permissão mostrava sempre "Você não tem permissão para abrir esta página.", sem dizer como conseguir.
- Nenhum pacote sabia da conexão (`navigator.onLine` ou os eventos `online`/`offline`).
- Carregando, vazio e erro vinham prontos de cada widget, sem texto da página e sem a ação do vazio.

Pelo [ADR 0003](0003-motor-sem-excecoes.md), isso não pode virar TS do sistema: é lacuna do motor.

## Decisão

- **`$defs/states` no app.schema.json**, com `loading { text }`, `empty { text, action? }`, `error { text, retry? }`,
  `forbidden { text, howTo?, action? }` e `offline { text, keeps? }`. Texto é `Text` (literal ou chave de i18n) e ação é
  o `link` que a spec já tem (`path` do app ou `href`). O mesmo formato vale para a página (`pages[].states`) e para o
  chat (#101), para a tela vazia ser igual em todo lugar.
- **Sem permissão e offline valem para qualquer página.** `forbidden` troca o aviso fixo do `PageGate`. `offline` é um
  aviso no alto da página, e a página continua embaixo com o que já carregou.
- **A conexão é uma porta** (`ConnectivityPort`: `online()` e `subscribe`), passada ao `<C3Shell>` como `connectivity`.
  O adaptador padrão lê o navegador; no Electron, onde o pedido vai por IPC, o app passa o sinal do processo main. O
  domínio (`states/states.ts`) não conhece `navigator`.
- **Carregando, vazio e erro precisam de `statesEntity`**: a entidade que diz se a página tem dado. A shell conta os
  registros dela (`GET /{entity}/_aggregate?measure=count`, a rota que o painel já usa) antes de desenhar o corpo do
  painel ou da página registrada: contando é `loading`, zero é `empty`, 403 é `forbidden`, pedido que não chegou ao
  servidor (status 0) é `offline` e o resto é `error`, com "Tentar de novo" refazendo a contagem. Essa regra é pura
  (`probeState`, `stateOfError`).
- **Estado não declarado fica com o padrão da shell** (esqueleto, o vazio e o erro de cada widget, o aviso fixo), e
  página sem `states` é a de antes. O `spec:check` recusa `loading`/`empty`/`error` sem `statesEntity`, `statesEntity`
  fora de `app.entities` ou em página que não é painel nem registrada, e `action.path` que não é página nem entidade.
- **A página registrada desenha os estados das próprias buscas com `<StateView>`**, exportado pelo motor, a partir de
  `page.states`, com o mesmo visual da shell.

## Consequências

- **Melhora**: o PieceWork declara os cinco estados no JSON, sem TS; o usuário sem permissão sabe a quem pedir e,
  sem conexão, continua vendo o que carregou e sabe o que ainda funciona.
- **Piora**: a página com `statesEntity` faz uma contagem a mais antes de abrir. É um pedido pequeno, com a mesma chave
  de cache das listas (`c3-list`), que gravar um registro já atualiza.
- **Limite**: o vazio da página é "a entidade não tem registro", não "todos os widgets vieram vazios". Um painel com
  filtro que zera um widget continua com o vazio do widget. A ação é um link (`path`/`href`); ação de registro não cabe
  numa página, que não tem registro, e ação de lista se alcança pelo `path` da lista.
- **Custo**: só front, spec e documentação; os backends não mudam (a contagem já existe nos dois).

## Alternativas consideradas

- **Somar o estado de cada widget** (página vazia quando todos vierem vazios, erro quando todos falharem): não exige
  declarar entidade, mas cada widget tem a sua ideia de vazio (KPI zero não é vazio) e o painel teria de esperar todos.
  Mais código para uma regra mais difícil de explicar.
- **Repetir o texto da página em cada widget**: seis widgets vazios mostrariam seis vezes o mesmo recado e o mesmo botão.
- **Só `navigator.onLine`, sem porta**: no Electron o navegador pode estar on-line com o backend fora; a porta deixa o
  app dizer o que vale, e a falha de rede da contagem (status 0) também mostra o offline.
