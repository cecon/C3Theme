# 0011. Estados declarados do chat

## Status

Aceita em 12/11/2026 (issue #101, pedido do Piecework; usa o `$defs/states`, o mesmo dos estados da página da issue #99, e
o chat do [ADR 0006](0006-chat-no-app-json.md)).

## Contexto

No Piecework, toda tela que busca dado declara cinco estados (carregando, vazio, erro, sem permissão e offline), cada
um com o texto e a ação que a pessoa vê. A página de chat do motor (`pages[].chat`) não recebia isso: 404 mostrava
sempre "Este sistema não tem assistente.", 403 caía no aviso genérico, falha de rede e 5xx ficavam no estado de erro do
`useMessageWindow` sem texto nem ação, e a conversa vazia só tinha as sugestões. O ADR 0003 não deixa o sistema montar
essas telas em TS.

## Decisão

1. **`$defs/chat.states`**, com o mesmo `$defs/states` das páginas (issue #99): `loading {text}`, `empty {text, action?}`,
   `error {text, retry?}`, `forbidden {text, howTo?, action?}` e `offline {text, keeps?}`. `action` é o `$defs/link` de
   sempre (path ou href). Sem `states`, o painel continua igual; estado não declarado fica como o painel já mostra.
2. **A classificação é uma regra pura e única** (`stateOfError`): `ApiError` 403 é `forbidden`, status 0 (rede) é
   `offline` e o resto é `error`. O navegador sem rede (`navigator.onLine`, eventos `online`/`offline`) também é
   `offline`. O 404 continua sendo "sistema sem assistente", que é outra coisa (backend sem a porta Chat).
3. **Onde cada estado aparece** (`chatStates`, puro): `forbidden` cobre o painel (com o título e o fechar da gaveta),
   porque não há o que mostrar nem para onde enviar. `error` e `offline` vão no lugar da conversa quando não há
   histórico e numa faixa acima da conversa quando há, para o que já foi carregado continuar visível. `loading` e
   `empty` ocupam o lugar da conversa vazia; no vazio, as sugestões continuam abaixo e enviam.
4. **"Tentar de novo" não descarta nada**: sem histórico, abre a conversa de novo (recarrega o histórico); com
   histórico, reenvia as mensagens que falharam ou busca de novo a página antiga que não veio. A conversa que abriu
   sem rede abre de novo sozinha quando o navegador avisa que a rede voltou. No offline e no erro, as sugestões somem
   (só aparecem no vazio).
5. **Falha ao buscar a página antiga não se repete sozinha**: com o erro na janela de mensagens, o `AssistantPanel` para
   de pedir a página anterior até alguém tentar de novo (antes, com `hasMore` e o servidor caído, pedia sem parar).
6. **O motor escuta as rotas** abrindo (`loadMessages`) e enviando (`send`): a última falha classificada decide o
   estado e o primeiro acerto o tira. Abrir abortado (painel fechado) não conta. Só liga com `states`.

## Consequências

- **Melhora**: o sistema declara os textos e as ações dos cinco estados no app.json, sem TS, com o mesmo formato das
  páginas. O contrato do `/_chat` passa a documentar o 403.
- **Piora**: sem `states`, quem rola para cima depois de uma falha da página antiga não vê o erro e só tenta de novo ao
  reabrir a conversa (antes o painel pedia de novo sem parar). Com `states`, a faixa de erro traz "Tentar de novo".
- **Piora**: com `states`, o painel embrulha o transporte para saber o resultado das chamadas; quem compara o
  transporte por identidade vê outro objeto (só dentro do motor).
- **Custo**: o backend precisa responder 403 em `/_chat` para quem não pode usar o assistente; sem isso, o estado
  `forbidden` nunca aparece.

## Alternativas consideradas

- **Estados próprios do chat** (`chat.texts.loading` etc.): mais curto, mas duplicaria o formato das páginas (issue #99) e
  o sistema aprenderia dois jeitos de dizer a mesma coisa.
- **Estados no `@c3theme/chat`** (o `AssistantPanel` recebendo os cinco): o pacote de chat não conhece `ApiError` nem as
  rotas; a classificação é do motor. O painel já aceita `empty`, que basta para o lugar da conversa.
- **Remontar a conversa no "Tentar de novo" com histórico**: simples, mas perde a mensagem que falhou e o que está na
  fila.
