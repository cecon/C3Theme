# 0007. Telas de status, 503 de proxy e erros vêm da shell

## Status

Aceita em 12/11/2026 por Eduardo (complemento do PR #90, que fechou a issue #81). Mantém a decisão do #90 de que o
`status` do app.json **não bloqueia a API**.

## Contexto

O PR #90 pôs `status` no app.json (`maintenance` ou `comingSoon`, com `title`, `message` e `until`) e o 500 da shell
num `errorElement` e num error boundary. Ficaram de fora coisas que o `apps/seed` fazia em TS e o [ADR
0003](0003-motor-sem-excecoes.md) manda o motor fazer:

- A tela de status não tinha "Tentar de novo" nem voltava sozinha: o usuário recarregava a página para saber se o sistema
  voltou.
- "Em breve" mostrava a data, mas sem contagem regressiva.
- Tirar o sistema do ar exigia mudar o app.json. Deploy, migração ou balanceador não têm como fazer isso.
- Uma tela que quebrava derrubava o layout inteiro (500 em tela cheia, sem menu). Rota inexistente mostrava um texto
  solto, e a falha ao abrir o sistema era um `Alert`.
- Não havia como deixar no menu uma tela que ainda não está pronta.

## Decisão

- **`status` continua só tela.** O motor (Rust e Node) não responde 503 por causa dele. Quem precisa fechar a API usa a
  própria autorização ou o proxy.
- **503 em `/_meta/*` é o protocolo do proxy**: qualquer coisa na frente do backend que responda `503` em
  `/_meta/login` ou `/_meta/app` mostra a mesma tela, com o `status` do corpo (`{ "status": { ... } }`) se vier JSON
  válido, ou "Em manutenção" com a previsão do `Retry-After` (segundos ou data HTTP). O `503` com `error.code`
  `unavailable` é de uma consulta externa e não conta. As regras puras ficam em `engine/src/status/status.ts`.
- **A tela pergunta de novo**: "Tentar de novo" na manutenção, nova consulta sozinha quando `until` chega e, em "Em breve",
  quando a contagem zera. `until` segue sendo previsão: se o backend ainda mandar `status`, a tela continua.
- **`pages[].comingSoon`** (`message`, `until`): a tela fica no menu e mostra "Em breve" na área de conteúdo, com a
  contagem. É mais um tipo de página, como `dashboard` e `wizard`, e não leva `config`.
- **Erros não se declaram**: `errorElement` em dois níveis. Uma tela que quebra mostra o 500 dentro do layout, com o menu
  e "Voltar ao início"; se a moldura quebrar, o 500 ocupa a tela toda. Rota inexistente mostra o 404. Falha ao abrir o
  sistema mostra "Não foi possível abrir o sistema", com o código grande só em 5xx. O erro vai para o console, nunca
  para a tela. Texto por `react-intl` com ids `c3.status.*`.
- A contagem é peça do vocabulário: `Countdown` no `@c3theme/ui`, com a conta pura em `countdown/parts.ts`.

## Consequências

- **Melhora**: tirar do ar é uma linha no app.json ou um 503 no proxy, sem TS no sistema; o usuário não precisa recarregar
  para ver o sistema voltar; uma tela quebrada não derruba a navegação.
- **Piora**: com `status` no app.json a API continua aberta (decisão do #90): um cliente que não seja a shell grava
  normalmente. Quem quer a API fechada precisa do proxy.
- **Custo**: só front e documentação; os backends não mudam. A consulta automática é uma por previsão (não é polling).

## Alternativas consideradas

- **Backend do motor responder 503 `out_of_service` com `status`** (primeira versão do PR #92): fecha a API junto com a
  tela, mas muda a decisão do #90 e impede o administrador de entrar. Eduardo escolheu manter a API aberta.
- **Consultar o backend a cada N segundos** enquanto fora do ar: carga sem ganho quando há previsão; o "Tentar de novo"
  cobre o caso sem previsão.
- **Página registrada com o `ComingSoonPage` do seed**: seria TS de novo, o que o ADR 0003 proíbe.
