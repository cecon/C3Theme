# 0013. Painel alimentado por resumo do sistema

## Status

Aceita em 12/11/2026 (issue #108, lacuna do PieceWork cecon/piecework#292; estende o painel de `pages[].dashboard`).

## Contexto

O painel (`DashboardDef`) só lia entidades: todo widget tinha `entity` e agregava por `GET /{entity}/_aggregate` ou
pela lista. A tela de uso do PieceWork (`/uso`) é outra coisa: um resumo que o processo principal calcula por período
(tokens por provedor com limite e janela, consumo por agente, custo na moeda) e um card de atualização do app, que é um
objeto único com estado e ações. Nada disso é coleção de registros. Pelo [ADR 0003](0003-motor-sem-excecoes.md), a tela
não podia virar componente registrado, e transformar o resumo em entidade falsa (com `list`, `id` e `_aggregate`)
mentiria sobre o dado e obrigaria o sistema a implementar o contrato de CRUD só para ler.

## Decisão

- **`dashboard.source: { path, refresh? }`** (ou `source` no widget) aponta o endpoint do resumo. A shell faz
  `GET {path}` com a sessão pela porta `C3Client.summary` e recebe `{ data: {...} }` ([`summary.yaml`](../../spec/v0/summary.yaml)).
  A rota é do sistema; o motor só fixa o formato. Widgets do mesmo `source` dividem uma leitura (mesma chave do SWR).
  `refresh` relê a cada N segundos, para o progresso do download.
- **Três widgets novos, sem entidade, lidos por caminho com ponto**:
  - `meter`: um bloco por item (provedor) com valor, `limit`, barra com o % (amarela a partir de 80%, vermelha acima de
    100%) e `details` formatados (`number`, `percent`, `money` com a moeda ISO 4217 do item, `datetime`, `text`).
  - `share`: participação no total em ranking com barras ou rosca (reusa o `DonutChart`); `share` declarado ou o valor
    sobre a soma.
  - `status`: chip do estado por `states`, `fields`, `notices` com `when` (condição de sempre, sobre o objeto), barra de
    `progress`, `message` de erro e `actions`, cada uma um `POST` (porta `C3Client.summaryAction`) cuja resposta com
    `data` é o resumo novo.
- **Quem libera a ação é o sistema**, no próprio objeto (`availability`, padrão `actions`): `{ [id]: { disabled?,
  instruction? } }`. Ação fora dele não aparece; desabilitada mostra a instrução. A spec declara só rótulo e caminho; a
  regra de quando instalar ou reiniciar fica com quem sabe o estado.
- Rótulos da spec são `Text`; o que vem do resumo é dado e aparece como veio.
- Widgets de entidade não mudam: os do resumo não têm `bind` nem `preset`, e o `spec:check` exige um `source`.

## Consequências

- **Melhora**: a tela de uso do PieceWork sai só do app.json; o Electron serve o resumo pelo IPC (`ipcFetch`) sem
  servidor HTTP; o adaptador em memória aceita `summaries` e `summaryActions` para Storybook e testes.
- **Piora**: os caminhos (`tokens.total`) não são conferidos contra um schema do resumo, então um erro de digitação só
  aparece na tela (o widget mostra vazio). Os textos fixos dos widgets ("de", "Nada por aqui.") seguem em português,
  como nos outros widgets do painel.

## Alternativas consideradas

- **Resumo como entidade `source: "system"`** (consulta do sistema): exige `list`, `id`, paginação e `_aggregate` para
  um documento único, e não tem lugar para ações por estado.
- **Um widget `usage` específico de tokens**: resolveria só o PieceWork. `meter`, `share` e `status` servem a qualquer
  cota, ranking pronto ou processo com estado (backup, sincronização, importação).
- **Schema do resumo na spec** (`source.schema`): pegaria caminho errado no `spec:check`, mas dobra o que o sistema
  declara para um ganho pequeno agora. Fica para quando houver mais de um uso.
