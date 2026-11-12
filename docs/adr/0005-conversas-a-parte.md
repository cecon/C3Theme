# 0005. Conversas à parte e ações por mensagem no chat

## Status

Aceita em 12/11/2026 (issue #10, pedido do Piecework; sob o [ADR 0003](0003-motor-sem-excecoes.md)).

## Contexto

Na conversa com o agente, o Piecework precisa de "conversas à parte": a pergunta lateral, que não interrompe o
trabalho em andamento, e o ramo, que tenta outro caminho a partir de uma resposta. Como o chat não tinha isso, o app
montou uma ponte em React (`LanePanel.tsx` do Piecework) com gaveta, lista, `MessageList` e `AgentComposer`, e só
conseguia oferecer "ramo da última resposta", porque a `MessageList` não tinha ações por mensagem. Pelo ADR 0003, isso
precisa ser declarável no `app.json`.

## Decisão

1. **Conversa à parte é uma conversa comum** do chat, com `kind` (`aside` ou `branch`), `parentId` e, no ramo,
   `fromMessageId`. As mensagens dela usam as mesmas rotas e o mesmo `useMessageWindow` da principal; só há duas rotas
   novas, listar e abrir (`spec/v0/chat-lanes.yaml`). Quem decide o que o agente faz com o histórico do ramo (até a
   mensagem de origem, inclusive) é o sistema, como a autenticação.
2. **Ação por mensagem é dado, não função.** `messageActions: [{ id, label, when?, opens? }]`, com `when` como filtro
   (`direction`, `author`), cabe no `app.json` (`$defs/chatMessageAction`). Com `opens`, abre uma conversa à parte; sem,
   a shell chama `POST /_chat/{c}/messages/{m}/_actions/{id}` e o sistema decide. Mensagem de sistema, passagem de
   tarefa, resposta chegando e mensagem ainda enviando nunca têm ações.
3. **`lanes` liga o pacote pronto** (`$defs/chatLanes`): o botão "À parte" na caixa (o texto escrito vira a primeira
   pergunta) e o "Ramificar daqui" (`c3.branch`) nas respostas, cada um desligável.
4. **Camadas.** Regras puras em `@c3theme/chat/core` (`actionsFor`, `matchesMessage`, `messagesUntil`, `sortLanes`);
   peças em `@c3theme/chat` (`MessageActionsMenu`, `AsideButton`, `LaneList`, `LanePanel`, que reusa o
   `AssistantPanel` para a conversa aberta); no `@c3theme/engine`, a tradução do JSON (`laneActions`, `hasAside`) e o
   adaptador HTTP (`lanesApi` sobre `C3Client.raw`, `runLaneAction`). O motor não importa o chat: as formas batem por
   estrutura. A montagem na shell (`pages[].chat`, `layout.header.assistant`) é da #71, que referencia os dois `$defs`.

## Consequências

- O Piecework troca a ponte pelo JSON quando a #71 entrar: `lanes: {}` e, se quiser, ações próprias.
- Um ramo é uma conversa inteira no servidor (cópia ou referência do histórico, a critério do sistema); o C3 não
  impõe como guardar.
- Ação com lógica no cliente (função no `when`) fica de fora de propósito: o que não cabe no filtro vai para o sistema
  pela rota da ação.
- Os backends do C3 (Rust, Node) não implementam o chat; quem tem agente implementa as rotas. Sem elas (404), a shell
  esconde o painel e as ações.

## Alternativas consideradas

- **Sub-conversa como entidade filha** (`conversa_lateral` com CRUD do motor), como sugeria a issue: reaproveitaria as
  rotas de entidade, mas misturaria conversa com cadastro (lista, filtro, permissão por filial) e obrigaria cada
  sistema a declarar a mesma entidade. Ficou a conversa com pai.
- **`when` como função** (`(m) => m.direction === 'in'`): mais livre, mas não cabe no `app.json` e quebra o ADR 0003.
- **Ramo copiado no cliente** (mandar o histórico no POST): o servidor já tem o histórico; mandar de novo pesa e abre
  espaço para histórico adulterado. O cliente manda só `fromMessageId`.
