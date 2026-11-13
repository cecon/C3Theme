# @c3theme/engine

Instale fixando o commit (`github:cecon/C3Theme#<sha>&path:packages/engine`). Cada entrada diz o que muda para quem usa; **Quebra** marca o que exige mudar o app.

## Sem versão nova (2026-11-13)

- Entrada por código de e-mail, sem senha (#123): a porta de autenticação declara `entrada: 'codigo'` e implementa `enviarCodigo` e `entrarComCodigo`. Nesse modo a shell monta só o e-mail + "Enviar código" e a conferência do código — nenhuma rota de senha (cadastro, esqueci a senha, redefinir) existe. Sem `entrada`, o modo continua sendo senha. `login` virou opcional na porta (quem entra por código não precisa dele) e a sessão ganhou `requestCode` e `loginWithCode`. Estados em PT-BR: enviando, código inválido, expirado, muitas tentativas, reenvio com espera e sem rede; os erros conhecidos da porta são `codigo-invalido`, `codigo-expirado`, `muitas-tentativas` e `sem-rede`. O foco começa no e-mail, o Enter envia e a conferência abre com o foco na primeira casa do código. **Quebra** só para quem implementa `AuthPort` sem `login` (o campo virou opcional, nada a fazer) e para quem lê a interface `AuthSession` (ganhou dois métodos).
- Histórias: "Motor/Entrada por código" no Storybook; testes de render e de teclado/foco em `packages/engine/src/auth`.
- Revisão #123: e-mail obrigatório mesmo com configuração antiga de usuário, perfil sem senha no modo código,
  proteção contra envio/verificação concorrentes, espera após limite de tentativas, erros de transporte 0/429
  e teste e2e de foco/Enter, erro de código e retorno autenticado.
