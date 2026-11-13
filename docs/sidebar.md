# Lista lateral por servidor (#118)

`layout.sidebar` declara uma lista lateral opcional. O menu antigo permanece sem a declaração.
O rail e os cartões não são dados de uma entidade: a porta fornece os itens da conta atual.
Não exige TS de tela no app. A ADR 0125 do PieceWork é uma proposta de agrupamento pelo menu;
não tinha formato de zonas. Esta extensão é a declaração nova dessa zona.

```json
{
  "source": "equipe",
  "label": { "id": "sidebar.team" },
  "title": "Agentes",
  "sections": [{ "id": "team", "label": "Time" }],
  "cards": [{ "id": "storage", "label": "Armazenamento", "action": { "id": "open", "label": "Abrir" } }]
}
```

Passe `sidebars={{ equipe: port }}` ao `C3Shell`. `SidebarPort.getSnapshot()` retorna
`{ serverId, items, sections?, cards?, loading?, error?, active?, views?, view? }`.
O snapshot mantém identidade até uma mudança; `subscribe` avisa e retorna a limpeza.
Itens têm `id`, `label: Text`, `section`, `path?`, `icon?`, `status?: Text`, `pending?`
e `actions?: { id, label: Text }[]`. IDs são estáveis e únicos por fonte/servidor.
`select`, `setView`, `action`, `cardAction` e `retry` são callbacks do app; a navegação
de `path` é do motor. Duplicação/renomeação de registros só aparecem quando declaradas
em `actions`, e continuam sendo operações da porta. Só preferências visuais são locais.

Seções da porta complementam as da spec. A pessoa pode criar/renomear/reordenar/excluir
suas seções locais sem excluir registros. Ao excluir uma seção, seus itens reaparecem
na primeira seção disponível. Itens sem seção válida também têm esse destino.
Ordem, fixados, ocultos, nomes, seções e recolhimento ficam em `localStorage`, com chave
isolada por fonte e servidor. Armazenamento indisponível mantém as escolhas na sessão.
`hidden: true` retira a lista e devolve sua largura; o botão de menu também a recolhe.

Cabeçalhos mostram contagem total, `aria-expanded` e pendências inclusive recolhidos.
Menus pelo botão, menu de contexto ou Shift+F10; mover para cima/baixo e para seção
oferece alternativa ao arraste, com anúncio de resultado. Arraste admite destino na
linha ou na seção e rola junto às bordas. O componente `SectionSidebar` de `@c3theme/ui`
também pode ser usado sozinho, com rótulos já resolvidos.

Cartões só aparecem quando a porta envia um estado para seu ID. No máximo um alerta:
crítico antes de atenção; os cartões ok podem coexistir. Dispensa é por servidor.
`overflowAlert` informa quando existe alerta que não cabe no rodapé, para o app marcar
Configurações. O conteúdo rola separado do cabeçalho e do rodapé.

Vitrine: **Telas / Lista lateral por servidor**: completa, carregando, vazia, erro,
alerta e oculta. O teste e2e cria seção, move e recolhe uma linha e confirma persistência.
