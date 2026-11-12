---
name: c3-chat
description: Monta chat de pessoas ou de assistente de IA com o @c3theme/chat (contrato de mensagens, porta ChatTransport, useMessageWindow, MessageList, Composer, AssistantPanel, AgentWorkspace) e põe telas do motor dentro da resposta do assistente (c3.form, c3.record, c3.action) com agentUiRenderers. Use ao integrar o chat a um backend, implementar o transporte, fazer o agente pedir dados ou propor uma gravação, ou corrigir streaming, fila e cards de pergunta.
---

# Chat e assistente com @c3theme/chat

Duas camadas:

- `@c3theme/chat/core` é headless (só React, sem MUI e sem rede): contrato (`Message`, `Conversation`, `UiPart`), a porta `ChatTransport` e hooks (`useMessageWindow`, `useDraft`, `useMessageQueue`, `useTypingStatus`, `useVoiceRecorder`).
- `@c3theme/chat` acrescenta os componentes sobre o `@c3theme/ui`: `MessageList` (virtualizada), `MessageBubble`, `Composer`, `ConversationList` para chat de pessoas; `AssistantPanel`, `AgentComposer`, `AgentWorkspace`, `QuestionCard`, `ActivityTrace` para assistente; `AgentNowCard`, `ContextMeter`, `AgentTimeline`, `RecentFiles` para o painel ao lado que acompanha o agente através de vários turnos; `ModelPicker` para escolher o modelo (grupos por provedor, etiquetas Grátis/Local/Precisa entrar, busca, reserva) e `ComposerSelect` para listas curtas (modo, esforço).
- Caixa do agente numa linha só, como nos apps de agente: `AgentComposer variant="inline"` com `idleAction` (voz) e `ComposerIconButton` nas `endActions`. No `AssistantPanel`, passe em `composer`. Não monte composer próprio para isso.
- Caixa com barra embaixo (texto numa linha com o enviar dentro; +, voz, modelo, esforço e `ContextRing` embaixo): `variant="split"`. Voz ao vivo: `AssistantPanel voice={...}` (`VoiceConversation`), ligada pelo `idleAction`; o áudio e o provedor são do app, `useAudioLevel` dá o volume.

**Regra ([ADR 0003](../../../../docs/adr/0003-motor-sem-excecoes.md)): o chat não é exceção ao motor.** Toda interação que o agente pede ao humano é uma parte do catálogo (`spec/v0/agent-ui.schema.json`); kind que não existe vira issue `lacuna:` no `cecon/C3Theme`, nunca renderizador próprio do sistema. A tela do chat em si ainda se monta em TS até a issue #71 (chat no `app.json`) fechar: enquanto isso, cite `// lacuna: cecon/C3Theme#71` onde montar o `AssistantPanel`.

Instale preso a um commit (`github:cecon/C3Theme#<sha>&path:packages/chat`) e **leia o `packages/chat/CHANGELOG.md`** ao atualizar: as entradas marcadas **Quebra** exigem mudar o app (ex.: na 0.6.0, `switch` exaustivo em `ChatEvent` precisa tratar `ui.cancel`).

## O app implementa o transporte; o chat não faz fetch

```ts
const transport: ChatTransport = {
  loadMessages: (conversationId, { before, limit }, signal) => api.history(conversationId, before, limit, signal),
  send: (msg) => api.send(msg),                   // devolve a mensagem gravada com o mesmo clientId
  subscribe: (conversationId, onEvent) => ws.on(conversationId, onEvent), // devolve como parar
  stop: (conversationId) => api.stop(conversationId),                     // opcional: mostra o botão Parar
  answer: (conversationId, messageId, answer) => api.answer(...),         // opcional: botões do card de pergunta
  answerUi: (conversationId, messageId, partId, answer) => api.answerUi(...) // opcional: telas na resposta
};
const chat = useMessageWindow(transport, conversationId, { me });
<AssistantPanel chat={chat} suggestions={['Clientes sem compra no mês']} uiRenderers={agentUiRenderers} />
```

- **Eventos** (`subscribe`): `message` (nova ou atualizada; repetir é seguro), `removed`, `delta` (pedaço de texto; `channel: 'reasoning'` vai para o raciocínio; `done` encerra), `typing`, `ui.cancel`.
- Streaming: mande primeiro a `message` com `streaming: true` e depois os `delta`. Sem texto ainda, a tela mostra "Pensando…".
- `Message.format: 'markdown'` aceita negrito, listas, tabelas e código, **sem HTML**. `tools` mostra as ferramentas usadas; `reasoning`, o raciocínio recolhível; `question`, o card de pergunta com opções.
- Para protótipo e teste: `memoryTransport(seed, { latencyMs, me, onAnswerUi })`. Exemplo completo de agente falso: `apps/engine-demo/src/assistant/` no C3Theme.

