# Mensagens fixadas (#120)

O chat e o assistente do cabeçalho aceitam `pinned: true` ou `pinned: { label: Text }`. Sem declaração não há pedido
extra nem botão. O motor usa o cliente autenticado; `404` esconde o recurso, `401` pede nova sessão e outras falhas
ficam no menu com Tentar de novo. O backend mantém as marcas entre sessões.

```json
{
  "pinned": { "label": "Mensagens fixadas" },
  "messageActions": [
    { "id": "fixar", "label": "Fixar", "when": { "meta": { "fixada": false } } },
    { "id": "desafixar", "label": "Desafixar", "when": { "meta": { "fixada": true } } }
  ]
}
```

`when.meta` compara cada chave com igualdade estrita, sem coerção: texto, número, booleano ou null. Chave ausente
equivale a false. Os filtros de direção e autor continuam valendo. Mensagens em streaming ou ainda não enviadas
continuam sem ações. A marca textual Fixada aparece tanto na mensagem da pessoa quanto na resposta do agente
quando `meta.fixada === true`.

`GET /_chat/{conversation}/_pinned` responde `200 { "data": Pinned[] }`, na ordem da conversa. Cada item tem
`messageId`, `author` (o Author normal do chat), `direction` (in/out), `text` (trecho), `createdAt` e `pinnedAt`
(datas ISO). Lista vazia mostra “Nenhuma mensagem fixada nesta conversa.” O menu é acessível por teclado.

Depois de uma ação sem `opens`, o motor relê a mensagem pela paginação já existente de mensagens e atualiza o meta
sem remontar a conversa ou perder o rascunho. Depois relê a lista de fixadas. Não há GET de mensagem única novo.
Se a mensagem foi removida, a releitura termina sem substituição. Erro fica visível e a ação não é otimista.

Escolher uma fixada carrega páginas anteriores até achar o id e usa o `jumpTo` do MessageList. Para ao acabar o
histórico, em erro ou quando o backend repete o cursor, com aviso. A conversa é desmontada ao trocar a rota,
descartando a busca anterior. O painel e as APIs não escrevem a marca automaticamente: o POST da ação é do sistema.

Vitrine: Telas/Mensagens fixadas (histórico paginado, vazio e backend sem recurso).
