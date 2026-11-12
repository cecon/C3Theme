# 0006. Chat e assistente declarados no app.json

## Status

Aceita em 12/11/2026 (issue #71, lacuna aberta pelo [ADR 0003](0003-motor-sem-excecoes.md)).

## Contexto

O ADR 0003 tirou o chat da lista de exceções, mas o assistente só existia montado em TS: o engine-demo tinha um botão
próprio (`AssistantButton.tsx`) que criava o transporte, o `useMessageWindow` e o `AssistantPanel`, e um roteiro em
memória no navegador. Cada sistema com agente repetia essa ponte. Não havia rota de chat no contrato, então o backend
também não tinha onde conferir as partes de interface antes de mandar.

## Decisão

1. **Declaração no app.json.** `$defs/chat` (conversa, título, placeholder, sugestões, catálogo de partes, fila) vale
   em dois lugares: `pages[].chat` (página de chat, mais um tipo ao lado de `dashboard`, `wizard`, `apiDocs` e
   `component`) e `layout.header.assistant` (`true` ou o objeto: botão no header que abre o painel numa gaveta). A
   shell monta o `AssistantPanel` com os renderizadores do motor (`agentUiRenderers`) e os de humano no circuito, sem
   TS do sistema.
2. **Contrato HTTP** em `spec/v0/chat.yaml`, sob `/_chat/{conversation}`: histórico, enviar, eventos (SSE com o
   `ChatEvent` do `@c3theme/chat`), parar, responder pergunta e responder parte. O motor separa as conversas por
   usuário (a mesma conversa é uma por pessoa).
3. **O agente é do sistema, como a autenticação.** Os dois backends têm uma porta `Chat` (Rust: trait `Chat` no
   `c3-engine`; Node: `Chat` no `engine-node`) que o sistema implementa: guardar o histórico, chamar o modelo, decidir
   a resposta. Sem a porta, as rotas respondem 404 e a shell avisa que o sistema não tem assistente.
4. **O motor confere antes de mandar.** O sistema responde pelo `ChatRoom` que a porta recebe (`emit`, `message`); no
   Rust, cada parte de `Message.ui` passa por `Engine::check_agent_part` e a mensagem com parte recusada não sai (o
   sistema recebe o erro). O Node ainda não confere partes (lacuna antiga do engine-node) e só transporta.
5. **O transporte HTTP fica no `@c3theme/engine`** (`httpChatTransport`), como adaptador da porta `ChatTransport` do
   `@c3theme/chat`. O `C3Client` ganha `chat?: ChatTransport`; o cliente em memória aceita um transporte no seed
   (vitrine, Storybook). Por isso **o `@c3theme/engine` passa a depender do `@c3theme/chat`** (peer), o que revoga o
   "motor não depende do pacote de chat" da época do #68. O chat continua sem depender do motor.

Fora deste ADR: ações por mensagem e sub-conversa lateral (issue #10, que soma `messageActions` e `lanes` ao
`$defs/chat`), anexos no envio e lista de conversas (troca e histórico de várias). Cada um entra com o seu uso real.

## Consequências

- **Melhora**: sistema com agente declara uma chave no app.json e implementa uma porta; a ponte em React some. As
  partes passam pelo motor antes de chegar à tela, no mesmo lugar para todos os sistemas.
- **Piora**: quem instala o `@c3theme/engine` precisa instalar também o `@c3theme/chat`, mesmo sem chat (o pacote só
  entra no bundle de quem abre a página ou o botão, por import tardio).
- **Custo**: rotas e porta nos dois backends; o histórico e o modelo continuam com o sistema.

## Alternativas consideradas

- **Componente registrado no header (`layout.header.actions`)**: era o caminho do engine-demo; rejeitada pelo ADR 0003
  (é TS do sistema juntando peças do chat).
- **O motor guardar o histórico**: rejeitada; o histórico é dado do sistema (tabela própria, LGPD, retenção), como os
  avisos do sino.
- **Pacote de ponte `@c3theme/engine-chat`**: evitaria a dependência nova, mas cada app teria de registrar a ponte, e
  isso é a mesma montagem em TS que o ADR 0003 tira.
