# Decisões de arquitetura (ADR)

Cada decisão que muda o jeito de trabalhar no C3 fica num arquivo próprio, numerado e que não se apaga: decisão
trocada ganha um ADR novo, e o antigo passa a `Substituída por NNNN`.

| ADR                                             | Decisão                                                  | Status                                  |
| ----------------------------------------------- | -------------------------------------------------------- | --------------------------------------- |
| [0001](0001-motor-dsl-caminho-padrao.md)        | Toda tela de negócio é JSON no motor; TS só nas exceções | Aceita; exceções substituídas pela 0003 |
| [0002](0002-padroes-de-qualidade.md)            | Padrões de qualidade e como cada um é medido             | Aceita                                  |
| [0003](0003-motor-sem-excecoes.md)              | Tudo pelo motor, sem exceções; o que falta vira issue    | Aceita                                  |
| [0004](0004-moldura-do-desktop-no-app-json.md)  | Moldura do desktop no app.json, plataforma por porta     | Aceita                                  |
| [0005](0005-conversas-a-parte.md)               | Conversas à parte e ações por mensagem no chat           | Aceita                                  |
| [0006](0006-chat-no-app-json.md)                | Chat e assistente declarados no app.json, agente é porta | Aceita                                  |
| [0007](0007-telas-de-status-e-erro-da-shell.md) | Telas de status, 503 de proxy e erros vêm da shell       | Aceita                                  |

## Formato

Arquivo `NNNN-titulo-curto.md`, com as seções:

- **Status**: Proposta, Aceita, Substituída por NNNN ou Abandonada, com a data e quem decidiu.
- **Contexto**: o problema e o que existe hoje, sem enfeite.
- **Decisão**: a regra, escrita para quem vai revisar um PR conseguir aplicar.
- **Consequências**: o que melhora, o que piora e o custo.
- **Alternativas consideradas**: o que ficou de fora e por quê.

Decisões anteriores a esta pasta (spec neutra, backend Rust primeiro, cada sistema dono das migrations, piloto antes de
crescer a spec) estão no [`spec/README.md`](../../spec/README.md) e no README da raiz; viram ADR quando forem revistas.
