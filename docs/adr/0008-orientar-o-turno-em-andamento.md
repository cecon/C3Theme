# 0008. Orientar o turno em andamento do agente

## Status

Aceita em 12/11/2026 (issue #91, pedido do Piecework; depende do [ADR 0006](0006-chat-no-app-json.md)).

## Contexto

Enquanto o agente trabalha, a mensagem que a pessoa escreve vai para a fila do `@c3theme/chat` e só sai quando a
resposta termina (ou a pessoa para tudo). Com agentes que trabalham por minutos, isso é pouco: a pessoa quer corrigir o
rumo ("comece pelos maiores valores") sem perder o que já foi feito. O Piecework faz isso com uma fila no servidor e
duas rotas próprias (enviar com `orientar: true` e orientar a próxima). O chat do motor não tinha como declarar o atalho,
a ação na fila nem o aviso de quando o agente não aceita mensagem no meio do trabalho, e o ADR 0003 não deixa o sistema
montar isso em TS.

## Decisão

1. **Na spec, duas chaves em `$defs/chat`**: `steer` (liga orientar; padrão desligado) e `sendKey` (`enter`, padrão, ou
   `modEnter`: Ctrl+Enter, ⌘+Enter no Mac, envia e Enter quebra a linha). A shell liga tudo sem TS do sistema.
2. **O que cada tecla faz é uma regra pura** (`composerKey` no `@c3theme/chat/core`): Ctrl+Enter orienta nos dois modos,
   mas só com turno em andamento; sem turno, envia. Com texto, orienta com o texto; com a caixa vazia, orienta com a
   primeira da fila. Enter continua pondo na fila (no modo `enter`). O rótulo do atalho aparece junto da caixa enquanto
   há turno.
3. **A fila continua no cliente**; orientar é **enviar já, pela rota de sempre, com `steer: true`** (POST
   `/_chat/{c}/messages`). Não há rota de "orientar a próxima": a próxima é a primeira da fila do cliente.
4. **O estado da orientação é do servidor**, na própria mensagem: `steer: "pending"` (o agente ainda não leu; a shell
   mostra na fila como "Orientando", fora da conversa) e `steer: "taken"` (leu no próximo ponto seguro; vai para a
   conversa com a marca "Orientou"). A orientação que espera sai pelo **DELETE `/_chat/{c}/messages/{m}`** (porta
   `remove`, opcional; já lida, 409; sem a porta, 404), com o evento `removed` que já existia.
5. **Aviso passageiro é evento, não mensagem**: `notice` (`{ text, tone? }`) com texto pronto do sistema, mostrado acima
   da caixa e que sai sozinho. Agente que não recebe mensagem no meio do trabalho, ou orientação que chega sem turno,
   avisa assim e segue como mensagem comum. `ChatRoom::notice` (Rust) e `room.notice` (Node) emitem.

## Consequências

- **Melhora**: o sistema liga orientar com uma chave no app.json e implementa uma regra no agente (ler as `pending` no
  ponto seguro). Uma rota nova (DELETE), um campo no envio e um evento; nada muda para quem não usa.
- **Piora**: `Outgoing` do c3-engine ganhou `steer` (struct pública): quem monta à mão precisa do campo ou de
  `..Outgoing::default()`. `switch` exaustivo em `ChatEvent` precisa tratar `notice`.
- **Custo**: o agente do sistema decide o ponto seguro; os exemplos (Rust e Node) leem a cada pedaço da resposta e
  respondem as orientações no fim, e a conformidade confere isso nos dois.

## Alternativas consideradas

- **Fila no servidor, como no Piecework** (rotas `enviar` e `orientar-proxima`): sobrevive a recarregar e a outra
  aba, mas muda o modelo da fila de todo app e soma rotas e estado no backend. Fica para quando houver uso real de fila
  compartilhada; esta decisão não impede.
- **Função do sistema que decide a tecla** (`(tecla, modo, ocupado) => ação`): é TS do sistema, que o ADR 0003 tira; a
  regra fixa com `sendKey` cobre os dois modos do Piecework.
- **Aviso como mensagem de sistema** (`kind: 'system'`): ficaria no histórico para sempre, e o aviso só vale na hora.
