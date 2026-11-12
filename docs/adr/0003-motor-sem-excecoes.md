# 0003. Tudo pelo motor, sem exceções

## Status

Aceita em 12/11/2026 (Eduardo: "esse precisa ser um projeto para ser usado 100% via motor, então você precisa deixar
as ADRs claras quanto a isso, sem exceções, e quando houver precisa pedir issue no nosso time"). Substitui a lista de
exceções do [ADR 0001](0001-motor-dsl-caminho-padrao.md); o resto do 0001 continua valendo.

## Contexto

O ADR 0001 fez do motor o caminho padrão, mas deixou cinco exceções fechadas em TS: página registrada, catálogo de
primitivas, chat, flow e moldura do desktop. Na prática a exceção virou porta de saída:

- o chat inteiro (assistente, aprovação, pergunta) só se monta em TS, e cada sistema que tem agente escreve a própria
  ponte em React (o Piecework fez uma para a sub-conversa, issue #10);
- o `pnpm create-app --sem-motor` ainda gera um app sem o motor;
- quando o motor não alcança algo, a saída mais curta é a página registrada, e ela não deixa rastro de que falta
  recurso.

Exceção que não custa nada vira o caminho normal. Se o C3 é para ser usado 100% pelo motor, a falta de recurso tem que
aparecer como pedido para o time do C3, e não como TS no sistema.

## Decisão

**Toda tela é JSON no motor. Não há exceção.** Vale para tela de negócio, chat e assistente, editor de fluxo,
moldura do desktop, login e páginas públicas, nos sistemas que usam o C3 e em tudo que o C3 publica (vitrine,
Storybook, exemplos, `create-app`).

### Quando o motor não alcança: issue, não TS

1. Abra uma **issue no `cecon/C3Theme`** com o título `lacuna: <o que falta>`, o caso real (sistema, tela, print) e o
   que já foi tentado na escada do `c3-spec`. É o pedido ao time do C3.
2. A tela **espera a issue** ou usa o degrau mais baixo que funciona, **com a issue citada**: no componente
   (`// lacuna: cecon/C3Theme#N`), na história do Storybook e na tabela da vitrine.
3. A issue vira trabalho no motor (spec, shell, Rust, Node, conformidade). Quando fecha, o sistema troca o contorno
   pelo JSON.

### O que muda em cada exceção do 0001

| Exceção do 0001                 | Agora                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Página registrada               | Continua no contrato (o Nati depende dela), mas **cada uso novo exige uma issue `lacuna:` aberta antes** e cita o número. É contorno com dono, não exceção. Conta no critério de 30%. |
| Componente custom               | Mesma regra da página registrada: cita a issue.                                                                                                                                       |
| Chat                            | Declarado no `app.json` e nas partes do `agent-ui.schema.json` (issues #70 e #71).                                                                                                    |
| Flow                            | Lacuna: editor de fluxo declarado na spec (issue #72).                                                                                                                                |
| Moldura do desktop              | Lacuna: moldura declarada no `app.json` (issue #73).                                                                                                                                  |
| App sem o motor (`--sem-motor`) | Obsoleto; sai quando as lacunas do seed fecharem (issue #74).                                                                                                                         |
| Catálogo de primitivas          | Não é tela, então não é exceção: veja abaixo.                                                                                                                                         |

### O que não é tela

Botão, campo, chip, tabela, card de aprovação e o navegador interno do `@c3theme/ui` e do `@c3theme/chat` são o
**vocabulário** que o motor monta. Eles são escritos em TS porque são a implementação do motor, e o Storybook os
documenta peça a peça. O que não vale é um sistema (ou um exemplo do C3) **juntar** essas peças numa tela: juntar é
papel do motor.

### Chat e agente pelo motor

O agente propõe, o humano decide, o motor grava. Toda interação que o agente pede ao humano é uma **parte declarada**
em `spec/v0/agent-ui.schema.json`, conferida no backend (`Engine::check_agent_part`) e desenhada pelo catálogo fechado
do motor e do chat: formulário (`c3.form`), rascunho de registro (`c3.record`), ação (`c3.action`), e, com a issue #70, ferramenta com
argumentos editáveis (`c3.tool`), plano editável (`c3.plan`) e navegador interno (`c3.browser`). Kind novo é issue
`lacuna:`, nunca renderizador do sistema.

## Consequências

- **Melhora**: falta de recurso vira fila visível para o time; o agente e os sistemas têm um caminho só; o chat ganha
  as mesmas regras de permissão e gravação das outras telas.
- **Piora**: sistema com prazo pode esperar uma issue do C3, e o time do C3 vira gargalo. A mitigação é o degrau mais
  baixo que funciona, citando a issue.
- **Custo**: cada lacuna é contrato para dois backends (Rust e Node) e para a conformidade; a regra do 0001 continua (só
  vira chave da spec com uso real).
- **Ainda não está feito** em 12/11/2026: chat no `app.json` (#71), flow (#72), moldura do desktop (#73), saída do
  `--sem-motor` (#74), telas da vitrine L10–L33 e Storybook por JSON.

## Alternativas consideradas

- **Manter as cinco exceções** (ADR 0001): rejeitada pelo Eduardo; a exceção virou o caminho mais curto.
- **Remover a página registrada e o componente custom do contrato**: rejeitada agora; quebraria o Nati (X12, X13, X16)
  sem substituto. Fica como contorno que exige issue.
- **Tratar as primitivas como tela**: não faz sentido; o motor precisa delas para montar qualquer tela.

## Como aplicar na revisão de PR

- Tela montada em TS (fora do motor) sem `lacuna: cecon/C3Theme#N` citado: reprovar.
- Página registrada ou componente custom novo sem issue aberta: reprovar.
- Kind de parte do agente fora do `agent-ui.schema.json`: reprovar.
