# 0010. Estados da página declarados na spec

## Status

Aceita em 12/11/2026 por Eduardo, no merge do PR #104 (issue #99, lacuna do PieceWork cecon/piecework#292). Este ADR
registra depois do merge a decisão que o PR tomou; o guia de uso continua em [`docs/page-states.md`](../page-states.md).

## Contexto

O PieceWork exige que toda tela que busca dado declare cinco estados com texto e ação próprios: carregando, vazio, erro,
sem permissão e offline. Antes do #104, a página da spec não tinha onde declarar isso: sem permissão era um aviso fixo,
nenhum pacote sabia da conexão, e carregando, vazio e erro vinham prontos de cada widget, sem a ação do próximo passo.
Pelo [ADR 0003](0003-motor-sem-excecoes.md), isso não podia virar TS do sistema.

## Decisão

- **`pages[].states` (`$defs/pageStates`) é opcional, mas, quando existe, traz os cinco blocos.** Todos têm `message`
  (`Text`); `empty` exige ação, `error` exige a ação `retry: true`, `forbidden` exige `instruction` (como conseguir a
  permissão) e `offline` exige `works`, a lista não vazia do que continua funcionando. Declarar só uma parte não é
  aceito: quem liga os estados pensa em todos.
- **Ação com um destino só** (`$defs/pageStateAction`): `path`, `retry: true` ou `record: { entity, id, action }`. A ação
  de registro não infere o id: o motor lê o registro e usa o `RecordActions` de sempre (capacidade, condição,
  confirmação, input, versão). O `spec:check` recusa entidade fora de `app.entities` e ação que não é de registro.
- **O vazio do painel é a soma dos dados reais**, não uma consulta a mais. Um middleware do SWR, ativo só dentro do
  `PageStatesFrame`, observa as chaves `c3-list` e `c3-record` dos widgets: a página está vazia quando todos concluíram
  vazios. KPI zero é dado. Metadados e filtros não contam.
- **Com dado em cache, falha vira faixa e o corpo fica.** Erro e offline aparecem acima do conteúdo já carregado; sem
  cache, o estado ocupa o lugar do corpo, que continua montado (escondido) para não perder os efeitos de carga. Erro
  de renderização e Suspense também caem nos estados declarados, e a troca de rota reinicia o estado.
- **A página registrada informa a própria carga** com `usePageState({ loading, empty, error, hasData, retry })`: o motor
  não adivinha o que é "vazio" dentro de um componente qualquer.
- **Conexão é uma porta**: `connectivity={{ getOnline, subscribe }}` no `<C3Shell>`; sem ela, `navigator.onLine` e os
  eventos `online`/`offline`. No Electron, onde o pedido vai por IPC, o app passa o sinal do processo main.
- Página sem `states` continua como antes, e sem permissão sem `states` mantém o aviso fixo.

## Consequências

- **Melhora**: o PieceWork declara os cinco estados no app.json, sem TS; quem não tem acesso sabe como pedir; sem
  conexão, o usuário continua vendo o que carregou e sabe o que ainda funciona.
- **Piora**: exigir os cinco blocos deixa o JSON maior para quem só queria o vazio. O middleware acompanha cada recurso
  de dado da página, o que é mais estado no front do que uma contagem única.
- **Limite**: offline é o sinal informado pela porta, não prova de que todos os serviços estão de pé. Uma página
  registrada que não chama `usePageState` não tem vazio nem erro de página.
- **Custo**: só front, spec e documentação; os backends não mudam.

## Alternativas consideradas

- **Contar os registros de uma entidade declarada (`statesEntity`) antes de desenhar a página** (PR #105, fechado como
  duplicado): mais simples, mas um painel com filtro que zera os widgets não ficaria vazio, e o pedido a mais
  atrasaria a abertura.
- **Repetir o texto da página em cada widget**: seis widgets vazios mostrariam seis vezes o mesmo recado e botão.
- **Estados parciais (cada bloco opcional)**: deixa a escolha ao sistema, mas o PieceWork pede os cinco e o padrão da
  shell para os que faltassem esconderia a lacuna.
