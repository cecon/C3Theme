# Spec do motor C3 (v0, rascunho)

A shell (`@c3theme/ui` + `@c3theme/engine`) não tem telas próprias: ela lê a estrutura do sistema por HTTP e renderiza layout, menu e CRUDs a partir de JSON. Cada sistema (backend) é dono do seu banco e das suas migrations e só precisa cumprir este contrato.

```
shell React ──HTTP──▶ backend do sistema (hoje: Axum + SQLite; Node e Postgres ainda não existem)
   │                      │
   │  GET /api/_meta/app            → app.json (layout, menu, páginas)
   │  GET /api/_meta/entities/{e}   → entidade + capabilities do usuário
   │  GET/POST/PATCH/DELETE /api/{e} → dados
   │  POST /api/{e}/{id}/_actions/{a} → comando de negócio (cancelar, reemitir...)
```

| Arquivo                                                            | O que é                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [`v0/app.schema.json`](v0/app.schema.json)                         | Estrutura do sistema: header, menu, footer, páginas custom, entidades                            |
| [`v0/entity.schema.json`](v0/entity.schema.json)                   | Entidade: campos, validação, condições, views de lista e formulário                              |
| [`v0/openapi.yaml`](v0/openapi.yaml)                               | Contrato HTTP (endpoints, paginação, filtros, erros)                                             |
| [`v0/examples/`](v0/examples)                                      | CRM de exemplo: `app.json` e as entidades do cliente, empresa, vendedor, pedido e da organização |
| [`v0/conformance/conditions.json`](v0/conformance/conditions.json) | Casos de teste de condições que a shell e todo backend precisam passar                           |

Validação: `pnpm spec:check` valida os exemplos contra os schemas, checa as referências cruzadas (campo citado em view ou condição existe, operador vale para o tipo, entidade e preset do menu existem etc.) e roda os casos de conformidade contra um avaliador de referência (`packages/engine/src/conditions.mjs`, o mesmo que a shell usa). O JSON Schema é a fonte da verdade e é neutro de linguagem. Os tipos de TS (`packages/engine/src/types.ts`) e as structs de Rust (`crates/c3-engine/src/spec.rs`) ainda são escritos à mão a partir dele; gerar os dois é trabalho pendente, e hoje quem pega divergência é a suíte de conformidade.

## Como um sistema usa o motor

> Já existem `@c3theme/ui`, o renderer [`@c3theme/engine`](../packages/engine), o crate [`c3-engine`](../crates/c3-engine) (Axum + SQLite) e [`@c3theme/conformance`](../packages/conformance).

O motor chega aos sistemas como **pacotes instalados**. Hoje nada está publicado em registro: `@c3theme/ui` e `@c3theme/engine` são `private` e se instalam por git (`"@c3theme/engine": "github:cecon/C3Theme#path:packages/engine"`, o `prepare` compila o `dist` na instalação; o engine tem `@c3theme/ui` como peerDependency), e o crate entra por dependência git sem tag. Publicar (GitHub Packages, tags `engine-v*`) fica para quando o primeiro sistema de fora usar. Todo o código é próprio, sobre bibliotecas de licença permissiva (MUI, Axum, sqlx), então publicar é decisão de negócio, não de licença.

| Peça                   | Onde                     | O que entrega                                                                                                                                                            | O que o sistema continua fazendo                                         |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `@c3theme/ui`          | pacote do monorepo       | tema, layout, componentes                                                                                                                                                | —                                                                        |
| `@c3theme/engine`      | pacote do monorepo       | renderer: lê `/_meta`, monta rotas, lista, formulário, detalhe                                                                                                           | registrar componentes custom                                             |
| `c3-engine`            | crate Rust (git)         | rotas `/_meta` e CRUD genérico para o `Router` do Axum, condição → SQL (dialeto SQLite, executado pelo `Store` do sistema: sqlx ou rusqlite), validação, formato de erro | JSONs das entidades, migrations, autenticação, hooks de regra de negócio |
| `@c3theme/conformance` | pacote do monorepo (CLI) | testes caixa-preta do contrato contra um backend rodando                                                                                                                 | rodar no CI                                                              |

**Backend Axum.** Uma dependência no `Cargo.toml`, nada instalado globalmente:

```toml
c3-engine = { git = "https://github.com/cecon/C3Theme", features = ["sqlx"] }  # ou o adaptador rusqlite, ver crates/c3-engine
```

```rust
let pool = SqlitePoolOptions::new().connect_with(c3_engine::sqlx::sqlite_options(&url)?).await?;
sqlx::migrate!().run(&pool).await?;           // migrations são do sistema
let engine = c3_engine::Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
    .app(include_str!("../c3/app.json"))
    .entity(include_str!("../c3/customer.json"))
    .entity(include_str!("../c3/company.json"))
    .hooks(MinhasRegras)                      // opcional: capabilities por usuário, validações de negócio
    .build()
    .await?;                                  // falha no boot se o JSON e o banco não batem
let app = Router::new().nest("/api", engine.router()).layer(auth);
```

Exemplo completo em [`crates/c3-example`](../crates/c3-example), com as convenções de tabela em [`crates/c3-engine/README.md`](../crates/c3-engine/README.md).

**Front.** O app do sistema fica fino (o `pnpm create-app` gera um assim, com o backend em Rust ou Node; o exemplo completo é o [`apps/engine-demo`](../apps/engine-demo)):

```tsx
<C3Shell apiUrl="/api" components={{ 'crm/painel': Painel, 'placa-input': PlacaInput }} />
```

Direção, ainda não implementada: sistema sem componente custom pode nem ter projeto de front, com o Axum servindo a shell já buildada de dentro do binário.

**Projeto que já existe.** Adoção gradual: monte o `engine.router()` ao lado das rotas atuais e troque uma tela por vez com `<EntityList entity="customer" />` dentro do app que já existe.

**Garantia.** `pnpm conformance` sobe o `c3-example` e roda a suíte (hoje: 91 testes, duas rodadas no mesmo banco). Para outro backend que sirva o CRM de exemplo: `node packages/conformance/src/cli.mjs http://127.0.0.1:3000/api`. A suíte de v0 usa o CRM de exemplo como fixture, então testa **implementações do contrato** (c3-engine, futuro adapter Node), não cada sistema; um modo genérico para rodar contra qualquer sistema fica para depois.

**Versões.** `specVersion` no JSON; a versão maior dos pacotes acompanha a da spec (spec v0 → `0.x`).

**Skills para agentes (opcional).** O plugin [`plugins/c3`](../plugins/c3/README.md) ensina um agente de código a escrever a spec, o backend e o front (`c3-spec`, `c3-backend`, `c3-front`, `c3-chat`). É atalho, não requisito: tudo tem que ser fácil de fazer à mão.

## Layout e rotas

O app declara as quatro regiões da shell em `layout`:

- **header**: busca, tela cheia, idiomas, itens extras no menu do usuário e componentes custom (`actions`).
- **menu**: grupos de itens. Adicionar uma tela é uma linha: `{ "entity": "customer" }`. Título, ícone e rota saem da entidade. A mesma lista pode abrir já filtrada: `{ "entity": "customer", "preset": "vip-sem-empresa", "title": "VIPs" }`. O preset pode trazer `defaults`, os valores iniciais do registro novo criado com ele ativo: com `"defaults": { "eh_cliente": true }` no preset "Clientes", o "Adicionar" da lista de clientes já abre com o papel marcado (a shell leva o preset na rota, `/{entity}/new?preset=clientes`). É conveniência da tela; a regra continua no backend.
- **body**: é a rota ativa, não se configura.
- **footer**: texto e links, ou `null` para esconder.

Rotas de entidade são derivadas, ninguém as declara:

| Rota                 | Tela                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| `/{entity}`          | lista (`views.list`), com `?preset=` opcional                             |
| `/{entity}/board`    | quadro (`views.board`), com `?preset=`                                    |
| `/{entity}/calendar` | calendário (`views.calendar`), com `?preset=` e `?month=2026-10`          |
| `/{entity}/report`   | relatório (`views.report`), com os mesmos filtros da lista                |
| `/{entity}/map`      | planta (`views.map`), com `?preset=`                                      |
| `/{entity}/new`      | formulário de criação (`views.form`); `?f.<campo>=valor` preenche o campo |
| `/{entity}/:id`      | detalhe (formulário em modo leitura, com botão editar)                    |

As rotas fixas ganham do `:id`: um registro com id `new`, `board`, `calendar`, `report` ou `map` não abre pela URL. Ids são gerados pelo backend, então isso não acontece na prática.

## Login pela shell

Com `auth` no app.json, a shell também monta as telas de entrada: login, e se ligados, cadastro, "esqueci a senha" (código por e-mail e senha nova) e "Meu perfil". Sem `auth`, nada muda: o sistema cuida do login e passa o token em `headers`.

```json
"auth": { "subtitle": "Use o usuário do posto", "identifier": "username", "forgotPassword": true, "register": false }
```

- **Quem autentica é o sistema.** O front passa uma porta (`<C3Shell auth={...}>`, interface `AuthPort` do `@c3theme/engine`): `login` e `me` são obrigatórios; `register`, `forgotPassword`/`verifyCode`/`resetPassword`, `updateProfile` e `changePassword` ligam as telas correspondentes. Uma tela só aparece quando o `auth` liga e a porta implementa. O adaptador pronto `httpAuth('/api')` segue a convenção `/auth/*` (`POST /auth/login {identifier, password}` → `{token, user}`, `GET /auth/me` → `{user}` etc.); o c3-example implementa `login` e `me` (`crates/c3-example/src/login.rs`, só demonstração).
- **`GET /_meta/login` é público**: traz só `name` e `auth`, para a shell desenhar a entrada antes de haver usuário. O sistema deixa essa rota fora da camada de autenticação; o resto do `/_meta` continua exigindo token.
- Com sessão, a shell manda `Authorization: Bearer <token>` em todo pedido, guarda o token no navegador, valida com `me` ao abrir, mostra o usuário e "Sair" no cabeçalho e volta ao login num `401`, retornando depois ao endereço que o usuário queria.

## Quadro e calendário

Uma entidade pode ter, além da lista, um quadro (kanban) e um calendário. São só JSON na entidade: nenhum componente, nenhum endpoint novo. A shell lê cada coluna e cada mês com o mesmo `GET /api/{entity}` da lista (`where` montado por ela) e move o cartão com o `PATCH` de sempre, então validação, permissão e hooks do backend valem igual.

```json
"views": {
  "board": { "groupBy": "stage", "columns": ["todo", "doing", "done"], "fields": ["customer_id", "due_date"] },
  "calendar": { "start": "due_date", "color": "stage", "fields": ["customer_id"] }
}
```

- **board**: uma coluna por valor do enum `groupBy`, na ordem de `columns` (ou de `options`; `columns` serve para esconder estados finais). O cartão mostra o `titleField` e até 4 `fields` (enum vira chip; os outros, uma linha cada); `code` põe um campo acima do título na cor primária, `due` mostra o prazo em chip (vermelho se venceu, amarelo em até 2 dias), `assignee` o avatar do responsável (reference) e `counters` contadores com ícone (`[{ "field": "comentarios", "icon": "MessageText1" }]`). `done` aponta o valor da coluna de concluídos: título riscado, prazo verde e um visto no cabeçalho. Clicar abre o registro num diálogo, já editando quando o usuário pode alterar. No pé de cada coluna, "Adicionar cartão" cria só com o título e o valor da coluna; se o backend pedir mais campos, abre o formulário com o que foi digitado (`quickAdd: false` volta ao botão de criar no topo). Arrastar grava `groupBy` quando o usuário tem `update` e o campo não é `readOnly`, `createOnly` nem `readOnlyWhen`; senão o quadro é só leitura. Se o backend recusar (regra de negócio), o cartão volta e o motivo aparece num aviso. Dentro da coluna, a ordem é o `defaultSort` da lista, não a do arrasto: posição manual exigiria um campo de ordem que o contrato não tem. Cada coluna carrega `pageSize` cartões (padrão 50) e mostra "Ver mais". Funciona pelo teclado (espaço pega o cartão, setas movem, espaço solta).
- **calendar**: cada registro no dia do campo `start` (`date` ou `datetime`), até `end` se houver; `color` é um enum cuja cor pinta o evento (borda à esquerda e fundo suave). Mês, Semana, Dia e Agenda, com "Hoje" e as setas. Evento de vários dias é uma barra contínua. Em `date` o `end` é o último dia (inclusivo); em `datetime` é exclusivo, como em qualquer agenda: terminar às 00:00 não ocupa aquele dia. `allDay` (só com `start` datetime) aponta um campo boolean; verdadeiro, o evento aparece sem hora. Clicar ou arrastar sobre dias (ou horários) abre o registro novo num diálogo com o período; clicar no evento abre ele no diálogo, já editando quando o usuário pode alterar. Arrastar o evento ou esticar a ponta grava o novo período pelo `PATCH` (com `If-Match`); recusado, o evento volta. No celular abre na Agenda. Mais de 500 registros no período viram um aviso pedindo filtro. O botão de criar usa `label.new` ("Novo evento"). A troca para a lista só aparece se a entidade tiver outra visão além da agenda (quadro, relatório, planta).
- Os presets da lista valem nas três telas, e a troca entre lista, quadro e calendário leva o preset junto. O menu escolhe a tela com `view`: `{ "entity": "activity", "view": "board", "title": "Funil" }`.
- `pnpm spec:check` confere que `groupBy` e `color` são enum, que `start` e `end` são datas do mesmo tipo, que `allDay` é boolean com `start` datetime, que `columns` está em `options` e que o `view` do menu existe na entidade.

