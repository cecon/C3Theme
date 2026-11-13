# Mudanças do motor

## Não publicado — configurações em modal (#119)

- `app.settings` no app.json declara o modal de configurações: abas pessoais, seções do servidor, busca, subpáginas,
  política de fechamento e condicionais por plataforma e permissão. O motor desenha e recebe valores e gravação pela
  porta `settings` do `<C3Shell>` (`load`, `change` e `action`); sem a porta, valem os valores da spec.
- A moldura nova do `@c3theme/ui` (`SettingsDialog`) traz fundo inerte, foco preso, Escape (que limpa a busca antes de
  fechar), retorno do foco a quem abriu, clique no fundo conforme a política e confirmação de fechamento com alterações
  pendentes. `SettingsPage` monta a trilha e o Voltar das subpáginas; `SettingsSearchBox` e `rankSettings` fazem a busca
  por linha com título exato na frente, contagem anunciada e vazio.
- O cabeçalho passa a abrir o modal da spec no lugar do painel de aparência quando o app declara `settings`; a porta
  `settingsSection` do `<C3Shell>` abre direto numa seção. Sem `app.settings`, o painel de aparência continua igual.
- A shell pede o `pages` de `GET /_meta/app` também quando uma seção de configuração declara `permission`.
# @c3theme/engine

Cada entrada diz o que muda para quem usa; **Quebra** marca o que exige mudar o app.

## 0.1.0 (2026-11-12)

- Dados das portas de rails atualizam pelo contexto sem recriar o roteador; notas da ajuda podem chegar depois de
  abrir. Fixação usa URLs estáveis e a primeira página sempre fica no rail. `hidden` e `items` controlam a zona;
  controles do Mac reservam o topo. Guia: [Rail de páginas](../../docs/page-rail.md).

- Zonas da casca (cecon/C3Theme#116 e #117): `layout.rails` declara o rail de servidores e o rail de páginas no app.json, e `spec/v0/app.schema.json` documenta a declaração.
- `<C3Shell>` ganhou a porta `rails` com os dados e as ações dos dois railes; `<C3Layout>` desenha as zonas nas bordas e mantém o restante da moldura igual. Sem `layout.rails`, a casca continua como antes (sem espaço reservado).
- Páginas do rail de páginas saem do menu da spec, com a primeira página fixa; páginas sem permissão continuam fora.

## Não lançado

- Integração dos rails (#116/#117), lista lateral (#118) e dock (#122): reserva geométrica combinada, gavetas
  limitadas à área útil e atualização das portas sem remontar a conversa. Regressão em 390 e 1280 pixels,
  com conta, mensagens fixadas e rascunho preservados.

- Dock de agentes opcional pela spec (`layout.agentDock`) e porta `agentDocks` da casca: três posições com espaço
  reservado, estados reativos, navegação por teclado e anúncio de mudanças. Guia: [agent-dock](../../docs/agent-dock.md).
- Mensagens fixadas (#120): `chat.pinned` declara a lista e navegação até mensagens antigas; `messageActions.when.meta`
  escolhe as ações pelo meta. A shell relê a mensagem e a lista depois das ações, sem perder o rascunho.
  Contrato e exemplo em [docs/chat-pinned.md](../../docs/chat-pinned.md).

- #118: `layout.sidebar` e porta `sidebars` montam lista lateral por servidor,
  com seções, fixados, preferências locais, menus acessíveis e cartões de estado.
  Sem a declaração, a navegação anterior permanece. Guia em `docs/sidebar.md`.
Instale fixando o commit (`github:cecon/C3Theme#<sha>&path:packages/engine`). Cada entrada diz o que muda para quem usa; **Quebra** marca o que exige mudar o app.

## Sem versão nova (2026-11-13)

- Entrada por código de e-mail, sem senha (#123): a porta de autenticação declara `entrada: 'codigo'` e implementa `enviarCodigo` e `entrarComCodigo`. Nesse modo a shell monta só o e-mail + "Enviar código" e a conferência do código — nenhuma rota de senha (cadastro, esqueci a senha, redefinir) existe. Sem `entrada`, o modo continua sendo senha. `login` virou opcional na porta (quem entra por código não precisa dele) e a sessão ganhou `requestCode` e `loginWithCode`. Estados em PT-BR: enviando, código inválido, expirado, muitas tentativas, reenvio com espera e sem rede; os erros conhecidos da porta são `codigo-invalido`, `codigo-expirado`, `muitas-tentativas` e `sem-rede`. O foco começa no e-mail, o Enter envia e a conferência abre com o foco na primeira casa do código. **Quebra** só para quem implementa `AuthPort` sem `login` (o campo virou opcional, nada a fazer) e para quem lê a interface `AuthSession` (ganhou dois métodos).
- Histórias: "Motor/Entrada por código" no Storybook; testes de render e de teclado/foco em `packages/engine/src/auth`.
- Revisão #123: e-mail obrigatório mesmo com configuração antiga de usuário, perfil sem senha no modo código,
  proteção contra envio/verificação concorrentes, espera após limite de tentativas, erros de transporte 0/429
  e teste e2e de foco/Enter, erro de código e retorno autenticado.
- defaultMode escuro coberto por e2e de estilo computado (#132): a história Motor/Modo escuro monta o próprio C3ThemeProvider (a moldura do Storybook fica de fora) e o teste confere fundo do body e do Paper escuros, além do data-c3-mode; a escolha salva continua vencendo. Nenhuma mudança de API.