## Telas do motor dentro da resposta

O agente **propõe** e o motor **grava**. A ferramenta do agente nunca grava sozinha: quem grava é o usuário, pelo CRUD e pelas ações de sempre, com a permissão dele. O catálogo é fechado (`spec/v0/agent-ui.schema.json`), sem HTML, código ou layout livre.

| `kind`      | Para                                                  | O que acontece                                                                      |
| ----------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `c3.form`   | pedir dados avulsos (período, motivo, cliente)        | os valores voltam ao assistente; o servidor confere com `Engine::check_agent_answer` |
| `c3.record` | rascunho de registro novo, ou alteração com `id`      | `POST`/`PATCH` normal com `If-Match`; "Desfazer" por 30 s                           |
| `c3.action` | rodar uma ação do registro com o input preenchido     | `POST /{e}/{id}/_actions/{a}`; `tone: danger` pede um segundo clique                |
| `c3.tool`   | aprovar uma ferramenta, com os args editáveis antes   | volta `accept` `{ args, edited, always? }` ou `decline` `{ reason? }`; o agente roda depois |
| `c3.plan`   | aprovar o plano (desmarcar, reordenar, reescrever)    | volta `accept` `{ steps, removed, edited }` ou `decline` `{ reason? }`              |
| `c3.browser`| parar numa página antes do passo arriscado            | volta `accept` `{ decision: allow \| takeover }` ou `decline`; `frame` só imagem     |

```json
{ "id": "p1", "kind": "c3.record",
  "payload": { "entity": "customer",
    "values": { "name": "Padaria Bom Dia", "credit_limit": "5000.00", "seller_id": { "id": "7", "title": "Ana" } },
    "suggested": { "credit_limit": "média dos clientes do mesmo porte" } } }
```

- No front: `agentUiRenderers` do `@c3theme/engine` no `uiRenderers` do `AssistantPanel`, dentro do `<C3Shell>` (ex.: um botão em `layout.header.actions`) ou de um `EngineProvider`. Fora disso, os cards não acham o cliente da API.
- `values` vai no formato trafegado: decimal em string, reference como `{ id, title }` para a tela mostrar o nome.
- `suggested` diz de onde veio cada valor, e a tela marca o campo. Campo com `aiReview: true` (preço, CFOP, conta) só grava depois de o usuário conferir.
- **Nunca no catálogo**: campo `writeOnly` (senha, PIN) e `file`; no rascunho, campo `readOnly`; na alteração, `createOnly`. A recusa é do motor, não do prompt, porque o texto de um registro pode tentar induzir o modelo a pedir a senha.
- No servidor, antes de mandar a parte: `engine.check_agent_part(&part)`; se der `Err`, mande texto no lugar.
- Respostas (`UiAnswer`): `accept`, `decline`, `cancel` e `undo`. Estados: `pending`, `submitted`, `declined`, `cancelled`, `expired` (`expiresAt`) e `undone`.

## Uma pendente por conversa

- Parte nova fecha a que estava pendente como `cancelled` com `reason: "superseded"`. O servidor avisa com `{ type: 'ui.cancel', conversationId, partId, reason }`; os motivos são `superseded`, `agent` (o assistente desistiu) e `expired`.
- A mensagem que o usuário digita leva `pendingPart` (o `useMessageWindow` preenche). O assistente decide se mantém a parte (não manda nada) ou a cancela.
- Resposta a uma parte que não está pendente, ou com `version` velha, é **409**: rejeite o `answerUi` com `UiConflictError` (ou um erro com `status: 409`), e o card fecha como substituído.
- No c3-engine: `supersede_agent_parts(&mut parts)` depois de acrescentar a parte nova (devolve os ids para o `ui.cancel`) e `check_agent_reply(&part, action, version)` antes de aceitar uma resposta.

## Armadilhas

- Não gere HTML nem JSX com o modelo para mostrar dado: use markdown ou uma parte do catálogo. Resultado só leitura rico (`c3.view`: lista, registro, KPI) ainda não existe; por enquanto, use tabela em markdown com link para a tela.
- Não grave pela ferramenta do agente "para poupar um clique". Isso pula permissão, validação, auditoria e Desfazer.
- Não abra um formulário quando o dado já está na conversa. Pergunte só o que falta: cada card é uma interrupção.
- Telemetria do assistente: `onTelemetry` + `taskOf={agentTaskOf}` no `AssistantPanel` usam os mesmos `entity`/`op` da tela, com `channel: 'chat'`.
- O desenho e as decisões (por que catálogo fechado, uma pendente, aprovação proporcional ao risco) estão em `docs/chat-agentico.md` do C3Theme.
