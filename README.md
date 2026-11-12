# C3Theme

Tema, layout e motor de telas da C3. A ideia: cada sistema descreve suas telas em JSON (entidades, campos, listas, formulários, ações) e serve esse JSON pelo próprio backend; uma shell React única renderiza tudo com o mesmo visual, os mesmos componentes e o mesmo jeito de salvar.

Monorepo pnpm + Cargo com o pacote de UI sobre MUI, o renderer do motor, a spec do contrato, o backend de referência em Rust, a suíte de conformidade, um **seed** para iniciar projetos e uma **vitrine** com telas de exemplo.

## Como as peças se encaixam

```
apps (React)                                   backend de cada sistema (Rust)
┌─────────────────────────────┐   HTTP + JSON   ┌──────────────────────────────────┐
│ @c3theme/engine  <C3Shell>  │ ─────────────▶  │ c3-engine (rotas Axum)           │
│   lê /_meta, monta telas    │  /_meta, CRUD,  │   /_meta, CRUD, condições, erros │
│ @c3theme/ui  tema e layout  │  ações, lote    │   Store ─▶ sqlx ou rusqlite      │
└─────────────────────────────┘                 │ hooks: regra, permissão, escrita │
                                                └──────────────────────────────────┘
                  ▲ spec/ (JSON Schema + OpenAPI) define o contrato dos dois lados
                  ▲ @c3theme/conformance testa qualquer backend contra ele
```

Cada sistema é dono do banco, das migrations, da autenticação e das regras de negócio (hooks). O motor entrega a parte repetida: metadados, listagem com filtro e paginação, formulário, validação, escopo de empresa/filial, ações de registro e em lote, formato de erro. **Toda tela nasce em JSON no motor, sem exceção** ([ADR 0001](docs/adr/0001-motor-dsl-caminho-padrao.md) e [ADR 0003](docs/adr/0003-motor-sem-excecoes.md)), inclusive o chat do assistente. O que o motor não alcança vira issue `lacuna:` neste repositório, não tela em TS no sistema.