Exemplo: [`activity.json`](v0/examples/activity.json).

## Relatório

`views.report` monta, em `/{entity}/report`, todas as linhas que o filtro da lista alcança (mesmos presets, filtros, busca, parâmetros da consulta e filiais), agrupadas, com subtotal e total geral, e um botão Imprimir. É o relatório tabular que antes pedia código próprio.

```json
"report": {
  "title": "Pedidos por vendedor e situação",
  "groupBy": ["seller_id", "status"],
  "columns": ["number", "description", "customer_id", "total"],
  "subtotals": ["total"],
  "sort": "-total"
}
```

- **groupBy**: um ou dois campos (enum, boolean, reference, string, date ou integer). Grupos de enum na ordem de `options`, o resto pelo texto mostrado; o vazio sai por último, como "(vazio)". Dentro do grupo, as linhas seguem `sort` (padrão: a ordem da lista).
- **subtotals**: colunas integer ou decimal somadas por grupo e no total geral. Decimal soma na escala do campo, sem erro de arredondamento. O nome do grupo vai na primeira coluna, então ela não pode ser somada.
- **tree** (`{ "parent": "conta_mae_id" }`, reference para a própria entidade): cada linha abaixo da mãe, com recuo. Linha cuja mãe ficou fora do filtro vira raiz. A árvore **só exibe**: os valores de cada nível (inclusive linhas de fórmula, como o resultado da DRE) vêm do sistema, numa [consulta do sistema](#consulta-do-sistema-parâmetros). Somar na shell dobraria os totais, então `tree` não junta com `groupBy` nem com `subtotals`.
- **Sem endpoint novo.** A shell lê o GET da lista em páginas de 100, até 10 mil linhas (o limite da exportação). Acima disso, mostra o aviso para filtrar e nenhum número, porque um total pela metade engana. Relatório maior que isso é consulta do sistema que já devolve agregado.
- **Impressão**: o papel sai sem menu, cabeçalho e rodapé do app, com o título, o nome do app, a data e hora de emissão e os filtros aplicados (preset, filtros, busca, parâmetros e filiais). A troca entre lista, quadro, calendário e relatório leva o preset junto.
- `pnpm spec:check` confere que colunas, grupos, subtotais, `sort` e `parent` existem e têm o tipo certo, e recusa relatório em singleton.

## Planta

`views.map` mostra cada registro como um bloco, colorido pela situação, onde ele fica de verdade: as mesas do salão, a ilha, a bomba e o bico da pista, o setor do KDS. Rota `/{entity}/map`, com os presets da lista. Clicar num bloco abre o registro num diálogo, com as ações que valem para ele agora e o atalho para o formulário. Com `live` na entidade, a planta acompanha quem abre e fecha mesa sem recarregar.

```json
"map": { "color": "status", "fields": ["seats"], "position": { "x": "x", "y": "y", "w": "w" } }
"map": { "color": "status", "groupBy": ["island_id", "pump_id"], "size": "small" }
```

- **Por coordenada** (`position`): `x` e `y` são campos integer (coluna e linha de uma grade, a partir de 1); `w` e `h`, opcionais, são quantas células o bloco ocupa (a mesa grande). Quem não tem coordenada válida (vazia, zero, coluna ou linha acima de 200, bloco com mais de 20 células de lado) vai para uma faixa "Sem lugar na planta", em vez de empilhar no canto ou travar a tela; quem cai em cima de outro bloco vai para uma faixa de conflito. Ponha `max` nos campos para o formulário recusar antes. Mudar o lugar é editar o registro: a planta não arrasta, para ninguém mover a mesa sem querer.
- **Por grupo** (`groupBy`, um ou dois campos enum, reference, string ou integer): caixas aninhadas com os blocos dentro, na mesma ordem do relatório (options do enum; o resto pelo texto; o vazio por último). Ilha e bomba são reference para as entidades delas, e o título da caixa é o título da ilha. `position` e `groupBy` não se misturam.
- **Cor e legenda** (`color`): um enum cujas options têm `color`. A legenda mostra quantos blocos há em cada situação. Sem `color`, os blocos ficam neutros.
- **No bloco:** o título do registro, a situação e até 3 `fields`, com o nome de cada um. `size` (`small`, `medium`, `large`) muda o tamanho do bloco e da célula.
- **Limite:** lê até 500 registros do filtro; acima disso avisa para filtrar. No celular, a planta por coordenada rola de lado dentro do quadro (a geometria do salão importa mais que caber na tela).
- **Sem endpoint novo:** usa o GET da lista, ordenado pelos grupos ou pela linha e coluna. As ações são as do registro (`actions`), com `visibleWhen`, confirmação e input como em qualquer tela.

## Tempo real

`"live": true` na entidade (ou `"live": { "sound": { "on": ["created"] } }`) faz a lista, o quadro, o calendário e o relatório abertos relerem na hora quando um registro entra, muda, sai ou passa por uma ação. É o KDS da cozinha, os bicos da pista, as requisições e as comandas. A shell assina `GET /api/{entity}/_events` (SSE, [events.yaml](v0/events.yaml)) só enquanto a tela está aberta.

- **O aviso não traz o registro**, só `{ "change": "created" | "updated" | "deleted" | "changed", "id" }`. A shell relê pela listagem de sempre, com o mesmo filtro, página e permissões. Avisos que chegam juntos viram uma releitura só.
- **Quem recebe:** precisa de `list` na entidade. `created` e `updated` só chegam a quem enxerga o registro (filial e `rowAccess`, conferidos a cada aviso). `deleted` não tem o que conferir: leva só o id. `changed` (sem id) quer dizer "relê tudo", e vem de ação da lista, de ação em conjunto ou de assinante que ficou para trás.
- **Som:** `sound.on` toca dois toques curtos gerados pelo navegador, no máximo um por segundo. O navegador só libera áudio depois que o usuário clicou na página: a tela do KDS precisa de um clique ao abrir.
- **Conexão:** caiu, a shell reconecta (1 s, dobrando até 30 s) e relê ao voltar, porque pode ter perdido avisos. 401, 403 e 404 param de tentar. Trocar de filial reassina.
- **O registro aberto em leitura é relido** quando o aviso é dele (ou não diz qual): campos e ações com `visibleWhen` atualizam sozinhos. **Em edição, não é relido**, porque reler por cima do que o usuário digita perde o que ele digitou. Quem salvar por cima de outra pessoa recebe o 412 da versão do registro.
- **O canal é do processo.** Gravações e ações feitas pelo motor avisam sozinhas. Gravação feita fora dele (o PDV gravando direto no banco, um job, outra instância do backend) só chega se o sistema avisar. No c3-engine, crie o canal antes do motor e guarde um clone nos hooks: `let live = Live::new(); Engine::builder(store).live(live.clone())…`, e depois do commit `live.notify("kds_ticket", Some(&id), Change::Created)`. Com mais de uma instância, o sistema leva o aviso de uma para a outra (Postgres `LISTEN/NOTIFY`, Redis) e chama `notify` em cada uma.
- **Custo:** uma conexão aberta por tela aberta, mais uma releitura do banco por aviso e por assinante (a conferência de quem enxerga). Serve bem para dezenas de telas abertas. Carga do sistema que mexe em muitos registros de uma vez deve mandar um `changed` só, não um aviso por registro.

## Notificações (sino)

`layout.header.notifications: true` põe o sino no header da shell: contador de não lidas, os últimos 20 avisos, "marcar todas como lidas" e, ao clicar, marca como lido e abre o `to` do aviso. Contrato em [notifications.yaml](v0/notifications.yaml).

- **Os avisos são do sistema.** Ele guarda (tabela própria, outro serviço), cria quando o fato acontece (agente terminou, pedido esperando aprovação, versão nova) e diz de quem é cada um. O motor só expõe `GET /_notifications?limit=`, `POST /_notifications/_read` (`{ "ids": [...] }` ou `{}` para todos) e o SSE `GET /_notifications/_events`. No c3-engine, implemente `Notifications` (`audience`, `list`, `mark_read`) e passe em `Engine::builder(store).notifications(..)`; no engine-node, `buildEngine({ notifications })`. Sem a porta, as três rotas respondem 404 e o sino fica vazio.
- **Tempo real:** o SSE manda `ready` e depois um `notification` (sem conteúdo) a cada mudança na lista do usuário; a shell relê o GET. Marcar como lido avisa as outras abas sozinho. Aviso criado pelo sistema chega se ele avisar: `let bell = Bell::new(); Engine::builder(store).bell(bell.clone())…` e, depois de gravar, `bell.notify(&usuario)` (no engine-node, `new Bell()` e `bell.notify(usuario)`). Reconexão como no `live`.
- **Item:** `{ id, title, description?, tone?, createdAt, readAt, to? }`. `readAt` null é não lido; `unread` conta todos os não lidos do usuário, não só os da página.

## Painel

Uma página de `pages` pode ser um painel descrito no próprio app.json, sem componente: indicadores, gráficos e listas curtas lidos do contrato, com o mesmo escopo, filial ativa, `rowAccess` e permissão de campo da lista.

```json
{
  "path": "/painel",
  "title": "Painel",
  "dashboard": {
    "widgets": [
      { "type": "kpi", "title": "Valor em aberto", "entity": "sales_order", "preset": "em-aberto", "measure": "sum:total" },
      { "type": "chart", "title": "Clientes por status", "entity": "customer", "groupBy": "status", "width": 4 },
      {
        "type": "list",
        "title": "Atividades pendentes",
        "entity": "activity",
        "preset": "pendentes",
        "columns": ["subject", "due_date"],
        "sort": "due_date"
      }
    ]
  }
}
```

- **kpi**: um número, `count` (padrão) ou `sum:<campo>` (integer ou decimal). Clicar leva à lista com o mesmo preset. Com `icon` (do catálogo) e `tone` vira o cartão completo: ícone colorido ao lado do título e do valor, `count: true` mostra quantos registros ("25 faturas") e `progress: { "label": "do total", "whole": {...} }` desenha a barra com o %: `part` (somado ao filtro do widget; ausente, o próprio widget) sobre `whole` (ausente, o filtro do widget). "Total faturado" com "recebido" é `progress: { "label": "recebido", "part": { "field": "status", "op": "eq", "value": "paga" } }`.
- **chart**: `groupBy` num campo enum, boolean ou reference vira barras deitadas (enum na ordem de `options`; o resto do maior para o menor); num campo de data vira linha no tempo, por `interval` (`day`, `month` padrão, `year`), com os períodos sem registro em zero. Uma série só, sem legenda; o botão do canto mostra o mesmo dado como tabela. `chart: "donut"` faz a rosca com a legenda (cor da opção, %, valor). `chart: "area"` (data) faz linhas suaves com área e legenda: `series: [{ "label": "Faturado" }, { "label": "Recebido", "where": {...}, "tone": "success" }]`, cada série com seu filtro somado ao do widget, e `ranges: [6, 12]` põe a escolha dos últimos N períodos no cabeçalho (o maior é o padrão); `axisScale: 1000` mostra o eixo em mil (diga a unidade no `subtitle`). `subtitle` vale em chart, ranking e feed.
- **ranking**: os maiores grupos de `groupBy` pela `measure` (até `limit`, padrão 5), com as iniciais, `caption` ("{count} {label} em aberto": a quantidade e o nome da entidade no singular ou plural), o valor e o chip de `flag` (`{ "where": vencidas, "label": "{value} vencido", "tone": "danger", "otherwise": { "label": "No prazo", "tone": "warning" } }`). Com `groupBy` reference, `action` põe em cada linha o botão de uma ação de registro (sem input nem confirm) da entidade apontada, rodada no registro do grupo ("Cobrar").
- **feed**: avisos recentes, do mais novo ao mais velho: o título do registro, o campo `text` embaixo e há quanto tempo (`time`, date ou datetime). Ícone por valor do enum `kind` (`icons`) e cor pelo `color` da opção.
- `dashboard.actions`: até 4 botões no topo, à direita (`label`, `path`, `icon`, `variant` `outlined` padrão ou `contained`), para a lista e para criar.
- **list**: os primeiros `limit` registros (padrão 5, até 10) com `columns` e `sort`; cada linha abre o registro.
- **alert**: aviso ("12 vendas sem NFC-e") que conta os registros do recorte e só aparece com contagem acima de zero; `text` com `{count}`, `tone` `warning` (padrão), `error` ou `info`. Sem `title`. Clicar leva à lista com o mesmo recorte.
- Todo widget tem `title`, `entity`, `preset` (de `views.list.presets`) e `where` (somado ao preset). Clicar leva à lista com o mesmo recorte: o preset vai como preset, e o `where` (com os filtros do painel) vai no parâmetro `w` da URL, que a lista soma aos dela e mostra como o chip "Recorte do painel", removível. `width` vai de 1 a 12 colunas no desktop (padrão: kpi 3, chart, list, ranking e feed 6, alert 12); no celular cada widget ocupa a linha. Widget de entidade que o usuário não lista não aparece.
- **Filtros do painel** (`dashboard.filters`, até 4): `{ "name": "periodo", "type": "period", "default": "month" }` (hoje, esta semana, este mês, mês passado, últimos 7 ou 30 dias, este ano, tudo) e `{ "name": "vendedor", "type": "reference", "entity": "seller" }` (busca pelo título; vazio não filtra). Cada widget diz quais usa e em qual campo dele: `"bind": { "periodo": "due_date", "vendedor": "seller_id" }`. O período vira `gte` início e `lt` fim em datas relativas (`$date`), resolvidas pelo relógio do sistema, e o registro vira `eq`. Tudo é somado (e) ao preset e ao `where`. Widget sem `bind` não muda com o filtro, de propósito: "Clientes ativos" não tem período. O valor fica na URL (`f.<nome>`), e voltar e compartilhar funcionam.
- Os números vêm de `GET /api/{entity}/_aggregate?measure=sum:total&groupBy=seller_id&where=...` ([`aggregate.yaml`](v0/aggregate.yaml)): `{ data: [{ key, title?, value }] }`, com o filtro da lista. Soma de decimal vem em string, como o campo. Campo oculto ao usuário não agrupa nem soma (400). No máximo 100 grupos; o grupo vazio (`key: null`) vem por último.
- `pnpm spec:check` confere entidade, preset, campos de `measure`, `groupBy`, `columns` e `sort`, e que `interval` e `chart: "line"` só aparecem com data. Nos filtros: nome único, entidade do reference em `app.entities`, e cada `bind` ligando filtro que existe a campo do tipo certo (período em date/datetime, registro em reference para a mesma entidade).

## Página custom e mestre-detalhe

Fora do painel, telas que não são CRUD vão em `pages` com `component` (`{ "path": "/relatorio", "component": "crm/relatorio" }`) e apontam para um componente registrado na shell. Esse registro por nome (`component`) também existe em coluna, campo do formulário, seção de formulário, detalhe e header: é a saída para o que o motor não cobre, sem fork da shell.

**Página registrada.** Tela que o motor não monta (caixa do PDV com TEF, montagem do pedido do delivery) continua código do sistema, mas fechada num componente com nome, e o que varia por loja vira JSON:

```json
{
  "path": "/balcao",
  "title": "Balcão",
  "component": "balcao",
  "permission": "loja.balcao",
  "layout": "blank",
  "config": { "keys": { "F2": "quantidade", "F9": "espera" }, "columns": ["descricao", "quantidade", "total"] }
}
```

- **`config`** chega ao componente como prop (`CustomPageProps`, com `config` e `page`). O componente publica o schema dele em `components/<component>.schema.json`, ao lado do `app.json`, e o `spec:check` valida o `config` contra esse schema. `config` sem schema é erro. Página sem `config` é validada como `{}`: se o schema do componente tem `required`, toda página que usa o componente precisa trazer `config` (é o componente que decide o que é obrigatório). Teclas, colunas, textos e atalhos ficam no config, e não no código.
- **`permission`** é um código de permissão do sistema, como em `access` e `rowAccess`. `GET /_meta/app` devolve `pages` com `{ "/balcao": true }` para cada página com `permission`, conferido por `Hooks::permitted` na filial ativa (filial do cabeçalho que não vale mais não dá erro: a resposta sai sem filial, e a shell pergunta de novo ao escolher ou trocar de filial). Vale também para página `dashboard`. Sem permissão, a shell tira o item do menu e a rota mostra "sem permissão". Isso só esconde a tela: o que o componente chama no backend continua conferido pelo sistema.
- A shell monta só o layout (`"blank"` para tela cheia), o tema, a navegação e a permissão. Comportamento (bipagem, TEF, fila offline) é do componente e do backend do sistema. O contrato genérico não ganha nada específico de estação.

**Mestre-detalhe (1:N).** Uma seção do formulário pode listar os filhos do registro: `{ "title": "Clientes", "related": { "entity": "customer", "field": "company_id" } }` mostra, na tela da empresa, os clientes cujo `company_id` aponta para ela. A seção só aparece em registro já salvo. Adicionar e editar abrem o formulário da entidade filha num diálogo, com `field` preenchido e travado. As permissões são as da filha. Os filhos passam pelo CRUD normal da filha, sem endpoint novo: cada filho grava sozinho.

**Filhos gravados junto com o pai.** Quando o filho só existe dentro do pai (itens do pedido, endereços da pessoa, códigos de barras do produto, faixas da tabela de preço), a seção ganha `"save": "with_parent"`:

```json
{ "title": "Itens", "related": { "entity": "sales_order_item", "field": "order_id", "save": "with_parent", "maxItems": 200 } }
```

A filha continua sendo uma entidade, com campos, tipos, validações, tabela e migration próprias. Ela não vira um "campo do tipo lista" do pai, porque isso duplicaria os tipos, quebraria coluna, filtro, condição e exportação, e o motor precisaria da tabela de qualquer jeito para ler os filhos.

- **Leitura**: `GET /{pai}/{id}` traz a lista inteira na chave com o nome da filha (`"sales_order_item": [...]`), com as linhas no formato trafegado e na ordem de `sort` (padrão: ordem de inclusão). A listagem do pai não traz filhos.
- **Escrita**: a lista vai no corpo do `POST`/`PATCH` do pai e **substitui a gravada**. Linha com `id` altera (o `id` precisa ser filho deste pai; senão, `422` em `{filha}.{posição}.id`), linha sem `id` inclui e linha gravada que não veio é excluída. Sem a chave, o `PATCH` não mexe nos filhos e o `POST` grava a lista vazia. A coluna do pai (`field`) é preenchida pelo motor; se vier no corpo, é ignorada.
- **Validação por linha**: cada linha passa pelas mesmas regras da filha (schema, `reference` e escopo, `Hooks::validate`). Os erros voltam junto com os do pai, com a posição da linha: `fields["sales_order_item.2.quantity"]`. Regra que compara as linhas entre si ou com o pai (soma dos itens contra o total, "libera depois de" com ordem menor) vai no `Hooks::validate_children` do c3-engine, que recebe as listas como vão ficar e só roda quando o resto passou. Erro da lista inteira vai em `fields["sales_order_item"]`: `too_few` (`minItems`) ou `too_many` (`maxItems`, padrão 200, teto 500). `unique` violado numa linha é `409` com a chave da linha.
- **Uma transação**: o pai e as linhas são gravados juntos, excluindo, alterando e incluindo, nessa ordem. Se uma linha falha, nada fica gravado. Com escrita delegada, o `WriteCall` traz `children` (inclusões, alterações e exclusões, com a posição de cada linha e o `before`), e o escritor do sistema grava tudo na transação dele (exemplo: `crates/c3-example/src/items.rs`). Excluir o pai exclui os filhos na mesma transação.
- **Permissão e escopo**: valem os do pai. A filha precisa ter o mesmo `scope` do pai, e as linhas herdam a empresa e a filial dele. O CRUD direto da filha responde `403` e as `capabilities` dela não oferecem escrita, para ninguém gravar um item sem passar pelo escritor e pela auditoria do pedido. Ler e listar continuam permitidos. Uma filha `with_parent` tem um pai só.
- **Limites**: acima de 500 linhas não cabe num formulário, e aí vale a seção comum (paginada, CRUD próprio). Edição concorrente: a lista substitui a gravada, então sem `If-Match` quem salva por último vence, e a lista da segunda pessoa apaga a linha que a primeira incluiu. O `PATCH` do pai com `If-Match` (ver [Versão e Desfazer](#versão-e-desfazer)) recusa com `412`, mas a `_version` do pai não conta as linhas: ela protege os campos do pai, não a lista. O formulário da shell ainda não manda `If-Match`. Quem altera uma linha que outra pessoa excluiu recebe `422 not_found` naquela linha.
- **Na shell**: a seção aparece também no registro novo. Com até 4 campos simples, a linha é editada no lugar, com "Adicionar" no fim da lista e o número da linha no rótulo do primeiro campo ("Descrição do item 2"); com `minItems`, o registro novo já abre com essas linhas vazias e a lixeira trava no mínimo. Com mais campos, texto longo ou condição, a edição é num diálogo (tela cheia no celular) com "Aplicar", que só muda o rascunho. Nada é gravado antes do "Salvar" do pai.
- **Uma linha só** (`"maxItems": 1`: dados fiscais da empresa, endereço de entrega): a shell mostra os campos da filha direto na seção, sem grade, na disposição das `rows` do formulário dela. Com `minItems: 0`, uma chave "Informar" liga e desliga a linha (desligar exclui no Salvar); com `minItems: 1`, os campos estão sempre lá, e um registro novo manda a linha mesmo vazia, para os erros caírem nos campos (`company_fiscal.0.tax_regime`). O contrato é o mesmo de qualquer `with_parent`: uma lista com zero ou uma linha. Quem quer garantir no banco põe `UNIQUE` na coluna do pai. `minItems`, `maxItems` e `display: checklist` só existem em `with_parent`: em `separately` cada filho grava sozinho e o limite não teria como valer, então o `spec:check` e o boot do c3-engine recusam (antes o motor ignorava em silêncio e a 2ª linha passava).

**Lista de marcar (N:N).** Quando a filha só liga o pai a outro cadastro (permissões do perfil, produtos permitidos do veículo, perguntas do produto), a seção `with_parent` ganha `"display": "checklist"`:

```json
{
  "title": "Permissões",
  "related": {
    "entity": "role_permission",
    "field": "role_id",
    "save": "with_parent",
    "display": "checklist",
    "option": "permission_id",
    "groupBy": "module",
    "maxItems": 500
  }
}
```

- `option` é o `reference` da filha cujos registros são as opções; `groupBy` (opcional) é um campo da entidade das opções que agrupa a lista. Os outros campos editáveis da filha viram colunas da matriz (o "Altera" de cada permissão), editáveis só na linha marcada.
- O contrato é o de qualquer `with_parent`: cada opção marcada é uma linha (`{ "permission_id": "4", "can_write": true }`), desmarcar tira a linha. A mesma opção duas vezes é `422 duplicate` em `{filha}.{posição}.{option}`; quem quer garantir no banco põe `UNIQUE (pai, opção)`.
- **Na shell**: todas as opções com uma caixa de marcar, agrupadas, com "marcar todas" por grupo e busca acima de 12 opções; no detalhe, só as marcadas. As opções vêm da listagem normal da entidade (página a página). O teto é o `maxItems` (até 500): ao chegar nele, as caixas desmarcadas travam. Catálogo maior que isso não é lista de marcar.

**Abas no formulário.** Cadastro grande (produto, pessoa) separa as seções em abas com `tab` em cada seção, sem bloco novo no JSON:

```json
"sections": [
  { "rows": [["code", "name"]] },
  { "title": "Fiscal", "tab": "Fiscal", "rows": [["ncm", "cest"]] },
  { "title": "Tributação", "tab": "Fiscal", "rows": [["cfop"]] },
  { "title": "Códigos de barras", "tab": "Códigos", "related": { "entity": "product_barcode", "field": "product_id", "save": "with_parent" } }
]
```

- Seções com a mesma `tab` ficam juntas, na ordem em que aparecem. As abas seguem a ordem da primeira seção de cada uma. `tab` aceita texto ou chave de tradução, como `title`.
- Seções sem `tab` ficam acima das abas, sempre visíveis (código e nome do produto, por exemplo), e vêm antes de todas as com `tab`. Usando abas, são pelo menos duas. O `pnpm spec:check` recusa as duas coisas. Formulário sem `tab` não muda.
- Vale para qualquer seção, inclusive `related` (as duas formas de `save`). É só layout: o contrato da API não muda, e o corpo do `POST`/`PATCH` leva os campos de todas as abas.
- **Na shell**: cada aba mostra quantos erros tem (campos das linhas e linhas da filha, `itens.2.ean`). Se salvar falha com erro numa aba fechada, a shell abre a primeira aba com erro. No celular, a barra de abas rola na horizontal. Uma aba sem nada para mostrar some (ex.: filhos com CRUD próprio no registro novo), e se sobra uma aba só, as seções aparecem sem a barra.

**Seção condicional.** `visibleWhen` na seção (mesma condição do campo, sobre os valores atuais do formulário) mostra a seção só quando vale: aba Cliente só com o papel Cliente marcado, períodos só com bom-para `PROGRAMADO`.

```json
{
  "title": "Fornecedor",
  "tab": "Fornecedor",
  "visibleWhen": { "field": "is_supplier", "op": "eq", "value": true },
  "rows": [["supplier_terms"]]
}
```

- Escondida, tudo o que a seção mostra vale como escondido, na shell e no backend: os campos das linhas não são validados e gravam null (como no `visibleWhen` do campo); a lista `with_parent` vale vazia, e o que estava gravado é excluído mesmo que a lista não venha no corpo. Uma `related` separately só some da tela.
- A condição não cita campo da própria seção (escondida, nada a mostraria de volta), e campo de seção condicional não aparece em outra seção. O `spec:check` e o boot do c3-engine recusam.
- Aba cujas seções estão todas escondidas some.
- **Na shell**: desmarcar o que esconde uma seção com dado gravado e salvar pede confirmação ("Apagar dados escondidos?"), porque o salvar apaga esses dados.

**Campo travado depois de gravado.** `createOnly: true` (código da máquina, login) aceita o valor só na criação. `readOnlyWhen` trava o campo quando a condição vale para o registro **como está gravado**, não para o formulário: `"readOnlyWhen": { "field": "custo", "op": "null", "value": false }` deixa o custo editável só enquanto o produto não tem custo (se a condição olhasse o formulário, o campo travaria assim que o usuário digitasse).

- Na alteração, mudar um campo travado é `422 validation_failed` com `read_only` no campo; mandar o mesmo valor (inclusive em outra grafia, `"12.5"` e `"12.50"`) passa, porque a shell manda o registro inteiro. Na criação nada trava. Vale também nas linhas `with_parent` que já existem (`itens.2.custo`).
- Não combina com `readOnly` (que nunca é editável) nem existe no input de ação.
- `readOnly` segue a mesma regra na alteração: mandar outro valor é `422` com `read_only` no campo ("Este campo é preenchido pelo sistema e não se altera por aqui.") e nada é gravado; o mesmo valor (o registro lido reenviado, reference como `{ id, label }` inclusive) passa e não se grava. Na criação o `readOnly` enviado continua ignorado. Antes, o PATCH descartava o campo em silêncio e respondia 200: o cliente da API achava que tinha mudado (inativar pelo `ativo` readOnly, por exemplo; quem muda esses campos é a ação ou o DELETE do sistema).
- **Na shell**: no registro gravado o campo aparece só leitura, com "Não pode mais ser alterado.". Nas linhas filhas, por enquanto, só o backend trava (o erro aparece na linha ao salvar).

**Layout, valores iniciais e contas do formulário.** Uma fatura com itens, observações e resumo:

```json
"form": {
  "actions": "footer",
  "submitLabel": { "new": "Criar fatura", "edit": "Salvar alterações" },
  "initial": { "emissao": { "$date": "today" }, "vencimento": { "$date": "today", "offset": 15 } },
  "sections": [
    { "title": "Itens", "related": { "entity": "fatura_item", "field": "fatura", "save": "with_parent", "minItems": 1,
      "computed": [{ "label": "Total do item", "value": "quantidade * preco", "currency": "BRL" }] } },
    { "title": "Observações", "width": 7, "rows": [["observacoes"]] },
    { "title": "Resumo", "width": 5, "rows": [["desconto", "impostos"]], "summary": [
      { "name": "subtotal", "label": "Subtotal", "value": "sum(fatura_item, quantidade * preco)", "currency": "BRL" },
      { "label": "Total", "value": "subtotal * (1 - desconto / 100)", "currency": "BRL", "total": true }
    ] }
  ]
}
```

- **`width`** (1 a 11, de 12): seções seguidas que somam até 12 dividem a linha e ficam da mesma altura. No celular, empilham.
- **`initial`**: valores do registro novo só neste formulário. Data aceita data relativa, resolvida pelo relógio de quem abre. É diferente do `default` do campo, que vale para qualquer gravação, inclusive pela API. Ganha do `default` e perde para o preset e para a URL.
- **`actions: "footer"`**: Cancelar e gravar no fim do formulário, sem o título do registro em cima enquanto edita. `submitLabel` troca o "Salvar".
- **Fórmula** (`summary` da seção e `computed` da lista): números, campos integer/decimal, `+ - * /`, parênteses e `sum(lista, conta)` sobre as linhas de uma lista `with_parent` do formulário. Uma linha do resumo com `name` pode ser citada pelas de baixo. Campo vazio vale 0; divisão por zero dá 0. O `spec:check` confere os nomes com o avaliador de referência (`packages/engine/src/formulas.mjs`).
- **Só exibição**: as contas não vão no corpo e o backend não as conhece. O valor que fica gravado (o `total` readOnly da fatura) é regra do sistema, no hook de gravação, e precisa fazer a mesma conta. A fórmula mostra ao usuário o que vai acontecer; quem decide é o backend.
- `unit` no campo integer/decimal põe o texto depois do número ("%", "kg"), no campo e na leitura; não muda o que trafega.
- **Num diálogo** (calendário, lista com `open: "dialog"`), `actions: "footer"` vira um diálogo comum: título ("Editar evento", ou o `label.new`), campos sem cartão e Excluir, Cancelar e gravar no rodapé.
- **`display: "swatches"`** no item da linha (`{ "field": "cor", "display": "swatches" }`): enum com `color` em todas as opções vira bolinhas de cor.
- **Dia inteiro**: numa entidade com `views.calendar.allDay`, o formulário edita início e fim só como data enquanto o dia inteiro está ligado, e mostra o fim como o último dia (no fio ele continua exclusivo). Ligar leva as horas à meia-noite; desligar sugere das 9h às 10h.

O widget é escolhido na **view**, não no campo: o tipo define o componente padrão, que é decisão da shell e não aparece na spec, e `{ "field": "placa", "component": "placa-input" }` troca só naquele formulário ou coluna.

## A spec não conhece o MUI

Nenhum JSON da spec cita componente, prop ou classe do MUI (nem de React). Ela descreve dados, layout em termos de regiões e intenções ("selo com tom `danger`", "campo visível quando..."). Quem traduz isso em tela é o renderer, com os componentes do `@c3theme/ui`. Assim um componente melhorado na shell melhora todos os sistemas, e o backend Axum não sabe que o MUI existe. Os pontos de contato são só nomes: `component` (registro de componentes da shell) e `icon` (catálogo de ícones da shell).

## Tipos de campo e formato trafegado

Todo registro tem `id` implícito, **sempre string** no JSON (evita perder precisão de i64 em JavaScript; o backend escolhe se guarda inteiro, UUID ou ULID). Campo sem valor vem `null`, nunca ausente.

| Tipo              | JSON                                                                                                                  | Sugestão SQLite               | Sugestão Postgres      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------- |
| `string`, `email` | string                                                                                                                | `TEXT`                        | `varchar(n)` / `text`  |
| `text`            | string (multilinha)                                                                                                   | `TEXT`                        | `text`                 |
| `integer`         | number (inteiro, faixa i53)                                                                                           | `INTEGER`                     | `bigint`               |
| `decimal`         | **string** `"1234.50"` (ponto, `scale` casas)                                                                         | `INTEGER` (valor × 10^scale)  | `numeric(p, scale)`    |
| `boolean`         | `true`/`false`                                                                                                        | `INTEGER` 0/1                 | `boolean`              |
| `date`            | string `"2026-10-17"`                                                                                                 | `TEXT`                        | `date`                 |
| `datetime`        | string UTC, segundos, sempre `Z`: `"2026-10-17T02:55:17Z"`                                                            | `TEXT`                        | `timestamptz`          |
| `enum`            | string ou number (um dos `options[].value`, sem tradução)                                                             | `TEXT` ou `INTEGER` + `CHECK` | `text`/`int` + `CHECK` |
| `flags`           | number: soma dos `options[].value` marcados (`62` = seg a sex)                                                        | `INTEGER`                     | `int`                  |
| `reference`       | escrita: id (string); leitura: `{ "id": "7", "title": "Acme" }`                                                       | FK                            | FK                     |
| `file`            | escrita: `{ "name": "a1.pfx", "contentType": "…", "data": "<base64>" }`; leitura: `{ "name", "size", "contentType" }` | —                             | —                      |

As colunas de banco são só sugestão: migrations são do sistema. O que é obrigatório é o formato do JSON.

- `datetime` não aceita fração de segundo nem fuso diferente de `Z`. Com um formato só, comparar texto equivale a comparar instante, inclusive no SQLite.
- `enum`: `options[].value` é o valor **exatamente como o banco grava**, para sistema que já existe não precisar migrar dado: `"PISTA"`, `"SEM BALANCA"`, `"SP"` ou um inteiro (`5102`). Não existe chave separada do valor: o mesmo valor trafega no JSON e aparece nas condições, filtros, presets e `default`; o texto da tela é o `label`. Comparação exata (maiúsculas, acentos e espaços contam; cuidado com `CHAR(n)` que completa com espaço). Num campo, as opções são todas string (não vazia) ou todas inteiras e não repetem; enum inteiro trafega como número e usa coluna inteira. Mandar `"5102"` num enum inteiro é `invalid_type`; valor fora da lista é `invalid_option`.
- `decimal` com `currency` (`"BRL"`, ISO 4217) é dinheiro: trafega e valida igual a qualquer decimal, e a shell mostra com o símbolo no idioma do usuário (`R$ 9.568,20`) na lista, no registro, no painel e nos totais; o campo de digitação ganha o símbolo à esquerda. O CSV sai só com o número. Número (`integer`, `decimal`) fica alinhado à direita em toda tabela da shell.
- `flags`: conjunto de opções num inteiro, um bit por opção (dias da semana de 1 a 127, canais de venda). Cada `options[].value` é uma potência de 2 (até 2^30, para caber nas operações de bit do JavaScript), e quem diz qual bit é qual dia é o sistema, porque é o que o banco dele já grava. `0` é "nenhum marcado" e não é vazio; com `required`, `0` é `required`. Bit fora das opções é `invalid_option`. Condições: `eq`, `ne`, `in` e `null` sobre o inteiro. Filtrar "vale na terça" pede um operador de bit (`has`), que fica para quando um sistema precisar; até lá, `pnpm spec:check` recusa `flags` em `views.list.filters`. Na shell, uma ficha por opção, com atalho "Todos"/"Limpar"; na lista, "Seg, Qua, Sex", "Todos" ou "Nenhum".
- `format` em `string` (`cpf`, `cnpj`, `cpf_cnpj`): documento com dígito verificador. Trafega **sem máscara**: CPF com 11 dígitos; CNPJ com 12 caracteres `[0-9A-Z]` e 2 dígitos (o CNPJ alfanumérico vale desde jul/2026; o numérico é o caso só com dígitos). `cpf_cnpj` decide pelo tamanho. Letra minúscula, pontuação ou tamanho errado é `pattern`; dígito errado é `check_digit`. A regra é a mesma na shell e no backend, testada por [`conformance/documents.json`](v0/conformance/documents.json). Na shell, o campo digita e mostra com máscara (`12.ABC.345/01DE-35`) e confere o dígito ao sair dele. Sistema que já grava o documento com máscara precisa migrar o dado para o formato sem máscara antes de usar `format`.
- `format: "phone"` em `string`: telefone brasileiro com DDD. Trafega só os 10 (fixo) ou 11 (celular) dígitos, sem máscara nem código do país; fora disso é `pattern`. A shell digita e mostra `(11) 98123-4567` no formulário e na lista. Mesmos casos em [`conformance/documents.json`](v0/conformance/documents.json).
- `hint` (texto ou chave de tradução): ajuda longa do campo, atrás de uma interrogação ao lado do rótulo, que abre no clique ou toque (no celular não há hover). O `help` continua sendo a frase curta, sempre visível abaixo do campo. Só tela: o backend ignora.
- `aiReview` (boolean): valor crítico (preço, CFOP, conta). Quando o assistente preenche o campo num rascunho do chat, a tela marca "Confira este valor" e só grava depois de o usuário conferir (botão Conferi, ou mexendo no valor). Fora do chat não muda nada; o backend ignora.
- `writeOnly: true` (só em `string`: senha, PIN): a leitura sempre traz `null`, inclusive na resposta do `POST`/`PATCH`. Na criação vale o `required`; na alteração, vazio ou ausente **mantém** o gravado. Não entra em coluna de lista, busca, filtro, ordem, condição nem `titleField` (filtrar por um hash revelaria o valor aos poucos): `pnpm spec:check` recusa e a API responde `400`. O backend recebe o texto puro e quem faz o hash é o sistema; o c3-engine só sobe com escrita delegada para a entidade, e o `WriteCall.values` só traz a chave quando chegou senha nova. Na shell, o campo é mascarado com botão de mostrar, e no detalhe aparece "Não exibida".
- `file` (certificado A1 no input de ação, anexo do pedido na entidade): o arquivo vai inteiro no JSON, com `data` em base64 padrão. `accept` lista as extensões aceitas (`[".pfx", ".p12"]`, sem diferenciar maiúsculas) e `maxSize` o tamanho em bytes depois de decodificado (padrão e teto de 1 MB, porque em base64 o corpo cresce 4/3). Erros: `too_large`, `file_type` e `invalid_type` (objeto sem `name`, `data` vazio ou fora de base64). O motor não abre nem guarda o arquivo. No input de ação, ele chega ao sistema em `ActionCall.input` como veio, e o conteúdo é regra do sistema (o exemplo recusa um .pfx que não é DER com `invalid_certificate`). Condição só com `null`; não ordena nem entra na busca.
  - **Na entidade**, quem grava é o sistema: a entidade (ou o escritor dela) precisa de escrita delegada, senão o motor não sobe; filha `with_parent` ainda não tem arquivo. A coluna guarda os metadados em JSON (`{ "name", "size", "contentType" }`), escritos pelo sistema, e é só isso que a leitura e a lista devolvem. Na alteração, sem a chave (ou com os metadados de volta, como a shell manda o formulário inteiro) o arquivo fica; `null` remove; com `data`, troca. O sistema recebe em `WriteCall.values` só o que muda (arquivo novo ou `null`). Os bytes saem em `GET /{entity}/{id}/_files/{campo}`, com as conferências da leitura, pelo `Hooks::read_file`.
  - **Na shell**: botão de escolher, nome e tamanho, e a mesma conferência de tamanho e extensão antes de enviar. O arquivo gravado aparece com o nome como link de download.
- `reference` na leitura traz o `title` (o `titleField` do registro apontado) para a lista mostrar "Acme" em vez de "7" sem uma requisição por linha.

## Condições

Filtro de lista, filtro nomeado (`views.list.presets`) e regra de formulário (`visibleWhen`, `requiredWhen`) usam **a mesma linguagem**: um AST em JSON, nunca string de código.

```json
{
  "and": [
    { "field": "vip", "op": "eq", "value": true },
    { "or": [{ "field": "company_id", "op": "null", "value": true }, { "not": { "field": "status", "op": "in", "value": ["lead"] } }] }
  ]
}
```

Ela é avaliada em três lugares: na shell (TS, para esconder ou exigir campo enquanto o usuário digita), no backend ao validar (Rust/Node) e no backend como SQL ao listar. Por isso a semântica é fechada e testada por [`conformance/conditions.json`](v0/conformance/conditions.json):

| Operador                          | string/text/email | integer/decimal/date/datetime | boolean | enum/flags/reference |
| --------------------------------- | ----------------- | ----------------------------- | ------- | -------------------- |
| `eq`, `ne`                        | sim               | sim                           | sim     | sim                  |
| `lt`, `lte`, `gt`, `gte`          | não               | sim                           | não     | não                  |
| `in` (`value` é array)            | sim               | sim                           | não     | sim                  |
| `contains`                        | sim               | não                           | não     | não                  |
| `null` (`value` é `true`/`false`) | sim               | sim                           | sim     | sim                  |

- `eq` em texto diferencia maiúsculas; `contains` não diferencia (minúsculas Unicode), mas diferencia acento.
- `decimal` compara como número exato (`"10.5"` = `"10.50"`, `"10.00"` > `"9.00"`).
- Campo vazio (`null`, ausente ou `""`): `null` responde, `ne` é **verdadeiro** e todo o resto é falso. Assim `not(eq)` sempre equivale a `ne`. Atenção: no SQL, `status <> 'lead'` exclui as linhas nulas; o backend precisa gerar `(status IS NULL OR status <> 'lead')`.
- Operador que não vale para o tipo, campo inexistente ou valor fora do formato: erro na spec (`pnpm spec:check`) e `400` na API.
- `field` pode ser `id`, o id implícito do registro, comparado como `reference` (string no fio). Serve para tirar o próprio registro de uma lista (`filter` abaixo) ou filtrar por ids marcados.

**Data relativa.** Em filtro de lista (`where` da listagem e do `_aggregate`, `views.list.presets`, `where` de widget do painel), o valor de uma folha de campo `date` ou `datetime` pode ser relativo, e o backend o resolve na hora da consulta. O preset "Este mês" continua certo no mês que vem, e lista, contagem e totais usam o mesmo "hoje".

```json
{
  "id": "mes",
  "label": "Este mês",
  "default": true,
  "where": {
    "and": [
      { "field": "data", "op": "gte", "value": { "$date": "monthStart" } },
      { "field": "data", "op": "lt", "value": { "$date": "monthStart", "offset": 1, "unit": "month" } }
    ]
  }
}
```

- `{ "$date": "today" | "weekStart" | "monthStart" | "yearStart", "offset": n, "unit": "day" | "week" | "month" | "year" }`: semana começa na segunda; `unit` padrão `day`; mês que não tem o dia vai ao último (31/01 + 1 mês = 28/02). Em `datetime`, vale o início do dia no fuso do sistema.
- `{ "$now": true, "offset": n, "unit": "minute" | "hour" | "day" }`: só em `datetime` ("últimas 24 h": `gte { "$now": true, "offset": -24 }`; `unit` padrão `hour`).
- Só com `eq`, `ne`, `lt`, `lte`, `gt` e `gte`. Para "até o fim do mês", use `lt` com o início do próximo, não `lte` com o último dia: funciona em `date` e `datetime`.
- O relógio é do sistema (`Hooks::clock` no c3-engine): agora, o fuso e, se houver, o dia operacional ("hoje" da loja que fecha o caixa depois da meia-noite). Padrão: UTC. `default: true` no preset abre a lista já filtrada.
- Fora de filtro (`visibleWhen`, `requiredWhen`, `rowAccess`, `filter` do reference) não vale: `spec:check` recusa e a API responde `400`.

**Filtro no reference.** `filter` num campo `reference` é uma condição sobre a entidade apontada: a lista de opções da shell só mostra o que vale, e o backend confere de novo ao gravar (opção fora dele é `422` com `not_allowed` no campo).

```json
{
  "name": "conta_id",
  "type": "reference",
  "entity": "conta",
  "filter": {
    "and": [
      { "field": "analitica", "op": "eq", "value": true },
      { "field": "ativa", "op": "eq", "value": true }
    ]
  }
}
```

O valor de uma folha pode ser `{ "$field": "nome" }`: o valor desse campo **no formulário de quem aponta**, ou `id`, o próprio registro. `centro_id` do veículo só do mesmo cliente: `{ "field": "cliente_id", "op": "eq", "value": { "$field": "cliente_id" } }`; componente que não é o próprio produto: `{ "field": "id", "op": "ne", "value": { "$field": "id" } }`.

- Variável vazia (cliente ainda não escolhido, `id` no registro novo): a folha não restringe nada. Por isso a variável não entra em `not` (use `ne`) e só vale com `eq`, `ne`, `lt`, `lte`, `gt` e `gte`, e o campo dela precisa ser do mesmo tipo do filtrado (reference para a mesma entidade). O `spec:check` e o boot do c3-engine conferem.
- A shell resolve as variáveis com o formulário atual e manda o filtro no `where` da listagem; trocar o cliente refaz a lista. Uma opção já escolhida que deixou de valer só é recusada ao salvar.
- Não existe em input de ação (por enquanto).

## Listagem: paginação, ordenação, busca, filtros

```
GET /api/customer?page=2&pageSize=25&sort=-created_at&q=maria&where={"field":"status","op":"in","value":["lead","active"]}
→ { "data": [ ... ], "meta": { "page": 2, "pageSize": 25, "total": 137 } }
```

(`where` vai codificado na URL; a shell monta.)

- `sort`: campos separados por vírgula, `-` = decrescente. Vazios ficam **sempre por último**, nos dois sentidos (o SQLite põe `NULL` primeiro e o Postgres por último; o contrato fixa um só). `reference` ordena pelo título. O backend sempre desempata por `id` para a paginação ser estável.
- `q`: busca livre, `contains` em qualquer campo de `views.list.search`.
- `where`: uma condição. A shell junta com `and` o preset ativo e os filtros que o usuário montou na barra (`views.list.filters`).
- **Atualização automática** (`views.list.refreshSeconds: 5`, de 3 a 3600): a shell relê a página na tela e os totais a cada N segundos, só com a aba visível, sem perder página, filtros, seleção nem rolagem. Serve para fila que muda sozinha (requisições, comandas em uso, caixas abertos). É releitura do GET da lista, não tempo real: cada aba aberta faz uma chamada por intervalo. Para aviso na hora, use `live` (seção Tempo real).
- **Célula composta** (objeto em `views.list.columns`): `label` troca o título da coluna; `secondary` põe outro campo numa segunda linha apagada (e-mail embaixo do nome); `join` emenda campos com " - " (`{ "field": "cidade", "join": ["uf"] }` mostra `Recife - PE`; vazio fica de fora); `avatar: true` põe as iniciais do valor antes dele, e `avatar: "foto"` usa o endereço do campo string `foto`, com as iniciais quando vazio; o objeto `{ "photo": "foto", "letters": 1, "tone": "neutral" }` escolhe uma ou duas letras e o cinza no lugar da cor por registro. `weight: "normal" | "bold"` troca o peso do valor (padrão: negrito com `secondary`). A ordenação continua pelo `field`. Só exibição: o GET não muda.
- **Ações na linha** (`views.list.rowActions: ["view", "edit", "delete"]`): ícones na coluna "Ações". Ver abre o registro; editar abre o formulário num diálogo sobre a lista, já editando; excluir pergunta e chama `DELETE`. Cada ícone só aparece com a permissão dele (`update`, `delete`, e o `_can` do registro). Com `delete`, a lista ganha a marcação de linhas e "Excluir (n)" na barra; com ações em lote, o Excluir vai para a faixa da seleção, ao lado delas. Se algum falha, os outros seguem e o aviso diz quantos ficaram. `rowActionsStyle: "quiet"` deixa os ícones cinza, maiores e com o lápis em contorno. `open: "dialog"` faz o clique na linha, o Ver e o botão de criar abrirem o formulário num diálogo sobre a lista (padrão `page`). Em `filters`, `{ "field": "status", "all": "Todas" }` troca o texto da opção sem filtro (padrão "Todos"); `label.gender: "f"` faz a seleção e os avisos dizerem "selecionadas", "Excluída".
- **Prévia na linha** (`views.list.expand`): seta no começo da linha que abre, embaixo dela, os dados que a linha já trouxe (sem outro GET). `fields` em grade, cada um com rótulo e `icon` opcional do catálogo da shell; `stats` (até 4) numa faixa em destaque; `notes` na largura toda, texto com o rótulo como título e `flags` como etiquetas. Cada item é o nome do campo ou `{ "field", "label", "icon" }`.
- **Abas, período, busca e exportação**: `presetTabs: { "all": "Todas" }` mostra os presets como abas acima da barra, cada uma com a contagem (uma chamada `_aggregate?measure=count` por aba, com o where do preset somado à busca e aos filtros); a primeira aba é a lista sem preset. `dateRange: { "field": "emissao", "label": "Emitidas" }` põe "Emitidas de" e "até" na barra (`gte`/`lte`, só campo `date`). `searchHint` troca o placeholder da busca ("Em 42 clientes" por padrão). `export: false` tira o "Exportar CSV". Na coluna, `link: true` faz o valor abrir o registro.
- **Botão de criar**: `label.new` (`"Nova fatura"`) troca o "Adicionar fatura" padrão na lista e no título do formulário novo.
- **Totais no rodapé** (`views.list.totals: [{ "field": "total" }, { "field": "desconto" }]`): soma de colunas integer ou decimal sobre tudo o que o filtro alcança, não só a página. A shell faz uma chamada só, `GET /api/{entity}/_aggregate?measure=sum:total,sum:desconto` com o mesmo `where`, `q` e `branches` da lista, e a resposta traz `values` na ordem pedida. Trocar de página não refaz a soma; gravar ou rodar uma ação refaz. Os totais saem também na última linha do CSV. A contagem não é total: já está em `meta.total`. Campo que o usuário não vê sai das colunas e não soma. O `spec:check` recusa total de campo que não é número ou não está nas colunas.

**Armadilhas conhecidas do SQLite** (a suíte de conformidade vai cobrir):

- `LIKE` e `lower()` só tratam maiúsculas em ASCII: `contains`/`q` com "É" vs "é" precisa de normalização (função registrada na conexão, ou coluna auxiliar em minúsculas gravada pelo backend).
- `decimal` guardado como `REAL` perde precisão, e como `TEXT` compara errado (`"10.00" < "9.00"`). Guarde inteiro escalado.
- `datetime` em `TEXT` só ordena certo porque o formato é único (UTC, segundos, `Z`). Não grave outro formato.

## Consulta do sistema (parâmetros)

Consulta que só existe com um valor pedido antes (posição do estoque numa data, CMV de um período) não cabe numa visão, porque visão não recebe parâmetro. Ela vira uma entidade com `"source": "system"` e `params`: o SQL vem do sistema, e o resto da lista é o de sempre.

```json
{ "name": "estoque_posicao", "source": "system",
  "params": { "fields": [
    { "name": "data", "type": "date", "label": "Posição em", "required": true, "default": { "$date": "today" } },
    { "name": "almoxarifado_id", "type": "reference", "entity": "almoxarifados" } ] },
  "fields": [ ... ] }
```

- **Parâmetros:** mesmos tipos e regras do input de ação. Vão na URL como `p.<nome>=valor` (`GET /api/estoque_posicao?p.data=2026-11-05`); parâmetro desconhecido é `400`, valor inválido ou obrigatório vazio é `422` com o erro no campo. Sem `p.` na URL, valem os `default`; data relativa no `default` é resolvida pelo relógio do sistema, e o `/_meta/entities/{e}` devolve os valores resolvidos em `paramDefaults`.
- **Backend:** `Hooks::source(entidade, parâmetros)` devolve `(sql, valores)`: um SELECT com `id` (estável e único na consulta), uma coluna por campo e, com `scope`, as de empresa e filial. O motor usa `FROM (sql) t` na lista, na contagem e no `_aggregate`, com os valores antes dos do `where`. Filiais, `rowAccess`, busca, filtros, ordem, página, totais e exportação ficam por fora, iguais. A consulta roda uma vez por pedido (página, contagem e totais são três), então consulta pesada pede índice no sistema.
- **Só leitura:** criar, alterar, excluir e abrir uma linha são `405`; as capabilities vêm sem create, update e delete. Só ação de lista (`target: list`). Nenhuma entidade aponta para ela (`reference` ou `related`): o boot e o `spec:check` recusam.
- **Shell:** uma faixa acima dos filtros com os parâmetros e "Consultar", que põe os valores na URL (voltar e compartilhar funcionam). A linha não abre registro.

## Configuração de registro único (singleton)

`"singleton": true` na entidade: um registro por escopo (o grupo, cada empresa ou cada filial, conforme `scope`). É a tela de configuração (Loja, E-mail, Juros e multa) que não tem lista.

- **Shell:** `/{entity}` lê o registro da filial ativa e abre o formulário dele. Sem registro, abre o formulário novo (se `create`) ou avisa que ainda não foi configurada. Não há "Adicionar" nem "Excluir".
- **Backend:** criar quando o dono já tem o seu é `409 conflict`; excluir é `405 method_not_allowed`; `capabilities.delete` vem `false`. A listagem, a leitura e o `PATCH` são os de sempre. Com escrita delegada, a conferência vem antes do `Hooks::write`. Para valer também entre duas gravações simultâneas, o sistema põe índice único nas colunas de escopo (exemplo: `crates/c3-example/migrations/0019_store_settings.sql`).
- **`spec:check`** recusa singleton com quadro, calendário, presets, totais, ação em lote ou de lista, e como filha (`related`).
- Configuração guardada em chave e valor (uma tabela `configuracoes` com JSON) entra por uma visão que monte a linha, com escrita delegada ao sistema.

## Erros

Todo erro segue um formato só, e `message` já vem pronta para o usuário (no idioma do `Accept-Language`):

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Alguns campos precisam de atenção.",
    "fields": {
      "email": [{ "code": "unique", "message": "Já existe um cliente com este e-mail." }],
      "name": [{ "code": "required", "message": "Informe o nome." }]
    }
  }
}
```

| HTTP | `code`              | Quando                                                              |
| ---- | ------------------- | ------------------------------------------------------------------- |
| 400  | `bad_request`       | query ou corpo malformado, condição inválida                        |
| 401  | `unauthorized`      | sem token ou token expirado (a shell manda para o login)            |
| 403  | `forbidden`         | sem permissão (mesmo que a shell tenha escondido o botão)           |
| 404  | `not_found`         | entidade ou registro inexistente                                    |
| 409  | `conflict`          | violação de unique (com `fields`) ou FK impedindo exclusão          |
| 412  | `stale`             | `If-Match` com `_version` velha: alguém gravou depois, nada muda    |
| 422  | `validation_failed` | regras do schema, `requiredWhen` ou regra de negócio (com `fields`) |
| 500  | `internal`          | qualquer outra coisa; nunca vaza stack trace                        |

A shell valida no cliente com as mesmas regras do schema para dar feedback imediato, mas o backend **sempre** revalida: o cliente é conveniência, o servidor é a garantia.

## Permissões

`GET /api/_meta/entities/{e}` devolve `capabilities` (`list`, `read`, `create`, `update`, `delete` e `actions`, uma chave por ação) já calculadas para o usuário atual (na filial ativa, quando há escopo). A shell esconde o que não pode; o backend continua respondendo `403`. Como as permissões são decididas é problema de cada sistema.

### Permissão por linha, seção e campo

Quando a entidade inteira não basta (aba Fornecedor só para quem cuida de fornecedor, custo que só a gerência altera, fornecedor fora da lista de quem só vê clientes), o JSON cita **códigos de permissão** do sistema, opacos para o motor, e o sistema só responde se o usuário tem cada um (`Hooks::permitted(código, filial ativa, requisição)`, memorizado por requisição):

```json
{
  "rowAccess": [
    { "permission": "empresa.cliente", "where": { "field": "is_supplier", "op": "ne", "value": true } },
    { "permission": "empresa.fornecedor", "where": { "field": "is_supplier", "op": "eq", "value": true } }
  ],
  "fields": [{ "name": "credit_limit", "type": "decimal", "access": { "edit": "cliente.credito" } }],
  "views": { "form": { "sections": [{ "tab": "Fornecedor", "access": { "view": "empresa.fornecedor" }, "rows": [["supplier_terms"]] }] } }
}
```

- `access` no campo e na seção: `view` e `edit`, cada um um código. Na seção vale para tudo o que ela mostra, somado ao do campo. O resultado volta em `capabilities.fields` (`{ "supplier_terms": "hidden", "credit_limit": "readOnly" }`; ausente, livre), inclusive para a lista `with_parent` (pela chave dela).
- Sem `view`: o campo não vem na leitura nem na lista, e citá-lo em `where`, `sort` ou na busca é `400` (como se não existisse). A shell tira o campo das colunas, filtros, presets que o citam e do formulário; uma aba some quando nada nela aparece. Lista `with_parent` sem `view` não vem na leitura.
- Sem `edit`: o campo aparece travado ("Você não tem permissão para alterar."). Mudar o valor é `422 forbidden`; mandar o mesmo valor passa (a shell manda o registro inteiro). Na criação, o valor tem que ser o `default`. Lista `with_parent` sem `edit` não pode vir no corpo. Campo `required` com `access` precisa de `default`, senão quem não pode alterar não consegue criar.
- `rowAccess`: o usuário vê a união dos `where` dos códigos que tem (nenhum código, nada). Vale em toda leitura, como o escopo de filial: lista e `total`, leitura (fora é `404`), escolha de `reference` e o título dele, ações. Gravar um registro que fica fora (criar fornecedor sem o código, ou virar um cliente em fornecedor) é `403`. Regra que depende do usuário logado ("só os pedidos do vendedor") usa `{"$user": "seller"}` como valor: o sistema responde em `Hooks::user_value("seller", requisição)` com o valor no formato trafegado do campo (`"7"`, ou uma lista para `in`). Só com `eq`, `ne` e `in`; sem o valor (`None` ou `null`), a regra não mostra nada, nunca alarga.
- Ainda não: `access` nos campos de uma filha `with_parent` e `rowAccess` nela (o boot recusa); `access` em input de ação. A filial que decide é sempre a ativa, mesmo numa lista com várias filiais.

## Grupo econômico, empresa e filial

Três níveis: **grupo econômico** (o cliente; é o banco inteiro), **empresa** (CNPJ raiz) e **filial** (estabelecimento, CNPJ completo). A matriz é a filial `/0001`: tem estoque, caixa e pedidos próprios, não é um nível acima das filiais.

**Declaração.** Empresa e filial são entidades normais do sistema, nas migrations dele. O `app.json` só aponta quais são, e cada entidade declara de quem são os registros:

```json
"organization": { "company": "org_company", "branch": "branch" }
```

| `scope` da entidade | Colunas reservadas na tabela       | Quem vê o registro                   |
| ------------------- | ---------------------------------- | ------------------------------------ |
| `group` (padrão)    | nenhuma                            | todo usuário do grupo                |
| `company`           | `org_company_id`                   | quem acessa alguma filial da empresa |
| `branch`            | `org_company_id` + `org_branch_id` | quem acessa aquela filial            |

A entidade de empresa é `group` e a de filial é `company` (a coluna `org_company_id` da filial é a empresa dela). O escopo é **fixo por entidade**, decidido por quem escreve o sistema; não é configuração do cliente. Se dois clientes precisam de escopos diferentes para a mesma coisa, são duas entidades (ex.: `product` no grupo e `branch_price` por filial, ligadas por `related`). Não existe "filial vazia = compartilhado".

**Filial ativa e filiais em exibição.** São coisas diferentes:

- `C3-Branch: <id>` (cabeçalho, em toda requisição) é a **filial ativa**: onde se grava e de onde vêm as `capabilities` dos metadados. Criar em entidade `company`/`branch` sem ele é `400`. Filial que o usuário não acessa é `403`.
- `branches=1,2,3` (query da lista) são as **filiais em exibição**, só leitura. Sem o parâmetro, a lista mostra a filial ativa; sem filial ativa, todas as permitidas.
- `GET /api/_meta/context` devolve as empresas e filiais permitidas ao usuário e a filial padrão dele, para o seletor da shell.

**O backend garante, não a shell.** O cabeçalho e a query são pedidos do cliente. O backend cruza com as filiais permitidas ao usuário e aplica o filtro em todo SQL que gera:

| Operação                     | Garantia                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| listar e contar              | o mesmo filtro nos dois (o `total` não revela quantos registros a outra filial tem)                          |
| ler, alterar, excluir por id | registro fora do escopo → `404`, nunca `403` (não confirma que existe); filial só leitura → `403`            |
| criar                        | grava na filial ativa; `org_company_id`/`org_branch_id` nunca vêm do corpo e nunca mudam                     |
| título de `reference`        | registro apontado que o usuário não pode ler vem `{ "id": "7", "title": null }`                              |
| salvar `reference`           | registro que o usuário não vê → `not_found`; de outra empresa/filial que o dono do registro → `out_of_scope` |
| lookup e `related`           | são listas: mesmo filtro                                                                                     |
| `unique`                     | vale dentro do escopo: o índice único do banco inclui `org_company_id` ou `org_branch_id`                    |

Regra de `reference`: um registro de filial só aponta para registros `branch` da mesma filial e `company` da mesma empresa; um registro de empresa só aponta para registros da mesma empresa; `group` aponta para qualquer um que o usuário enxergue.

**No formato trafegado**, entidade com escopo traz `_company` e `_branch` (`{ id, title }`) e `_can` (`{ update, delete }`), porque uma lista com várias filiais mistura linhas que o usuário pode e não pode alterar. Chaves com `_` são do motor: enviá-las no corpo é `400`.

**Permissão por filial.** As `capabilities` dependem da filial (o frentista lança venda numa e só consulta outra). Para alterar registro `branch`, vale a filial dona do registro; para registro `company`, uma filial da mesma empresa (a ativa, se veio). Quem decide é o sistema, por hook; o motor não guarda usuário nem perfil.

**Relatórios.** O [relatório](#relatório) lê pela listagem, então herda o `scope` e o mesmo filtro de `branches`; a consulta do sistema também. Consolidado do grupo é escolher todas as filiais permitidas; não existe atalho "ver tudo" que pule a permissão.

**Fora daqui:** hierarquia na linguagem de condição (quem decide se o usuário da matriz vê as filiais é o sistema, devolvendo a lista já expandida), transferência entre filiais (operação de negócio, não `PATCH`), variáveis de contexto na condição (`user.id`, filial ativa), regra extra por linha ("vendedor só vê os próprios clientes") e um banco por grupo escolhido por requisição (SaaS com vários grupos no mesmo servidor).

## Ações

Cadastro se grava pelo CRUD; **fato de negócio muda por ação**. Cancelar uma venda, reemitir uma nota ou reprocessar uma pendência nunca é um `PATCH` no registro: estorna lançamentos, chama a SEFAZ, mexe em outras tabelas. A entidade declara a ação, o motor confere e o sistema executa.

```json
"actions": [
  {
    "name": "cancel",
    "label": "Cancelar pedido",
    "tone": "danger",
    "visibleWhen": { "field": "status", "op": "eq", "value": "open" },
    "input": {
      "fields": [{ "name": "reason", "type": "text", "label": "Motivo", "required": true, "minLength": 15 }]
    },
    "successMessage": "Pedido cancelado."
  }
]
```

```
POST /api/sales_order/7/_actions/cancel   { "reason": "Cliente desistiu antes da entrega." }
→ 200 { "data": { ...registro depois da ação... }, "message": null }
```

- **Ordem das conferências**: ação existe (404), `read` na entidade (403), registro existe e está no escopo (404), permissão da ação na filial dona do registro (403), `visibleWhen` vale para o registro (409 `conflict`), corpo bem formado (400), input válido (422 com `fields`). Só então o sistema executa.
- **Input** tem os mesmos tipos, regras e condições dos campos da entidade, mas as condições citam campos do próprio input. `reference` no input segue as regras de escopo do registro. Não é gravado pelo motor: vai inteiro para a regra de negócio, com campo escondido ou vazio como `null`.
- **Permissão por ação**: `capabilities.actions` traz uma chave por ação (`{ "cancel": true }`), calculada na filial ativa. Na rota, vale a filial dona do registro, como em alterar e excluir. Ação exige `read`. A shell esconde o botão; o backend responde 403 de qualquer jeito.
- **Resposta**: o registro relido depois da ação (ou `null`, se ela o removeu ou tirou do escopo) e `message` opcional. Erro da regra de negócio volta no formato de sempre: um motivo recusado pela SEFAZ é `422` com `fields.reason`; o registro que mudou no meio é `409`.
- **Concorrência**: o motor não segura transação enquanto o sistema executa (um escritor próprio, como o Diesel do Nati, travaria no lock do SQLite). O `visibleWhen` é conferência prévia; a regra do sistema confere de novo o estado dentro da transação dela (no exemplo, `UPDATE ... WHERE status = 'open'`).
- **Na shell**: o detalhe mostra as ações permitidas cujo `visibleWhen` vale. Ação sem `input` e sem `confirm` roda direto; as outras abrem um diálogo com os campos, a pergunta de confirmação e o botão no tom da ação (`danger` em vermelho).
- **No c3-engine**: `Hooks::action_allowed` decide a permissão e `Hooks::run_action` executa, recebendo registro, input validado, contexto da requisição e pool.

### Em lote e fila de pendências

Com `"bulk": true`, a ação roda também sobre várias linhas da lista: cancelar os pedidos abandonados, reprocessar as notas recusadas.

```
POST /api/sales_order/_actions/cancel   { "ids": ["7", "8", "9"], "input": { "reason": "Pedido abandonado no carrinho." } }
→ 200 { "results": [ { "id": "7", "ok": true, "data": {...}, "message": null },
                     { "id": "8", "ok": false, "error": { "code": "conflict", "message": "..." } }, ... ],
        "meta": { "ok": 2, "failed": 1 } }
```

- **Antes de tocar em qualquer registro**: ação existe e tem `bulk` (404), `read` (403), corpo `{ ids, input }` com 1 a 100 ids sem repetição (400), input válido (422). O input é um só, então erro nele volta para o pedido inteiro.
- **Depois, registro por registro**, na ordem de `ids`: as mesmas conferências da ação de um registro (404, 403 na filial dona, 409, `reference` do input fora da empresa ou filial dele) e a regra do sistema. Cada um falha ou passa sozinho, com o erro no formato de sempre em `error`; o que deu certo não é desfeito. Tudo ou nada não serve para fila: uma nota recusada não pode travar as outras 29.
- **Sem endpoint novo para o sistema**: o motor chama o mesmo `run_action` uma vez por registro. Quando o lote é um fato só, use `"bulk": "together"` (abaixo).
- **Fila de pendências** é um `preset` da lista (ex.: `status = open`) com um item de menu `"badge": true`, que mostra quantos registros ela tem. A shell marca as linhas, mostra as ações em lote permitidas (`capabilities.actions`) e, no fim, lista as que falharam com o motivo e as deixa marcadas para tentar de novo.

### Ação em conjunto

Há lote que é um fato só: receber vários recebíveis de cartão é um movimento no extrato com o líquido somado (o que o banco mostra), pagar vários títulos com um cheque é um pagamento. Rodar um por um faria N movimentos. Com `"bulk": "together"`, a ação roda sobre as linhas marcadas uma vez só:

```json
{
  "name": "invoice",
  "label": "Faturar juntos",
  "bulk": "together",
  "preview": true,
  "visibleWhen": {
    "and": [
      { "field": "status", "op": "eq", "value": "open" },
      { "field": "invoice", "op": "null", "value": true }
    ]
  },
  "summary": [{ "field": "total" }],
  "input": { "fields": [{ "name": "due_date", "type": "date", "label": "Vencimento", "required": true }] }
}
```

- **Mesma rota do lote**, `POST /{entity}/_actions/{name}` com `{ ids, input }`. O pedido (400), a permissão de leitura (403) e o input (422) são conferidos uma vez, como no lote.
- **Cada registro é conferido antes, e qualquer recusa recusa todos**: 404, 403 na filial dona, 409 do `visibleWhen`, `reference` do input fora da empresa ou filial dele. Nada roda, e a resposta é `409` com `code: "refused"` e o erro de cada id barrado em `records` (`[{ "id": "8", "error": {...} }]`), para o usuário desmarcar todos de uma vez. Com um id só, volta o erro dele, como na ação de um registro.
- **Depois, uma chamada ao sistema** com todos os ids, que executa tudo ou nada. A resposta é a de uma ação da lista: `{ "message": ... }`, com `open` ou o arquivo (`returns: "file"` vale aqui: a remessa dos títulos marcados). A conferência do motor não segura o estado; o sistema confere de novo dentro da transação dele, porque outro usuário pode ter mexido num dos registros no meio.
- **No detalhe de um registro**, a ação aparece como as outras e o sistema recebe só aquele id; a resposta relê o registro.
- **`summary`** (opcional): campos `integer` ou `decimal` somados sobre as linhas marcadas, na barra da seleção e no diálogo. A shell soma o que já está na tela (a seleção é da página).
- **`preview: true`**: a prévia vai a `POST /{entity}/_actions/{name}/_preview` com `{ ids, input }`, com as mesmas conferências por registro. Serve para o que depende do input, como a taxa da antecipação, que muda com a data.
- Não tem Desfazer (`inverse`): o fato envolve vários registros. No c3-engine, o sistema executa em `Hooks::run_bulk_action` (`BulkActionCall` com `ids`, `records` e `input`).

Para fatos que só mudam por ação (venda, título, nota), o campo de situação é `readOnly` e o sistema devolve `update` e `delete` falsos quando for o caso: o CRUD não mexe no fato e as ações são a única porta de escrita.

### Ação da lista

`"target": "list"` faz da ação um comando da lista, sem registro: aplicar um modelo de grupos contábeis, aplicar uma jornada a um canal. O botão fica no topo da lista, ao lado do "Adicionar", e roda em `POST /{entity}/_actions/{name}` com `{ "input": {...} }` (sem `ids`). A permissão é a de `capabilities.actions` na filial ativa, junto com `list` na entidade; o input é validado como nas outras ações (reference conferido contra a filial ativa) e a resposta é `{ "message": ... }`. Ação de lista não tem `bulk` nem `visibleWhen` (não há registro para a condição). No c3-engine, o sistema executa em `Hooks::run_list_action`.

### Grade no input e valores iniciais

Operação com várias linhas digitadas de uma vez (contar cada forma de pagamento, ajustar o preço de 50 produtos) usa um campo `type: "grid"` no input, com as colunas em `fields`. `prefill: true` faz a shell pedir os valores iniciais ao sistema antes de abrir o diálogo.

```json
{
  "name": "reprice",
  "label": "Reajustar preços",
  "target": "list",
  "prefill": true,
  "input": {
    "fields": [
      {
        "name": "prices",
        "type": "grid",
        "label": "Preços",
        "required": true,
        "maxItems": 200,
        "fields": [
          { "name": "product", "type": "reference", "entity": "product", "label": "Produto", "required": true, "readOnly": true },
          { "name": "price", "type": "decimal", "label": "Preço novo", "scale": 2, "min": 0, "required": true }
        ]
      }
    ]
  }
}
```

```
GET  /api/product/_actions/reprice/_prefill
→ 200 { "data": { "prices": [ { "product": { "id": "3", "title": "Água" }, "price": "4.00" }, ... ] } }
POST /api/product/_actions/reprice   { "input": { "prices": [ { "product": "3", "price": "4.50" }, ... ] } }
→ 422 { "error": { "code": "validation_failed", "fields": { "prices.1.price": [ ... ] } } }
```

- **Grade** trafega como lista de objetos. Cada linha é validada como os campos (obrigatório, mínimo, casas, `reference` no escopo); o erro vem em `<grade>.<linha>.<campo>`, com a linha contada a partir de 0. `required` exige uma linha (o mesmo que `minItems: 1`); `maxItems` vai até 500 (padrão 200). Coluna desconhecida é 400.
- **`readOnly` na coluna** só trava a célula: o valor vai ao sistema, porque é ele que identifica a linha (a forma contada, o produto). A regra do sistema confere de novo o que importa.
- Coluna não pode ser `file`, `createOnly`, ter `filter`, `access` nem condições; grade dentro de grade não existe; condições do input não citam a grade. O assistente (`c3.form`) não usa grade.
- **`prefill`**: `GET /{entity}/{id}/_actions/{name}/_prefill` (ou `/{entity}/_actions/{name}/_prefill` na ação da lista), com as mesmas conferências de rodar a ação. No c3-engine, `Hooks::action_prefill` devolve os valores; o motor descarta o que o input não declara.
- **Na shell**: a grade aparece no diálogo como tabela, com as colunas `readOnly` como texto e as outras editáveis; dá para tirar linhas.
  - Grade com mais de 15 linhas ao abrir (contagem de inventário) abre o diálogo em tela cheia. A escolha é feita ao abrir e não muda enquanto o usuário adiciona linhas; o botão no título entra e sai da tela cheia.
  - Com mais de 10 linhas, a grade ganha busca (sem acento, por todas as palavras, sobre o texto que a linha mostra). A busca só esconde linhas: a grade inteira vai ao sistema. Enter na busca leva à primeira linha achada.
  - Como numa planilha, Enter numa célula vai para a mesma coluna da próxima linha visível (Shift+Enter, da anterior) e nunca confirma a ação; o valor da célula fica selecionado para digitar por cima. Não há opção na spec: o comportamento vale para toda grade.

### Prévia da ação

Antes de confirmar, o usuário vê o que a ação vai fazer, calculado pelo sistema: os encargos da baixa, as parcelas novas da renegociação, os itens do XML casados com os produtos. A ação declara `"preview": true`.

```
POST /api/product/7/_actions/discount/_preview   { "percent": "10" }
→ 200 { "message": "De R$ 28,90 para R$ 26,01.", "fill": { "price": "26.01" },
        "table": { "columns": [{ "name": "item", "label": "Item" }, ...], "rows": [{ "item": "Preço novo", "value": "R$ 26,01" }] } }
```

- **Rotas**: `POST /{entity}/{id}/_actions/{name}/_preview` com o input, ou `POST /{entity}/_actions/{name}/_preview` com `{ input }` na ação da lista. As conferências são as de rodar a ação (permissão, escopo, `visibleWhen`, formato, faixa, `reference`), mas o input pode estar pela metade: falta de campo (`required`, `min_items`) não barra. Nada é gravado.
- **`fill`** sugere valor para campos simples do input. A shell só põe a sugestão em campo vazio ou que ainda tem a sugestão anterior; o que o usuário digitou fica, e é isso que vai ao confirmar. **`table`** é só leitura; o motor tira das linhas o que não está em `columns`.
- **Quando a shell pede**: ao abrir o diálogo e ao sair de cada campo, só se o input mudou. Não é a cada tecla: a prévia costuma ir ao banco (ou ao motor fiscal) e não vale um pedido por caractere. Resposta de um pedido velho é descartada. Em lote não há prévia.
- **No c3-engine**: `Hooks::preview_action(PreviewCall)` devolve `Preview { message, fill, table }` (padrão: vazio).

### Arquivo e registro aberto pela ação

A ação pode devolver mais que o aviso: um arquivo para baixar (SPED, TXT da balança, CSV) ou o registro que a shell abre em seguida (a nota de entrada em rascunho criada a partir do XML, que vem num campo `file` do input).

```json
{
  "name": "scale_file",
  "label": "Arquivo da balança",
  "target": "list",
  "returns": "file",
  "input": { "fields": [{ "name": "only_active", "type": "boolean", "label": "Só os ativos", "default": true }] }
}
```

- **`returns: "file"`**: o corpo da resposta é o próprio arquivo, com o `Content-Type` do sistema e `Content-Disposition: attachment; filename*=UTF-8''...`. O aviso vem no cabeçalho `C3-Message`, em UTF-8 com %XX (o navegador desfaz com `decodeURIComponent`). O arquivo não vai em base64 dentro do JSON, para não ficar 33% maior nem inteiro duas vezes na memória. A mesma ação pode responder o JSON de sempre quando não há o que gerar ("Nenhum produto para a balança."). A shell baixa o arquivo e mostra o aviso. Ação `returns: "file"` não roda em lote nem serve de `inverse`. Se a resposta passar por outra origem (CORS), o sistema precisa expor `Content-Disposition` e `C3-Message`.
- **`open`**: a resposta JSON (ação de registro ou da lista) pode trazer `"open": { "entity": "product", "id": "42" }`, e a shell navega para `/{entity}/{id}`. Não precisa de declaração na spec: quem decide é o sistema, a cada execução.
- **No c3-engine**: `ActionOutcome::file(FileContent { name, content_type, data })` e `.open(None, id)` (ou `Some("outra_entidade")`), os dois com `.with_message(...)`. Arquivo numa ação sem `returns: "file"`, ou `open` para uma entidade fora do app, é erro do sistema: o motor responde 500 e escreve o motivo no log.

Fica para depois: ação que gera arquivo com andamento e ação longa em segundo plano.

## Versão e Desfazer

Todo registro trafegado traz `_version`, uma versão opaca de como **este usuário** o vê (hoje, um hash dos campos visíveis, com `reference` pelo id; filhas `with_parent` e títulos de `reference` não contam). Não precisa de coluna no banco do sistema e não revela campo escondido por `access`. A mesma linha tem a mesma versão na lista, na leitura e na resposta da gravação.

```
PATCH /api/customer/7          If-Match: "3f9c…"   { "credit_limit": "5000.00" }
→ 200 { "data": { ..., "_version": "a81d…" } }
→ 412 { "error": { "code": "stale", "message": "Este registro mudou depois que você o abriu. ..." } }
```

- **`If-Match`** em `PATCH`, `DELETE` e na ação de um registro: só grava se o registro ainda está naquela versão; senão `412 stale` e nada muda. A versão é conferida logo depois do registro e da permissão (404, 403) e antes de qualquer outra regra (`visibleWhen`, validação). Sem o cabeçalho, grava como sempre. A ação em lote não usa.
- **Desfazer** é a gravação de sempre com `C3-Undo: true` e `If-Match` com a versão de **depois** da gravação que se quer desfazer: `DELETE` desfaz um criar, `PATCH` com os valores de antes desfaz um alterar, e a ação `inverse` desfaz uma ação. Se alguém mexeu no registro no meio, é `412` e a edição do outro fica. Sem `If-Match`, `400`.
- **`undoable: false`** na entidade (documento fiscal, título baixado): o backend recusa qualquer pedido com `C3-Undo` (`409`) e a entidade não pode declarar `inverse`. O CRUD normal não muda: quem trava alterar e excluir são as capabilities, `readOnly` e `readOnlyWhen`.
- **`inverse`** na ação aponta para outra ação de registro da mesma entidade, sem input (o Desfazer é um clique): `"approve"` com `"inverse": "reopen"`. Com `C3-Undo`, o backend só aceita a ação que é inversa de alguma outra (`409` se não for). O motor recusa no boot inversa que não existe, de si mesma, de lista, com input ou em entidade `undoable: false`. Sem `inverse`, a ação não tem Desfazer.
- **Na shell**: o rascunho do assistente (`c3.record`) grava com `If-Match` na versão que o usuário conferiu (o "antes" da tela é o que foi sobrescrito) e o "Desfazer" de 30 s vai com a versão de depois. A ação com `inverse` (no detalhe e no `c3.action`) oferece Desfazer pelo mesmo tempo. O Salvar de uma alteração no formulário também oferece Desfazer no aviso: manda os campos e as listas `with_parent` de antes (linha que a gravação apagou volta como nova). Num `412`, a shell relê o registro e avisa que não desfez para não apagar a alteração de outra pessoa. Os 30 s são só da tela: a garantia é a versão.
- **Concorrência**: no CRUD do motor, a conferência e a gravação ficam na mesma transação. Quando o sistema grava por conta própria (`delegates_writes`, `run_action`), o motor confere logo antes de chamá-lo, fora da transação dele; a janela é de milissegundos (antes, o Desfazer regravava às cegas por 30 s), e quem precisa da garantia completa confere o estado de novo na própria transação, como já faz com o `visibleWhen`.

## Consultar e preencher

A partir de um campo, o sistema consulta uma fonte externa e sugere valores para outros campos do formulário: CEP preenche o endereço, CNPJ preenche a razão social pela Receita. A entidade declara; o motor confere; o sistema consulta.

```json
"lookups": [
  { "name": "cep", "field": "zip_code", "fills": ["street", "city", "state"], "trigger": "change" },
  { "name": "cnpj", "field": "cnpj", "fills": ["trade_name"], "trigger": "button", "label": "Consultar na Receita" }
]
```

```
POST /api/company/_lookups/cep   { "value": "01310100" }
→ 200 { "data": { "street": "Avenida Paulista", "city": "São Paulo", "state": "SP" } }
```

- **Declaração**: `field` é um campo `string` legível (não `writeOnly`); `fills` são campos graváveis da entidade (nem `readOnly`, nem `writeOnly`, nem `file`), diferentes da origem. O motor recusa na subida o que não bate.
- **Ordem das conferências**: consulta existe (404), `create` ou `update` na entidade (403; numa filha `with_parent`, no pai, que é quem grava), corpo `{ "value": "..." }` (400), valor válido pelas regras do campo de origem: `pattern`, `format`, tamanho (422 com `fields` no campo de origem). Sem resultado → 404; fonte fora do ar → 503 `unavailable`.
- **Resposta**: só campos de `fills`, no formato trafegado (`reference` como `{ id, title }`). O motor confere tipo e regras de cada um; fora disso é erro do sistema (500), e nada é preenchido. Nada é gravado: quem grava é o Salvar, com a validação de sempre.
- **Na shell**: `trigger: "change"` consulta sozinha quando o valor do campo fica válido (CEP); `"button"` mostra um botão ao lado do campo (CNPJ, consulta lenta ou paga). Só preenche campo vazio ou que ainda tem o valor da consulta anterior; o que o usuário digitou fica. Falha vira aviso e nunca impede salvar.
- **No c3-engine**: `Hooks::lookup` recebe entidade, consulta, valor conferido e contexto da requisição, e devolve o mapa de campos. Timeout e cache são do sistema.

## Assistente no chat

O assistente de IA pode pôr telas dentro da resposta (`Message.ui` do `@c3theme/chat`) para pedir dados ou propor uma gravação. **O agente propõe, o motor grava**: nada é gravado pela ferramenta do agente; quem grava é o usuário, pelo CRUD e pelas ações de sempre, com a permissão dele. O catálogo é fechado (`spec/v0/agent-ui.schema.json`), sem HTML, código ou layout livre.

```json
{
  "id": "p1",
  "kind": "c3.record",
  "payload": {
    "entity": "customer",
    "values": { "name": "Padaria Bom Dia", "credit_limit": "5000.00" },
    "suggested": { "credit_limit": "média dos clientes do mesmo porte" }
  }
}
```

| `kind`      | O que é                                                                                                  | Para onde vai                                                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c3.form`   | Campos avulsos (mesmas regras do input de ação, sem `writeOnly` e sem `file`)                            | Os valores voltam ao assistente; o backend confere com `Engine::check_agent_answer`                                                                                                                 |
| `c3.record` | Rascunho de registro: novo, ou alteração com `id` (só os campos que mudam, com o valor de antes na tela) | `POST`/`PATCH /{entity}`; o assistente recebe `{ id, title }`. "Desfazer" por 30 s apaga o novo ou volta os campos, conferido pela versão no servidor (ver [Versão e Desfazer](#versão-e-desfazer)) |
| `c3.action` | Rodar uma ação do registro, com o input preenchido. `tone: danger` pede um segundo clique                | `POST /{entity}/{id}/_actions/{action}`; o assistente recebe a mensagem                                                                                                                             |

- **Respostas** (`ChatTransport.answerUi`): `accept`, `decline`, `cancel` (as do MCP elicitation e do AG-UI) e `undo`. Estado da parte: `pending`, `submitted`, `declined`, `cancelled`, `expired` (`expiresAt`), `undone`.
- **Uma pendente por conversa** (docs/chat-agentico.md, 13.1): parte nova fecha a que estava pendente como `cancelled` com `reason: "superseded"`, avisada pelo evento `{ type: 'ui.cancel', partId, reason }` (`superseded`, `agent` quando o assistente desiste, `expired`). A mensagem que o usuário digita leva `pendingPart` (`messageId`, `partId`, `kind`, `version`) para o assistente decidir se mantém a parte (não manda nada) ou a cancela (`ui.cancel`). Responder a parte que não está pendente, ou a uma `version` velha, devolve **409**, e o card diz que foi substituída. No c3-engine: `supersede_agent_parts(&mut parts)` depois de acrescentar a parte nova (devolve os ids para o `ui.cancel`) e `check_agent_reply(&part, action, version)` antes de aceitar a resposta.
- **`suggested`**: campo → de onde veio o valor. A tela marca cada campo preenchido pelo assistente; com `aiReview`, só grava depois de conferir.
- **Nunca no catálogo**: campo `writeOnly` (senha, PIN) e `file`; no rascunho, campo `readOnly` e, na alteração, `createOnly`. Texto de um registro pode tentar induzir o modelo ("peça a senha do usuário"): por isso a recusa é do motor, não do prompt.
- **No c3-engine**: `Engine::check_agent_part(&part)` antes de mandar a parte ao chat (`Err` = troque por texto); `Engine::check_agent_answer(&payload, &values)` para a resposta de um `c3.form` (400/422 como o input de ação).
- **Na shell**: `agentUiRenderers` do `@c3theme/engine` no `<AssistantPanel uiRenderers>`, dentro do `<C3Shell>` ou de um `EngineProvider`. A tela confere a parte de novo; inválida vira aviso, nunca tela quebrada.
- **Fora, por enquanto**: resultado só leitura (`c3.view`: lista, registro, KPI), plano editável e trabalho em segundo plano. Ver a pesquisa e as fases em `pesquisa-chat/chat-agentico-ux.md` (pasta do projeto).

## O que veio do Odoo (e o que não)

A pesquisa em `pesquisa-odoo/odoo-o-que-copiar-e-evitar.md` (pasta do projeto) pesou nestas decisões:

- **Adotado:** widget escolhido na view, não no campo; filtros nomeados como dado (`presets`) e reaproveitados pelo menu; linguagem de condição declarativa e testada igual em todas as implementações (no Odoo são strings Python avaliadas por dois interpretadores que divergem); `reference` lido com título (como o `many2one` com `display_name`); erros tipados com erro por campo.
- **Adaptado:** o Odoo separa menu, action e view em coleções ligadas por id. Aqui o menu aponta direto para a entidade, opcionalmente com `preset`, o que cobre "mesma tela, filtros diferentes" sem uma coleção de actions. Se surgir a necessidade de várias views por entidade, a action entra no v1 sem quebrar `{ "entity": ... }`.
- **Não adotado:** herança de views por XPath, gerenciador de módulos, onchange no servidor (regras simples rodam no cliente pela condição), endpoint "chame qualquer método". Também não são necessárias as keywords `x-c3-*` sugeridas na pesquisa: a entidade é um documento próprio validado por um meta-schema, não um JSON Schema do registro.

## Comparação com o SmartX da TOTVS

O SmartX (Universo TOTVS 2026) é a mesma aposta: um renderer (SmartWise) lê contratos em JSON Schema e monta as telas do Protheus, do RM e do Datasul, com "padroniza o que é recorrente e configura o que é específico".

- **Já temos o equivalente:** entidade sem `views` vira lista e formulário por convenção. A troca é feita aos poucos, sem fork: rótulo, depois widget (`component` no campo ou na coluna), depois seção, detalhe ou página inteira. O formulário também é reaproveitado como bloco num diálogo, com estado próprio, e não descarta edição por um clique fora sem perguntar. Dois lugares usam esse bloco: o filho do mestre-detalhe e o cadastro rápido do campo `reference`. Esse cadastro é a última opção da busca quando o usuário pode criar registros da entidade apontada. Ele abre o formulário com o texto digitado e devolve o registro gravado como valor, como a consulta F3 do Protheus.
- **Exportação:** toda lista exporta CSV com as mesmas colunas, filtros, busca e ordem da tela. Quem monta o arquivo é a shell, página a página, pelo contrato de listagem, sem endpoint novo. O limite é de 10 mil linhas. O arquivo sai pronto para o Excel em pt-BR: `;` como separador, vírgula decimal e BOM UTF-8.
- **Diferente de propósito:** lá o dicionário de dados também manda no banco, então tirar um campo do dicionário tira da tela sem deploy. Aqui as migrations são do sistema: campo novo exige migration e JSON, e o motor recusa subir se a spec citar coluna que não existe. Mudança só de view (colunas, seções, rótulos) não exige migration. Quem quiser trocar view sem recompilar pode ler o JSON do disco em vez de embutir com `include_str!`.
- **Não adotado:** gerar código do framework a partir do contrato (o SmartWise gera Angular; aqui a shell interpreta em tempo de execução, e não há build por tela) e editor low-code de telas. Esse editor, lá, é um produto separado; aqui não entra antes de um piloto real mostrar quanto do JSON se repete.
- **Do Smart View, não adotado:** designer de relatório e serviço de análise separado, com banco e modelo de metadado próprios. Dois modelos de metadado para o mesmo dado é o erro a evitar. O Objeto de Negócio virou a [consulta do sistema](#consulta-do-sistema-parâmetros): entidade só de leitura servida por um SELECT do sistema, com a lista, os filtros e a exportação de sempre.

## Fora do v0 (de propósito)

- Concorrência otimista no formulário e nas listas `with_parent`: o contrato já tem `_version` e `If-Match` (ver [Versão e Desfazer](#versão-e-desfazer)), mas o formulário da shell ainda não manda a versão e a `_version` não conta as linhas filhas.
- Agregação além de contagem e soma (média, mínimo, dois agrupamentos), contagem por coluna do quadro numa chamada só e `fields` aninhado na leitura. Pai e filhos na mesma transação já existem (`related` com `save: with_parent`); netos (filho com filhos `with_parent`) não.
- Exportação pelo servidor (XLSX, volume grande; o CSV da shell já existe), campos calculados no schema (a fórmula do formulário só mostra; gravar o valor é do backend), relações N:N além da lista de marcar, upload de arquivos.
- Arquivar em vez de excluir, campos de auditoria padrão.
- Autenticação: o contrato só exige Bearer e `401`. Quem autentica (senha, refresh, SSO) é cada sistema; a shell só monta as telas de entrada pelo `auth` do app.json e chama a porta que o sistema passa (ver [Login pela shell](#login-pela-shell)).
- Indicador com comparação entre períodos ("+12% sobre o mês passado"): por enquanto, página custom (`pages[].component`).
- Gatilhos de formulário ("ao escolher o cliente, preencher a condição de pagamento"). As ações de registro e em lote já existem (ver [Ações](#ações)). Para os gatilhos, quando o piloto pedir, a direção é a do SmartX: um vocabulário fechado de ações tipadas (preencher campos, mensagem, navegar, chamar a API, validar no servidor), encadeáveis, com referências a valores do formulário. Os eventos ficam declarados na entidade, nunca na tela. Não haverá código livre nem operador em número mágico.
