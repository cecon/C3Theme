# Dock de agentes na casca

`layout.agentDock` é opcional. Sem a chave, a casca continua igual. A faixa fica em todas as rotas que usam a casca;
rotas `blank` (impressão, quiosque) não recebem zonas da casca.

```json
{
  "source": "agents",
  "position": "bottom",
  "size": 88,
  "label": { "id": "app.agents", "defaultMessage": "Agentes ativos" },
  "states": {
    "empty": { "message": "Nenhum agente ativo", "action": { "label": "Criar agente", "path": "/agentes/new" } },
    "loading": "Carregando agentes…",
    "error": "Não foi possível carregar os agentes.",
    "retry": "Tentar de novo",
    "offline": "Sem conexão · último estado conhecido"
  }
}
```

Declare o objeto acima em `layout.agentDock`. Posições: `top`, `bottom`, `right`; `size` é a altura (top/bottom) ou largura
(right), em pixels inteiros entre 48 e 480. Em janelas pequenas, o motor limita a reserva à metade da dimensão da janela.
O dock rola por dentro e o restante da página conserva área útil. `FillHeight`, o cabeçalho fixo e as gavetas da conversa
respeitam essa reserva; não há sobreposição do dock na conversa. Os textos declarados aceitam `Text`/i18n.

Passe `agentDocks={{ agents: port }}` ao `C3Shell` (ou ao `EngineProvider`). A chave `source` seleciona essa porta de dados,
não um componente React. Fonte ausente mostra erro. O motor não inventa endpoint nem consulta o domínio dos agentes.

```ts
let snapshot = {
  items: [{ id: 'design', label: 'Design', mark: 'D', status: 'waiting-approval', approvals: 2, path: '/chat/design' }]
};
const port: AgentDockPort = {
  getSnapshot: () => snapshot,
  subscribe: (listener) => app.onAgentsChanged(listener),
  retry: () => app.reloadAgents()
};
```

Exemplo de dados. A aplicação precisa trocar o snapshot por um objeto imutável antes de avisar os assinantes. Até uma
mudança, `getSnapshot` deve devolver a mesma referência (contrato `useSyncExternalStore`). O retorno de `subscribe` cancela
a inscrição. Eventos IPC/WebSocket podem alimentar a porta; não exigem recarregar a página. A ordem é a de `items`.

Cada item tem `id` único, `label`, `path` interno, `status` e, opcionalmente, `mark` textual e `approvals` (contagem positiva).
Estados: `idle`, `running`, `waiting-approval`, `failed`, `done`. O app adapta seus nomes de domínio a esses valores.
O estado é texto visível, além da marca visual; aprovação ganha destaque e contagem. Botões nativos aceitam Enter/Espaço,
têm foco visível e a região viva anuncia mudanças. Tema claro/escuro segue a paleta do app.

O snapshot pode informar `loading`, `error`, `offline`. Offline conserva os últimos itens conhecidos mesmo se o snapshot
da desconexão vier vazio; uma resposta online vazia limpa o cache. A identidade da porta separa os caches (não mistura
equipes/servidores). `connectivity` da casca também ativa offline. A tentativa manual chama `retry`, e rejeições são tratadas.
Somente dados e ações de domínio pertencem ao app; nenhum estado é persistido pelo dock. Falta de permissão deve filtrar
os itens na porta, antes de enviá-los à interface.