| Pasta                       | Pacote                      | O que é                                                                                                                                                                                                                                                       |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui`               | `@c3theme/ui`               | Tema (claro/escuro, 9 cores de marca, visual `angle`, contraste, RTL), `C3ThemeProvider`, `AppLayout` (header, menu lateral ou em barra, breadcrumbs, rodapé), painel de aparência, busca de telas, notificações, menu do usuário, `AuthLayout` e componentes |
| `packages/engine`           | `@c3theme/engine`           | Renderer da spec: `<C3Shell apiUrl>` lê `/_meta` e monta header, menu, rodapé, rotas, listas, formulários, mestre-detalhe, seletor de filial, ações e fila de pendências                                                                                      |
| `packages/conformance`      | `@c3theme/conformance`      | Suíte de conformidade do contrato (43 testes HTTP caixa-preta) e o avaliador de referência das condições                                                                                                                                                      |
| `apps/seed`                 | `@c3theme/seed`             | Ponto de partida para app sem backend do motor (obsoleto pelo ADR 0003, sai com a issue #74): login, cadastro, recuperação de senha com código, perfil, páginas de erro e manutenção, pt-BR/en                                                                                      |
| `apps/showcase`             | `@c3theme/showcase`         | Vitrine: painéis, widgets, componentes, formulários, tabelas, gráficos, mapa, calendário, chat, kanban, clientes, loja, faturas, perfis, login, landing                                                                                                       |
| `apps/storybook`            | `@c3theme/storybook`        | Storybook: catálogo isolado dos componentes do `@c3theme/ui`, do `@c3theme/chat` e do `@c3theme/flow`, com visual, marca, claro/escuro, RTL e idioma na barra de cima. Publicado em `/storybook/` junto da vitrine                                            |
| `apps/engine-demo`          | `@c3theme/engine-demo`      | Shell do CRM de exemplo rodando sobre o `c3-example`                                                                                                                                                                                                          |
| `packages/flow`             | `@c3theme/flow`             | Editor de fluxo de trabalho (grafo de passos): contrato `{ nodes, edges }`, validação e organização automática puras; canvas atrás de uma porta, adaptador padrão React Flow (MIT)                                                                            |
| `packages/electron`         | `@c3theme/electron`         | Adaptadores do motor para Electron: `ipcFetch` (renderer), `exposeC3Bridge` (preload), `serveC3`/`forwardTo`/`startSidecar` (main). Backend remoto ou binário local, sem CORS                                                                                 |
| `apps/electron-example`     | `@c3theme/electron-example` | O mesmo CRM num app Electron (`pnpm electron`), com `router="hash"` e transporte por IPC. Ver [`apps/electron-example/README.md`](apps/electron-example/README.md)                                                                                            |
| `spec`                      | —                           | Spec v0 do motor (JSON Schema, OpenAPI, exemplos, casos de condição). Ver [`spec/README.md`](spec/README.md)                                                                                                                                                  |
| `crates/c3-engine`          | crate Rust                  | Backend Axum do contrato. Gera SQL (dialeto SQLite) e executa por um `Store` que o sistema entrega; adaptador sqlx 0.8 na feature `sqlx`. Ver [`crates/c3-engine/README.md`](crates/c3-engine/README.md)                                                      |
| `crates/c3-engine-rusqlite` | crate Rust                  | Adaptador rusqlite 0.40 do `Store`, em workspace próprio (sqlx e rusqlite linkam `libsqlite3-sys` diferentes)                                                                                                                                                 |
| `crates/c3-example`         | binário Rust                | CRM de exemplo da spec servido pelo `c3-engine` (com pedido gravado por escritor próprio e auditoria); alvo da conformidade                                                                                                                                   |

## Tela é JSON

Uma entidade em JSON já é lista, busca, formulário, validação e gravação, no front e no backend:

```json
{
  "specVersion": "0",
  "name": "activity",
  "label": { "singular": "Atividade", "plural": "Atividades" },
  "fields": [
    { "name": "subject", "type": "string", "label": "Assunto", "required": true, "maxLength": 120 },
    { "name": "customer_id", "type": "reference", "entity": "customer", "label": "Cliente" }
  ]
}
```

Antes de escrever TS, suba a escada do [`c3-spec`](plugins/c3/skills/c3-spec/SKILL.md#a-escada-json-primeiro-código-por-último): convenção, view, recurso declarado, widget de campo, seção custom e, por último, página registrada. O que o motor não alcança vira issue `lacuna:` no C3Theme e trabalho no motor, nunca tela em TS escondida ([ADR 0003](docs/adr/0003-motor-sem-excecoes.md)). Exemplos completos em [`spec/v0/examples`](spec/v0/examples); para protótipo sem servidor, `createMemoryClient` do `@c3theme/engine` faz o papel do backend.

## Estado

v0, ainda sem sistema real em produção. O que existe e é testado: a spec v0, o `c3-engine` com SQLite (sqlx ou rusqlite), a shell e a suíte de conformidade rodando no CI. O que **não** existe ainda:

- Backend Node e Postgres. O `Store` já separa o driver; o SQL gerado ainda é só do dialeto SQLite.
- Piloto: o próximo passo é rodar o motor num sistema de verdade antes de crescer a spec. Se o piloto precisar de mais de 30% de telas custom, o modelo volta para a mesa.
- Publicação: `@c3theme/ui`, `chat`, `engine`, `flow` e `electron` estão prontos para o npm (`.github/workflows/release.yml`, por tag `<pacote>-v<versão>`; na primeira vez, o `ui` antes dos outros), mas nenhum foi publicado ainda: até lá se instalam por git (`github:cecon/C3Theme#<sha>&path:packages/ui`, compilados no `prepare`). O crate entra por dependência git, sem tag de versão.
- Tipos gerados: os tipos TS e as structs Rust da spec são escritos à mão; quem pega divergência é a conformidade.
- O que ficou de fora do contrato de propósito (concorrência otimista, filhos no mesmo save, agregações, upload, gatilhos de formulário) está em [Fora do v0](spec/README.md#fora-do-v0-de-propósito).

## Agentes de código

O plugin [`plugins/c3`](plugins/c3/README.md) traz quatro skills (`c3-spec`, `c3-backend`, `c3-front`, `c3-chat`) que ensinam um agente a usar o C3 num sistema: qual recurso da spec usar para cada necessidade, as armadilhas já vistas e como validar. No Claude Code, no repositório do sistema:

```
/plugin install c3 --marketplace cecon/C3Theme
```

## Stack

React 19 · MUI 9 · React Router 8 · Vite 8 · TypeScript 6 · SWR · react-intl · ESLint 10 (flat) + Prettier · Rust (Axum 0.8; banco por adaptador: sqlx 0.8 ou rusqlite 0.40)

## Começando

Requisitos: Node 22+ e pnpm 10 (`corepack enable`); Rust estável para o backend.

Shell do motor contra o backend de exemplo, o jeito normal de ver uma tela (dois terminais):

```bash
pnpm install
DATABASE_URL=sqlite://crm.db PORT=3001 cargo run -p c3-example
C3_API=http://127.0.0.1:3001 pnpm dev:engine
```

Os outros apps:

```bash
pnpm dev:showcase  # vitrine em http://localhost:3003 (seção "Por JSON": telas do motor sem servidor)
pnpm storybook     # componentes isolados em http://localhost:6006
pnpm dev           # seed, app sem motor, em http://localhost:3000 (login: demo@c3theme.dev / 123456)
```

Outros comandos na raiz:

```bash
pnpm typecheck     # tsc em todos os pacotes
pnpm lint          # ESLint (config única em eslint.config.js)
pnpm format        # Prettier
pnpm build         # build de todos os apps
pnpm create-app    # sistema novo pelo motor: front + backend Rust ou Node (ver abaixo)
pnpm spec:check    # valida os exemplos da spec do motor
pnpm skills:check  # confere as skills do plugin c3 (frontmatter, links, tamanho)
pnpm conformance   # sobe o backend Axum de exemplo e roda a suíte de conformidade
cargo test         # testes do crate c3-engine (adaptador sqlx)
cargo test --manifest-path crates/c3-engine-rusqlite/Cargo.toml  # adaptador rusqlite
```

## Demo online (Codespaces)

No GitHub, **Code → Codespaces → Create codespace** no branch desejado. O `.devcontainer` instala tudo, compila o backend de exemplo, popula o banco (`scripts/seed-demo.mjs`) e abre a shell na porta 5173. A primeira criação leva alguns minutos por causa do build do Rust; depois, reabrir é rápido. A porta nasce privada (só quem criou o codespace abre). Para mostrar a outra pessoa, na aba **Ports** troque a visibilidade da 5173 para _Private to Organization_ (repo de organização) ou _Public_ (qualquer um com o link, enquanto o codespace estiver ligado).

## Sistema novo: `pnpm create-app`

```bash
pnpm create-app portal-clientes --title "Portal de Clientes"                 # backend Rust (padrão)
pnpm create-app portal-clientes --title "Portal de Clientes" --backend node  # backend Node
```

Gera um sistema montado inteiro pelo motor ([ADR 0001](docs/adr/0001-motor-dsl-caminho-padrao.md)), sem nenhuma tela em TS:

| Pasta                                                  | O que tem                                                                                                                   |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `apps/<nome>`                                          | o front: `<C3Shell apiUrl="/api">`, os ícones que a spec cita e um README com os próximos passos                            |
| `crates/<nome>-api` (Rust) ou `apps/<nome>-api` (Node) | o backend: `spec/` (app.json com menu e painel, entidade Contato com lista e formulário), `migrations/` e os `Hooks` vazios |

Rodar: `cargo run -p <nome>-api` (ou `pnpm --filter @c3theme/<nome>-api dev`) num terminal e `pnpm --filter @c3theme/<nome> dev` no outro; a API fica em `127.0.0.1:3001`. Tela nova é JSON novo em `spec/`, com a migration da tabela. O app nasce sem login (veja o README gerado). O template fica em [`templates/create-app`](templates/create-app) e o CI gera, compila e sobe os dois backends a cada PR (`node scripts/create-app-smoke.mjs`).

## Usando o motor num sistema

As telas ficam nos JSONs do sistema (`app.json` e uma entidade por arquivo, validados por `node scripts/validate-spec.mjs <pasta>` e no boot do backend); o código abaixo só liga o motor, uma vez.

Backend (Axum, adaptador sqlx):

```rust
let pool = SqlitePoolOptions::new().connect_with(c3_engine::sqlx::sqlite_options(&url)?).await?;
sqlx::migrate!().run(&pool).await?; // migrations são do sistema
let engine = c3_engine::Engine::builder(c3_engine::sqlx::SqlxStore::new(pool))
    .app(include_str!("../c3/app.json"))
    .entity(include_str!("../c3/customer.json"))
    .hooks(MinhasRegras) // permissões, filiais do usuário, validação, ações, escrita delegada
    .build()
    .await?; // falha no boot se o JSON e o banco não batem
let app = Router::new().nest("/api", engine.router());
```

Front:

```tsx
<C3Shell apiUrl="/api" headers={() => ({ Authorization: `Bearer ${token}` })} components={{ 'crm/painel': Painel }} />
```

`components` é para os degraus de cima da escada (widget de campo, seção custom, página registrada), não para tela inteira em TS. Os componentes registrados recebem props tipadas: `CustomFieldProps` (campo com `component` na view) e `CustomSectionProps` (seção com `component`: `record`, `onChange`, `editing`, `errors`, `id` do registro gravado e `dirty` quando há alteração não salva).

Telemetria de tarefa (linha de base para comparar tela e assistente): passe `onTelemetry` ao `<C3Shell>` (ou `telemetry` ao `EngineProvider`). A shell emite `task.start` ao abrir o formulário novo, clicar Editar ou começar uma ação; `task.done` ao gravar (com `fields`, quantos campos mudaram, e `ms`); `task.abandon` ao cancelar, sair da tela ou fechar a aba sem gravar. O evento é `TaskEvent` (`taskId`, `entity`, `op`, `action`, `channel: 'screen'`), sem valores, id do registro nem usuário. O C3 só emite; guardar ou enviar (`navigator.sendBeacon`, fila) é do sistema. Ver `docs/chat-agentico.md`, 13.4.

```tsx
<C3Shell apiUrl="/api" onTelemetry={(e) => navigator.sendBeacon('/api/telemetria', JSON.stringify(e))} />
```

No assistente, o `<AssistantPanel onTelemetry taskOf={agentTaskOf}>` emite os mesmos eventos com `channel: 'chat'`: `task.start` quando aparece um `c3.record` ou `c3.action` pendente, `task.done` quando é gravado e `task.abandon` quando é recusado, fechado ou vence. `ms` conta desde o pedido do usuário (a primeira mensagem dele desde a parte anterior), `turns` é quantas mensagens ele mandou até concluir, `fields` e `suggested` são os campos que a parte grava e os que vieram sugeridos. O `taskId` é o id da parte, então um `task.start` repetido ao recarregar a conversa se descarta no destino. Na tela, `fields` são os campos que o usuário mudou.

Para trocar uma tela por vez num app que já existe, use `<EntityList>` e `<EntityForm>` direto. Convenções de tabela, hooks, adaptador rusqlite e escrita delegada: [`crates/c3-engine/README.md`](crates/c3-engine/README.md). Contrato completo: [`spec/README.md`](spec/README.md).

## App sem o motor (obsoleto)

Obsoleto pelo [ADR 0003](docs/adr/0003-motor-sem-excecoes.md): sai quando o motor cobrir o que o seed tem (issue #74). Não use em sistema novo; o script avisa isso ao rodar:

```bash
pnpm create-app portal-institucional --sem-motor --title "Portal"
pnpm install
pnpm --filter @c3theme/portal-institucional dev
```

O script copia `apps/seed` para `apps/<nome>` e ajusta o nome do pacote, `APP_NAME`, o título da página e a chave das preferências no `localStorage`.

| Quero...               | Onde                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Criar uma página       | `src/pages/...` e a rota em `src/App.tsx`                                                                              |
| Adicionar item no menu | `src/menu.ts` (grupos com itens; ícones de `iconsax-reactjs`)                                                          |
| Login de verdade       | defina `VITE_API_URL`; o contrato HTTP está em `httpAuth` (`src/auth.tsx`). Sem ela, roda o mock de `src/auth-mock.ts` |
| Traduções              | `src/locales/*.json` e a lista `LOCALES`                                                                               |
| Nome e página inicial  | `src/config.ts`                                                                                                        |
| Botões do header       | `header` do `AppLayout` em `src/App.tsx`                                                                               |

## Usando o `@c3theme/ui`

É o vocabulário que o motor monta por dentro ([ADR 0003](docs/adr/0003-motor-sem-excecoes.md)). Nenhuma tela se monta com ele direto; componente registrado que o usa cita a issue `lacuna:` que o motivou.

```tsx
import { AppFooter, AppLayout, C3ThemeProvider, ColorModeButton, CommandSearch, Notifier } from '@c3theme/ui';

<C3ThemeProvider
  branding={{ name: 'Meu App', homePath: '/inicio', logo: <img src={logo} alt="" /> }}
  defaultConfig={{ brand: 'teal', menuOrientation: 'vertical', locale: 'pt-BR' }}
  storageKey="meu-app"
  themeOverrides={ptBR} // @mui/material/locale
  loadMessages={(locale) => import(`./locales/${locale}.json`).then((m) => m.default)}
>
  {/* dentro do roteador */}
  <AppLayout
    menu={[{ id: 'cadastros', title: 'Cadastros', items: [{ id: 'clientes', title: 'Clientes', icon: People, url: '/clientes' }] }]}
    header={
      <>
        <CommandSearch />
        <ColorModeButton />
      </>
    }
    footer={<AppFooter links={[{ label: 'Suporte', href: 'mailto:suporte@exemplo.com' }]} />}
  />
  <Notifier />
</C3ThemeProvider>;
```

- **Cores**: `brand` escolhe a cor primária (`blue`, `teal`, `violet`, `orange`, `graphite`, `indigo`, `green`, `rose`, `cyan`), ajustada para cada modo.
- **Visual Angle**: `look: 'angle'` troca cores, fonte (Source Sans Pro) e densidade pelas do template Angle (Bootstrap), para telas do motor dentro de um sistema antigo que usa ele; nesse visual a cor de marca não vale. Paleta e acabamento dos componentes ficam em [`packages/ui/src/theme/createC3Theme.ts`](packages/ui/src/theme/createC3Theme.ts).
- **Modo claro/escuro**: segue o sistema até o usuário escolher no `ColorModeButton`; usa as CSS variables do MUI, então trocar não recria o tema.
- **Preferências** (`look`, `brand`, `menuOrientation`, `miniDrawer`, `locale` e as do painel) ficam salvas em `storageKey`; leia e mude com `useUiConfig()`.
- **Busca de telas**: `CommandSearch` (Ctrl+K) procura nos títulos do menu.
- **Avisos**: `notify('Salvo.')` de qualquer lugar; o `<Notifier />` mostra.
- **Aparência**: `SettingsButton` abre o painel com modo, cor, menu lateral ou em barra, menu recolhido, títulos dos grupos, largura, direção (RTL), contraste, fonte e idioma.
- **Idiomas**: os textos do pacote saem em pt-BR por padrão e em inglês embutido; passe `locales` e `loadMessages` ao provider para o seletor e as mensagens do app.
- **Componentes**: `ActionDialog`, `Panel`, `StatusChip`, `SoftAvatar`, `SoftIconButton`, `Dot`, `LinearWithLabel`, `CircularWithLabel`, `OtpInput`, `PasswordStrength`, `MessagePage`, `Breadcrumbs`, `UserMenu`, `NotificationsButton`, `Loadable`, `PageLoader`, `Logo`, `ScrollX`. A vitrine mostra cada um.
- **Campos de formulário**: `DecimalField` (escala, prefixo, sufixo), `MoneyField`, `DateField`, `SelectField` (`native` opcional), `SearchSelectField` (busca, simples ou `multiple`, local ou com `onSearch` no servidor, opção de cadastrar), `RadioField`, `FlagsField`, `FileField`. Controlados, com o valor no formato que a spec trafega (decimal e dinheiro em string com ponto, data ISO, flags como soma de bits, arquivo em base64) e `error` como mensagem. São os mesmos que o `FieldInput` do motor usa, então tela escrita à mão e tela do motor ficam iguais. Não há componente de erro: é o `helperText` do MUI. Todos aceitam `hint`, a ajuda longa atrás de uma interrogação no rótulo, que abre no clique ou toque (o `helperText` fica para a frase curta).
- **Tabela de dados** (`@c3theme/ui/table`, com `@tanstack/react-table` como peer opcional): `DataTable` recebe `rows`, `columns` e `getRowId`; com `server`, a ordenação e a paginação vão para a tela (`sorting`/`onSortingChange`, `pagination`/`onPaginationChange`, `total`) e a seleção (`rowSelection`, pelo id) sobrevive à troca de página; `stickyHeader`, `maxHeight`, `loading`. Para agrupamento, colunas fixas e redimensionar, `TableView` + `TablePagination` sobre um `useReactTable` próprio. A vitrine usa as mesmas peças (Tabelas de dados, "Modo servidor").
- **Consulta e impressão**: `PeriodFilter` (de/até, Filtrar, Imprimir, atalhos hoje/ontem/7 dias/mês; no papel vira a linha "Período: … a …") e `printHidden`/`printOnly` para `sx` (o `d-print-none`/`d-print-block` do Bootstrap).
- **App de desktop** (Electron, Tauri): `AppLayout desktop={{ platform: 'mac', translucent: true }}` para a janela sem barra de título (`titleBarStyle: 'hiddenInset'` no Mac, `titleBarOverlay` no Windows). Cabeçalho e topo do menu arrastam a janela (`-webkit-app-region`; botões, campos e links continuam clicáveis), a marca e o cabeçalho abrem espaço para os botões da janela (Mac 78 × 28 px à esquerda, Windows 138 × 32 px à direita, `controls` muda) e `translucent` deixa o menu sem fundo para a `vibrancy`/`backgroundMaterial` aparecer (número de 0 a 1 para meio-termo). Fonte do sistema e densidade compacta (texto de 13px, campos de 28/32/40px, cabeçalho de 52px) são do tema: `C3ThemeProvider tokens={desktopTokens('mac')}` (constante ou `useMemo`). Quem fixa algo abaixo do cabeçalho usa `useHeaderHeight()`. Sem `desktop`, nada muda. Histórias "App de desktop" no Storybook.

## Usando o `@c3theme/chat`

Instala por git como os outros (`github:cecon/C3Theme#<sha>&path:packages/chat`). Duas camadas: o núcleo headless em `@c3theme/chat/core` (depende só do React) e os componentes em `@c3theme/chat` (sobre o `@c3theme/ui`). O chat da vitrine é montado com ele.

- **Contrato**: `Message`, `Conversation`, `Attachment`, `Author`, `OutgoingMessage`. Datas em ISO; o que é do produto (WhatsApp, IA, ticket) vai em `meta`.
- **Porta** `ChatTransport`, que o app implementa: `loadMessages` (paginado para trás por id), `send`, `subscribe` (eventos `message`, `removed`, `typing`, `delta`), `sendTyping` e `stop` opcionais. Nenhum hook faz rede sozinho. `memoryTransport` serve para teste e protótipo.
- **Hooks**: `useMessageWindow` (abre pelas recentes, `loadOlder`, envio otimista com `sending`/`failed` e `retry`), `useDraft` (rascunho por conversa, porta `DraftStorage`, padrão localStorage), `useTypingStatus` (entrada com validade de 6 s, saída com no máximo um aviso a cada 3 s), `useVoiceRecorder` (MediaRecorder atrás da porta `RecorderDevice`).
- Funções puras para a tela: `continuesGroup` (balões seguidos do mesmo autor), `startsDay` (separador de dia).

- **Assistente de IA** no mesmo pacote, sem componente paralelo: a `Message` aceita `format: 'markdown'`, `streaming` e `tools` (ferramentas consultadas); o evento `delta` soma pedaços de texto à resposta em andamento e a porta ganha `stop` opcional. `useMessageWindow` devolve `generating` e `stop`. O markdown vira árvore pura (`parseMarkdown`) e depois elementos React, sem `innerHTML`: HTML aparece como texto e link só abre `http(s)`, `mailto`, `tel` ou caminho do sistema. `MessageList variant="assistant"` desenha a resposta sem balão, com "Pensando…", cursor de escrita, copiar e gerar de novo; o `Composer` troca Enviar por Parar com `busy`/`onStop`. `AssistantPanel` é o painel lateral pronto (cabeçalho, `ConversationPicker` com nova e apagar, sugestões na conversa vazia). Vitrine em `/apps/assistente`.
- **Área de trabalho do agente**: a resposta carrega `reasoning` (chega por `delta` com `channel: 'reasoning'`), `reasoningMs` e as etapas em `tools` com `input`, `output` e `durationMs`. Dentro da resposta, o `ActivityTrace` mostra "Pensando…" com o raciocínio e as etapas ao vivo e recolhe para "Pensou por 4 s · 2 etapas" quando a resposta começa. O `AgentWorkspace` é o painel lateral com tudo aberto (pergunta, situação, raciocínio, entrada e saída de cada etapa); `onOpenWorkspace` leva uma resposta para ele.
- **Pergunta do agente**: com `question` na mensagem (`kind` `single`, `multiple` ou `text`, opções com `primary` e `description`, `allowText`, `dismissible`), o texto vira o contexto de um card com as opções. A opção principal responde com Ctrl+Enter (⌘+Enter no Mac) de qualquer lugar da tela, menos de um campo com texto escrito; Esc ou o X dispensam. A resposta (`QuestionAnswer`) vai pelo `ChatTransport.answer`; o `useMessageWindow` marca na hora e desfaz se o servidor falhar. Sem `answer` no transporte, o card só mostra.
- **Caixa do assistente**: o `AssistantPanel` usa o `AgentComposer` (barra com +, `startActions`/`endActions` para os `ComposerSelect` de modo, modelo e esforço, enviar/parar redondo e `status` com a `StatusLine`). O que se escreve enquanto o assistente responde entra na fila (`useMessageQueue`), aparece acima da caixa para editar ou tirar e sai quando a resposta termina; depois de Parar, a fila espera.

- **Componentes**: `MessageList` (virtualizada com `@tanstack/react-virtual`, abre no fim, segue o fim, segura a posição quando o histórico entra em cima, botão "Novas mensagens", "digitando…"), `MessageBubble` (texto por `renderText`, onde entra o markup do WhatsApp ou de links, situação do envio e "Tentar de novo"), `AttachmentView` (imagem, áudio, arquivo), `Composer` (Enter envia, anexos, áudio com o microfone, `actions` para emoji ou respostas prontas) e `ConversationList`. Textos em `c3.chat.*`, português e inglês embutidos. A `MessageList` ocupa a altura do pai: a tela precisa dar altura a ela.

Mudanças que quebram compatibilidade ficam no [CHANGELOG](packages/chat/CHANGELOG.md).

## Usando o `@c3theme/flow`

Editor de fluxo de trabalho: um fluxo é um grafo de passos (gatilho, agente, condição, esperar, fim...) que o app executa; o editor só desenha e edita. Instala por git (`github:cecon/C3Theme#<sha>&path:packages/flow`). Duas camadas, como o chat:

- **Núcleo** em `@c3theme/flow/core`, sem React nem biblioteca de grafo: o contrato (`FlowGraph`, `FlowNode`, `FlowEdge`, `FlowNodeType` com entrada, saídas rotuladas e campos), as operações (`addNode`, `connect`, `unlink`, `removeNodes`...), `validateFlow` (passo solto, nenhum passo leva até aqui, saída sem ligação, ciclo sem limite, campo obrigatório vazio, tipo desconhecido), `autoLayout` (camadas da esquerda para a direita, implementação própria) e `traversedEdges` (caminho percorrido numa execução).
- **Editor** em `@c3theme/flow`: `<FlowEditor value onChange kinds run readOnly minimap height canvas>`. Controlado (`{ nodes, edges }` entra e volta pelo `onChange`). `kinds` são os tipos do app com `icon`, `tone`, `fields` (formulário declarado como dado) ou `renderConfig` (formulário próprio) e `summary`. `run` (`{ status: { [nodeId]: 'idle' | 'running' | 'waiting' | 'done' | 'failed' }, traversed? }`) acompanha uma execução ao vivo. Sem `onChange`, fica só leitura.
- **Canvas atrás de porta**: o editor fala com `FlowCanvasProps` (`canvas/port.ts`). O padrão é o `ReactFlowCanvas` (`@xyflow/react`, MIT); outra biblioteca é outro componente com as mesmas props, sem mexer no editor.
- **Teclado**: Tab passa pelos passos, Enter seleciona, setas movem, Delete remove. Ligar sem arrastar: no painel do passo, "Próximo passo" de cada saída. Textos em `c3.flow.*`, português e inglês embutidos.

## CI

O workflow `engine` roda em todo PR e no `main`: `spec:check`, `typecheck`, `lint`, `cargo fmt`/`clippy`/`test` nos dois workspaces Rust o build do Storybook e `pnpm conformance`. A verificação visual fica na vitrine, no engine-demo e no Storybook (aba Accessibility com o axe em cada história).

## Convenções

- Nada de imports profundos do MUI (`@mui/material/styles/createPalette`): o ESLint bloqueia; use os entry points públicos.
- Componente que um app precise alterar ganha uma prop no pacote, não uma cópia no app.

## Origem e licença

Código proprietário, todos os direitos reservados (ver [LICENSE](LICENSE)). Todo o código deste repositório é próprio, escrito sobre bibliotecas abertas de licença permissiva (MIT, Apache-2.0, BSD; fontes OFL: MUI, React, iconsax-reactjs, FullCalendar, MapLibre, Axum, sqlx). O tema começou derivado de um template comercial; esse código foi removido; o pacote de UI, o seed e a vitrine foram reescritos do zero, com ilustrações e dados próprios. O histórico do git ainda guarda os commits antigos com o template.
