# Estados declarados da página

Decisão em [ADR 0010](adr/0010-estados-da-pagina.md).

`pages[].states` é opcional. Sem a propriedade, widgets, rotas e páginas registradas mantêm a apresentação anterior. Quando presente, declara os cinco blocos: `loading`, `empty`, `error`, `forbidden` e `offline`. Todos usam `message: Text`; `empty` exige ação, `error` exige ação de retry, `forbidden` exige `instruction: Text` e `offline` exige uma lista não vazia `works: Text[]`.

```json
{
  "path": "/pedidos",
  "component": "Pedidos",
  "states": {
    "loading": { "message": { "id": "pedidos.carregando" } },
    "empty": { "message": "Ainda não há pedidos", "action": { "label": "Cadastrar", "path": "/pedido/new" } },
    "error": { "message": "Não foi possível consultar", "action": { "label": "Tentar de novo", "retry": true } },
    "forbidden": { "message": "Sem acesso", "instruction": "Peça acesso à administração" },
    "offline": { "message": "Sem conexão", "works": ["Consultar os pedidos já carregados"] }
  }
}
```

Uma ação tem exatamente um destino: `path`, `retry: true` ou `record: { entity, id, action }`. O alvo de registro é explícito; não há inferência de IDs. O motor lê o registro e usa `RecordActions`, incluindo capacidade, condições, confirmação, input, controle de versão e resposta existentes. Falha ao ler o alvo oferece retry; não se executa sem registro. O backend continua autorizando a operação.

Painéis agregam as consultas reais dos widgets, pelo middleware SWR local. Só há vazio de página quando todos os recursos de dados concluíram vazios. Um KPI zero é um dado válido. Recursos auxiliares de metadados e filtros não contam. O middleware preserva o cache/provedor SWR original. Se uma atualização falhar, o banner declarado aparece e os dados em cache continuam montados; sem cache, o estado substitui visualmente o corpo, sem desmontar seus efeitos de carga.

Uma página registrada informa o resultado da própria carga com `usePageState({ loading, empty, error, hasData, retry })`. O motor não consegue inferir o significado de vazio na árvore React de qualquer componente. `retry` pode ser uma função inline. Suspense e erros de renderização também usam as declarações; ao mudar de rota/registro, o estado e o boundary são reiniciados. Alternar a conexão na mesma rota não reinicia o rascunho.

A shell observa `navigator.onLine` e eventos `online`/`offline`. Para IPC/Electron, passe `connectivity={{ getOnline, subscribe }}` ao `C3Shell`; a porta do sistema tem precedência sobre o navegador. `subscribe` devolve a remoção da assinatura. O aviso offline preserva o conteúdo carregado e mostra `works`; é o sinal de conectividade informado, não uma prova de que todos os serviços estão disponíveis.

O contrato do consumidor PieceWork (`estados.ts`) usa `carregando/vazio/erro/sem-permissao/offline`. O sistema traduz esses papéis para `loading/empty/error/forbidden/offline`, os textos para `message/instruction/works` e os IDs de ação para destinos explícitos. O C3 não inventa o destino de uma ação de IPC a partir de seu nome.

As cinco histórias em `Telas/Estados declarados da página` montam a shell a partir do mesmo `app.json`. A consulta da página retorna vazio, erro ou dados; no estado offline, o campo de rascunho e o botão de conexão permitem conferir a preservação do conteúdo.
