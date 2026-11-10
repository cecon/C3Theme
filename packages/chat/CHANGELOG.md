# @c3theme/chat

Instale fixando o commit (`github:cecon/C3Theme#<sha>&path:packages/chat`). Cada entrada diz o que muda para quem usa; **Quebra** marca o que exige mudar o app.

## 0.9.0 (2026-11-10)

- Mensagem que falhou ganha **Editar** (`onEditFailed(message)`: o app devolve o texto e os anexos ao composer e tira a mensagem) e **Descartar** (`onDiscard(message)`: o app apaga), ao lado do Tentar de novo (#173). Passam por `MessageList` → `MessageRow` → `MessageBubble`, como o `onRetry`, e só aparecem com o callback. Nada quebra.
- `Composer` e `AgentComposer` anexam também colando um arquivo (print) no campo de texto e soltando arquivos em cima da caixa, com realce e "Solte para anexar" enquanto arrasta (#172). `dropTarget` (ref) troca onde soltar vale, a área do chat por exemplo. Tudo entra na mesma lista do seletor, sem repetir nome e tamanho, respeitando `accept` e `disabled`. `acceptsFile` e `addFiles` no `core` para quem monta o próprio composer. Nada quebra.

## 0.8.0 (2026-11-09)

- `AgentStrip` ganha `notch` (#142): largura em px do entalhe do Mac sobre o meio da faixa. Maior que zero, a faixa recolhida abre um vão do tamanho do entalhe, com avatar e atividade à esquerda (cortada com reticências antes do vão) e contador e seta à direita; o vão não recebe clique (o botão é recortado ali) e o leitor de tela lê na mesma ordem. A faixa precisa estar centrada no entalhe e ter largura para os dois lados (entalhe de 200 px pede uns 560 px). Sem `notch`, nada muda.

## 0.7.0 (2026-11-09)

- Peças do painel do agente (#114), para a coluna ao lado da conversa responder "o que esse agente fez, o que está fazendo e por que parou" através de vários turnos. São soltas: o app compõe como quiser. Nada quebra.
  - `AgentNowCard`: rótulo pequeno e uma linha ("Fazendo agora", "Esperando"), `tone` `neutral`/`working`/`waiting`/`error`/`done` (ponto colorido; espera e erro também na borda) e `action` opcional.
  - `ContextMeter`: barra com `used` (0 a 100), marca do resumo automático em `summarizeAt` e o texto "62% usado. Resumo automático em 85%." (`caption` troca o texto). Fica em aviso a 10 pontos do resumo. `role="meter"`.
  - `AgentTimeline`: eventos `AgentEvent` (`id`, `at`, `kind` `received`/`tool`/`delegated`/`replied`/`error`, `text`) com horário tabular e ícone por tipo; separador de dia quando muda; `onOpen(eventId)`; `hasMore`/`loadingMore`/`onLoadMore` para "Carregar mais". Erro é dito ao leitor de tela, não só pela cor.
  - `RecentFiles`: `AgentFile` (`id`, `name`, `size` em bytes) com `onOpen(fileId)`.
  - `AgentPanelSection`: o rótulo em caixa alta das seções, para o app usar nas dele. O título é `h3`; `headingComponent` (também em `AgentTimeline` e `RecentFiles`) acerta o nível conforme a página. O rótulo dos cartões não é título.
  - Helpers no core: `timelineRows`, `clampPercent`, `contextLevel`. Textos novos `c3.chat.context`, `contextUsed`, `contextSummary`, `timeline`, `timelineEmpty`, `eventError`, `loadMore`, `loadingMore`, `recentFiles`, `filesEmpty`.
- Doca e faixa dos agentes (#111), para ver de relance quem está trabalhando e responder o que espera a pessoa sem abrir a conversa. Nada quebra.
  - `AgentPresence`: avatar com anel pela cor do estado (`AgentState` `idle`/`thinking`/`talking`/`working`/`waiting`/`paused`/`error`/`done`); gira, pulsa ou respira enquanto trabalha e para com `animate={false}` ou `prefers-reduced-motion`. Selo de `pending` e marca de pausado, erro e pronto.
  - `AgentDock`: coluna de agentes (`DockAgent`) com o nome e o estado por extenso para o leitor de tela; clique abre um balão com as últimas mensagens (`messagesOf`), resposta rápida (`onReply`) e "Abrir conversa" (`onOpenConversation`). `openId` controlado ou não; `side`, `size`, `maxHeight`, `background` (desligue em janela transparente).
  - `AgentStrip`: faixa do topo; recolhida mostra o agente mais recente (`latest`, `StripActivity`) e "N pendentes", aberta empilha os pedidos. `expanded`/`defaultExpanded`/`onExpandedChange`, `width`, `height`, `avatarOf`.
  - `RequestCard`: um pedido `AgentRequest` (`approval`, `question`, `progress`, `failure`) com as ações do tipo (Permitir uma vez, Sempre permitir, Recusar; resposta; progresso e Parar; Dispensar) e "Abrir conversa". Os callbacks `RequestHandlers` recebem o pedido inteiro; o componente não chama rede.
  - Helpers no core: `AGENT_STATES`, `isBusy`, `needsAttention`, `isPendingRequest`, `pendingCount`, `sortRequests`, `progressPercent`. Textos novos `c3.chat.agents`, `agent.{estado}`, `pending`, `recent`, `replyTo`, `openConversation`, `requests`, `noRequests`, `request.{tipo}`, `allowOnce`, `allowAlways`, `decline`, `stopWork`, `dismissFailure`.
- Conversa com vários agentes (#113), cada um com nome, cor e avatar no próprio bloco. **Quebra** para quem faz `switch` exaustivo em `Message.kind` (entrou `handoff`).
  - `Author.kind` (`'person'` | `'agent'`) e `Author.color`. No `MessageList variant="assistant"` com `showAuthors`, cada agente ganha a linha de cima com avatar, marca de cor e nome; gente (`kind: 'person'`) continua em balão. Sem `kind`, nada muda.
  - `MessageList.agentStates` (estado atual por id do autor) e `animate`: anel do estado no avatar (o `AgentPresence` da doca) e o estado por extenso ao lado do nome, só no último bloco de cada agente. `renderAvatar` agora também desenha o avatar dos agentes; sem ele, iniciais ou `avatarUrl`.
  - Passagem de tarefa: `Message.kind: 'handoff'` com `Message.handoff` (`from`, `to`, `task`, `taskId`). Sai como linha centralizada com os dois avatares ("Atendente passou para Cozinha: confirmar 2 lasanhas"); com `taskId` e `MessageList.onOpenTask`, abre a tarefa. Quebra o agrupamento como o aviso do sistema. **Quebra** para quem faz `switch` exaustivo em `Message.kind`.
  - `TaskOwner`: selo do dono da tarefa no topo da conversa, com Reatribuir, Parar (só com o agente em movimento) e Arquivar por callback.
  - Aprovação de ferramenta: `AgentQuestion.kind: 'approval'` com `tool` (`name`, `label`, `input`). O `QuestionCard` mostra "{agente} quer usar {ferramenta}", argumentos recolhidos e Permitir uma vez (Ctrl+Enter), Sempre permitir e Recusar; sem X nem Esc. A resposta vai pelo `ChatTransport.answer` com `optionIds` de `APPROVAL` (`allow_once`, `allow_always`, `decline`).
  - Novos: `AuthorAvatar`, `AuthorLine`, `HandoffMarker`, `ApprovalInputs`, `MessageRow`; no core `APPROVAL`, `approvalAnswer`, `approvalChoice`, `isAgent`, `latestBlocks`, `stateFor`. Textos novos `c3.chat.handoff`, `owner`, `owner.label`, `reassign`, `archive`, `approval.*`.
- `ModelPicker`: seletor de modelo de IA para listas longas (issue #122). Opções agrupadas por provedor (`ModelGroup` com `status` e `unavailable`), etiquetas prontas (`flags`: `free` "Grátis", `local` "Local", `login` "Precisa entrar") e livres (`tags: { label, tone }[]`, tons fechados `neutral`/`info`/`success`/`warning`), busca sem acento por nome, id, descrição ou provedor, e opções indisponíveis desabilitadas com o motivo numa linha. `variant` `composer` (botão da barra) ou `field` (campo com rótulo na borda), `size` `small`/`medium`.
  - Teclado: setas (pulam as indisponíveis), digitar no gatilho abre já buscando, Enter escolhe, Esc fecha. A busca é `combobox` com `aria-activedescendant`; a lista é `listbox` com um `group` por provedor.
  - `fallback` ("Se este falhar, usar"): segundo seletor sem o principal e sem os indisponíveis, com "Sem reserva". Se o principal muda para o reserva ou o reserva fica indisponível, ele é limpo (`onChange(null)`); senão é mantido.
  - Helpers no core: `filterModels`, `normalizeSearch`, `selectableValues`, `stepModel`, `findModel`, `fallbackModels`, `keepFallback`, `unavailableReason`. Textos novos `c3.chat.model`, `chooseModel`, `searchModels`, `modelsFound`, `noModels`, `fallbackModel`, `fallbackShort`, `noFallback`, `flag.free`, `flag.local`, `flag.login`.
  - `ComposerSelect` continua para listas curtas sem busca (modo, esforço); o botão dos dois agora é o mesmo (`SelectButton`, interno).

## 0.6.0 (2026-11-04)

- Uma parte pendente por conversa (docs/chat-agentico.md, 13.1), para o usuário não responder duas vezes a mesma pergunta:
  - Parte nova do assistente fecha a que estava pendente: `state: 'cancelled'`, `reason: 'superseded'`. A janela aplica sozinha ao receber a mensagem; o servidor avisa com o evento novo `{ type: 'ui.cancel', conversationId, partId, messageId?, reason }` (`superseded`, `agent`, `expired`). **Quebra** para quem faz `switch` exaustivo em `ChatEvent`: trate `ui.cancel`.
  - `OutgoingMessage.pendingPart` (`messageId`, `partId`, `kind`, `version`): a mensagem digitada leva a parte aberta para o assistente decidir se mantém ou cancela. O `useMessageWindow` preenche.
  - `UiPart.version` e `UiAnswer.version`: a resposta leva a versão vista. Transporte que rejeita com 409 (`UiConflictError` ou erro com `status: 409`) fecha o card como substituído (com a parte que o servidor devolver, se devolver), sem voltar para pendente.
  - Card: cabeçalho "Pedido pelo assistente · substituída" ou "· cancelada pelo assistente". Textos novos `c3.chat.uiSuperseded`, `uiCancelledByAgent`.
  - `memoryTransport` segue as mesmas regras (avisa `ui.cancel`, dá 409) e devolve `cancelUi(conversationId, partId, reason?)` para simular o assistente desistindo.
  - Helpers no core: `findPendingPart`, `keepOnePending`, `supersededBy`, `applyUiCancel`, `cancelPart`, `isUiConflict`, `UiConflictError`.

## 0.5.0 (2026-11-03)

- Telas do assistente dentro da resposta (o agente propõe, o app desenha com o catálogo dele; nada de HTML do modelo):
  - Contrato: `Message.ui` (`UiPart`: `id`, `kind`, `payload`, `state` `pending`/`submitted`/`declined`/`cancelled`/`expired`/`undone`, `result`, `expiresAt`); `UiAnswer` (`accept`, `decline`, `cancel`, como no MCP elicitation e no AG-UI, mais `undo`); `ChatTransport.answerUi` opcional.
  - `useMessageWindow` devolve `answerUi(messageId, partId, answer)`: muda o estado na hora, desfaz se o transporte falhar e devolve se deu certo. `memoryTransport` aceita `onAnswerUi`.
  - `UiParts`: cada parte num card "Pedido pelo assistente", desenhada pelo renderizador do `kind` (`uiRenderers` em `AssistantMessage`, `MessageList` e `AssistantPanel`). `kind` fora do catálogo vira aviso; parte vencida fica fechada.
  - Helpers no core: `isPartOpen`, `answerPart`, `stateAfter`. Textos novos `c3.chat.uiOrigin`, `uiExpired`, `uiUnsupported`.

## 0.4.0 (2026-11-03)

- Pergunta do agente no chat (o assistente para e pergunta antes de agir):
  - Contrato: `Message.question` (`AgentQuestion`: `prompt`, `kind` `single`/`multiple`/`text`, `options` com `primary` e `description`, `allowText`, `placeholder`, `dismissible`, `answer`); `QuestionAnswer` (`optionIds`, `text`, `dismissed`); `ChatTransport.answer` opcional.
  - `useMessageWindow` devolve `answer(messageId, answer)`: marca a resposta na hora e desfaz se o transporte falhar. Sem `answer` no transporte, fica `undefined`.
  - `QuestionCard`: o texto da mensagem vira o contexto, a pergunta em destaque, um botão por opção (a principal com Ctrl+Enter), caixas de marcar com "Responder" ou texto livre; X ou Esc dispensam. Respondida, vira um resumo com o que foi escolhido. `AssistantMessage`, `MessageList` e `AssistantPanel` ganharam `onAnswer`; só a última pergunta em aberto atende o Ctrl+Enter fora do card.
  - Helpers no core: `isPending`, `isAnswerReady`, `primaryOption`, `answerLabels`. Textos novos `c3.chat.question`, `dismiss`, `reply`, `otherAnswer`, `dismissed`, `yourAnswer`.
- Caixa de mensagem do assistente no jeito dos agentes de IA:
  - `AgentComposer`: texto em cima e barra embaixo com +, os seletores que o app passar (`startActions`, `endActions`) e o botão redondo de enviar/parar; `status` por último. Esc para a resposta. Os seletores encolhem pela largura da caixa (container query).
  - Fila da próxima mensagem: `useMessageQueue` (no core) guarda o que se escreve enquanto o assistente responde e manda uma por vez quando a resposta termina; depois de Parar, espera. `QueuedMessages` mostra a fila acima da caixa com editar, enviar agora e tirar.
  - `ComposerSelect` (modo/permissão, modelo, esforço; opções com descrição e badge) e `StatusLine` (itens prontos do servidor e progresso de 0 a 100). Nada preso a provedor: tudo entra por props.
  - `AssistantPanel` usa o `AgentComposer` com a fila (`queue={false}` desliga).
  - Textos novos `c3.chat.queued`, `queue`, `editQueued`, `removeQueued`, `sendNow`, `files`, `add`, `queueSend`, `queueHint`.
- **Quebra**: a prop `composer` do `AssistantPanel` agora é do `AgentComposer` (saíram `voice` e `actions`; use `startActions`/`endActions` e `addItems`). O `Composer` do chat entre pessoas não mudou.

## 0.3.0 (2026-11-02)

- Área de trabalho do agente, como no Claude e no ChatGPT:
  - Contrato: `Message.reasoning` e `Message.reasoningMs`; `ToolCall.input`, `ToolCall.output` e `ToolCall.durationMs`; `delta` com `channel: 'reasoning'` (o `appendDelta` ganhou o mesmo parâmetro).
  - `ActivityTrace`: dentro da resposta, "Pensando…" com o raciocínio ao vivo e as etapas; recolhe para "Pensou por 4 s · 2 etapas" quando a resposta começa e abre de novo com um clique.
  - `ToolStep`: etapa com situação, tempo e entrada/saída expansíveis (erro já abre aberto).
  - `AgentWorkspace`: painel lateral com a pergunta, a situação (Trabalhando, Respondendo, Concluído), o raciocínio e as etapas abertos. `onOpenWorkspace` em `AssistantMessage`, `MessageList` e `AssistantPanel` abre uma resposta nele.
  - `useWorkTime`/`isWorking`: tempo de trabalho vindo do servidor (`reasoningMs`) ou medido na tela.
- **Quebra**: `ToolCalls` (chips "Consultou:") saiu; o `ActivityTrace` ocupa o lugar dele. A chave `c3.chat.toolsUsed` também saiu.

## 0.2.0 (2026-11-02)

- Modo assistente de IA no mesmo chat (nada muda para quem só usa conversa entre pessoas):
  - Contrato: `Message.format` (`'markdown'`), `Message.streaming`, `Message.tools` (`ToolCall`); evento `delta` (pedaço de texto, `done` encerra); `ChatTransport.stop` opcional.
  - `useMessageWindow` devolve `generating` e `stop`. `memoryTransport` aceita `onStop` e grava os `delta`.
  - Markdown seguro: `parseMarkdown`/`parseInline` (árvore pura, no core) e `<Markdown>` (sem `innerHTML`; parágrafo, títulos, listas, citação, código, tabela, links seguros). `MessageBubble` usa sozinho quando `format: 'markdown'`.
  - `MessageList variant="assistant"` e `onRegenerate`; `AssistantMessage`, `ToolCalls`, `ConversationPicker`, `AssistantPanel`.
  - `Composer`: `busy` + `onStop` (botão Parar, Enter não envia) e `hint`.
  - Textos novos `c3.chat.*` (assistente, pensando, parar, copiar, gerar de novo, conversa, apagar).

## 0.1.0 (2026-10-30)

- Componentes sobre o `@c3theme/ui`: `MessageList` (virtualizada), `MessageBubble`, `AttachmentView`, `Composer` (com áudio), `ConversationList`, `TypingIndicator`; textos `c3.chat.*` em português e inglês.
- Núcleo headless em `@c3theme/chat/core`: contrato de mensagens, porta `ChatTransport`, `DraftStorage`, `useMessageWindow`, `useDraft`, `useTypingStatus`, `useVoiceRecorder`, `memoryTransport`.
