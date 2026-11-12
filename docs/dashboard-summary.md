# Painel alimentado por resumo

`pages[].dashboard.source: { "path": "/uso" }` alimenta widgets `summary-*`
por um GET autenticado, relativo à URL da API. A resposta é um documento JSON
direto, sem o envelope `{data: ...}` das entidades. Um widget pode declarar
`source` próprio. Widgets de entidade continuam lendo suas listas e agregações;
não usam essa fonte. A autorização do endpoint e de cada POST pertence ao servidor.

Os campos são caminhos com pontos, relativos ao documento (ou ao item selecionado).
Só propriedades próprias são lidas. Não há execução de expressões ou HTML.
Textos declarados (`title`, `label`, avisos) aceitam `Text`, inclusive `{id: ...}`;
os valores do documento já são texto/dados do servidor.

```json
{
  "source": { "path": "/uso" },
  "widgets": [
    {
      "type": "summary-kpi", "title": "Uso por provedor",
      "items": "providers", "label": "name", "value": "input",
      "progress": { "label": "Limite", "limit": "limit" },
      "fields": [
        { "label": "Saída", "field": "output", "format": "number" },
        { "label": "Início", "field": "start", "format": "date" },
        { "label": "Fim", "field": "end", "format": "date" },
        { "label": "Custo estimado", "field": "cost", "format": "currency", "currencyField": "currency" }
      ]
    },
    { "type": "summary-ranking", "title": "Consumo por agente", "items": "agents", "label": "name", "value": "tokens", "share": "percent" },
    {
      "type": "summary-object", "title": "Atualização", "state": "update.state",
      "fields": [{ "label": "Versão", "field": "update.version" }],
      "states": { "available": { "label": "Disponível" }, "error": { "label": "Falhou" } },
      "warnings": [{ "field": "update.channel", "equals": "beta", "message": "Versão de testes" }],
      "message": "update.message",
      "progress": { "label": "Download", "value": "update.progress", "limit": "update.total" },
      "actions": [{ "label": "Baixar", "path": "/update/download", "disabled": "update.downloadDisabled", "instruction": "update.instruction" }]
    }
  ]
}
```

O KPI sem `items` lê um único valor do documento; com `items`, mostra um indicador
por item. O progresso é `value / limit`, limitado a 0–100%; limite ausente, inválido
ou zero mostra 0%. O ranking ordena por valor e calcula participação pela soma
antes do limite, ou usa o percentual declarado em `share`. Número zero é dado.
`fields.format` aceita `text`, `number`, `date`, `datetime`, `currency`. Moeda usa o
código ISO 4217 do `currencyField`; dados ausentes ou inválidos mostram `—`.

O objeto mostra o rótulo do estado atual, aviso opcional, campos, mensagem,
progresso e ações. `warnings` permite avisos condicionais, por exemplo no canal beta.
Cada ação faz POST sem corpo em `path`, bloqueia cliques enquanto aguarda e relê
o resumo ao terminar. `disabled` aponta para um booleano do documento; quando
verdadeiro, `instruction` aponta para a explicação exibida junto ao botão.
Falhas são mostradas no cartão, preservando os últimos dados quando disponíveis.
O motor não implementa o atualizador: verificar, baixar e instalar são endpoints
do aplicativo, que decidem se a ação é permitida e devolvem o novo estado.

GETs iguais compartilham cache por caminho e filial; voltar à aba revalida pelo
SWR. `source.refreshInterval` permite consultar progresso periodicamente (ms,
0 desliga, máximo 3600000); o padrão é sem polling. Por exemplo, 2000 atualiza
o progresso de download a cada dois segundos enquanto a página está visível.
Clientes próprios que implementam `C3Client` devem fornecer `summary(path, method)`;
`createClient` já fornece essa porta com os cabeçalhos e transporte usuais, inclusive IPC.

Os cenários do Storybook em `Telas/Painel por resumo` cobrem os três blocos e os
estados verificando, disponível, baixando, pronto, erro e canal beta, com dados de exemplo.
