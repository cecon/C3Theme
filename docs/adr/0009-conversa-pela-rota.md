# 0009. Conversa da página de chat vinda da rota

## Status

Aceita em 12/11/2026 (issue #100, lacuna aberta pelo PieceWork, cecon/piecework#274).

## Contexto

O [ADR 0006](0006-chat-no-app-json.md) declarou a página de chat no app.json, mas `chat.conversation` é um id fixo:
a página `/conversa` sempre abre a mesma conversa. O PieceWork tem várias conversas por agente e precisa abrir a que a
pessoa escolheu em outra tela (lista de conversas, fila do agente, notificação). Sem isso, ou cada conversa vira uma
página na spec (impossível: as conversas são dado, não spec), ou o sistema escreve uma página em TS só para ler o id
da URL, o que o [ADR 0003](0003-motor-sem-excecoes.md) proíbe. O contorno de hoje é o id `atual`, que o backend
resolve para a conversa ativa mais recente: não deixa abrir uma conversa antiga.

## Decisão

1. **`chat.conversation` aceita `{nome}`** em `pages[].chat`: a conversa é o `:nome` da rota da página (ex.:
   `"path": "/conversa/:conversation"` com `"conversation": "{conversation}"`). Sem `conversation` e com
   `:conversation` na rota, vale o parâmetro também. Sem parâmetro na rota, vale o id da spec ou o padrão
   `assistant`, como antes.
2. **O id da rota segue a regra de sempre** (`^[A-Za-z0-9_-]{1,64}$`, a mesma das rotas `/_chat/{conversation}` nos
   dois backends). Fora dela, a página avisa "Conversa não encontrada" e não chama o backend. Quem garante que a
   pessoa pode ver a conversa continua sendo o backend (porta `Chat`), que já separa por usuário.
3. **Trocar de conversa pela navegação remonta o painel inteiro** (o `ChatPanel` ganha o id como `key`): histórico,
   fila, rascunho e o aviso de "sem assistente" não passam de uma conversa para outra.
4. **O `pnpm spec:check` recusa `{nome}` sem `:nome` na rota** e em `layout.header.assistant`, que não tem rota. A
   regra fica em `packages/engine/src/chat/chatRoute.mjs`, em JS puro, para a shell e o script usarem a mesma.

Fora deste ADR: a lista de conversas (criar, renomear, apagar) como página do motor. Ela é uma lista de entidade
comum do sistema, com um link de coluna (`columns[].href`) para `/conversa/{id}`.

## Consequências

- **Melhora**: várias conversas por agente sem TS por tela; qualquer tela chega numa conversa só navegando.
- **Piora**: o mesmo campo passa a ter dois sentidos (id fixo ou marcador), o que pede ler o schema; o padrão do
  marcador (`{nome}` só com letras minúsculas e números) é o mesmo da rota (`^/[a-z0-9\-/:]*$`).
- **Custo**: nenhum nos backends; só a shell, o schema e o `spec:check`.

## Alternativas consideradas

- **Campo novo (`conversationParam: "conversation"`)**: mais explícito, mas aceitaria `conversation` e
  `conversationParam` juntos, uma combinação a mais para validar. O marcador `{nome}` já é o jeito da spec citar um
  valor (como em `columns[].href`).
- **Query string (`/conversa?c=...`)**: funciona sem mudar a rota, mas a conversa vira filtro da tela em vez de
  endereço, e o histórico do navegador e os links ficam menos legíveis.
- **Manter o `atual` no backend**: resolve só a conversa mais recente; não abre uma escolhida.
