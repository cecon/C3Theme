# 0001. Toda tela de negócio é JSON no motor

## Status

Aceita em 09/11/2026 (Eduardo: "usar e estimular a todos a usarem 100% o motor DSL").

## Contexto

O C3 nasceu para que cada sistema descreva as telas em JSON e uma shell única monte tudo com o mesmo visual e o mesmo
jeito de salvar. Mesmo assim, os pontos de entrada ensinavam TypeScript primeiro:

- o README da raiz apresentava o `@c3theme/ui` sozinho como caminho normal ("é o caso do seed e da vitrine") e só
  depois o motor;
- `pnpm create-app` copia o seed, que é um app em TS sem o motor;
- a vitrine tem cerca de 39 mil linhas de TS (telas e catálogo); em 09/11/2026 só Lista de clientes, Lista de faturas e Painel
  de faturas saem do motor;
- o Storybook mostra componentes em TS, inclusive os que o motor já monta;
- a skill `c3-front` punha "telas próprias com o `@c3theme/ui`" no mesmo nível do `C3Shell`.

Quem copia o exemplo copia TS. Cada tela em TS é código que o sistema mantém sozinho, não ganha as melhorias da shell
e costuma sair com outro visual (o Nati já teve campo com markup Bootstrap no lugar de um `reference`). E se nem a
vitrine e os agentes conseguem montar tudo pelo motor, quem usa o C3 também não vai conseguir: o exemplo em TS esconde
exatamente as lacunas que precisam aparecer.

## Decisão

**O motor é o caminho padrão e obrigatório para toda tela de negócio.** Lista, formulário, detalhe, mestre-detalhe,
quadro, calendário, painel, relatório, configuração e ação saem de `app.json` e das entidades da spec, validados pelo
`pnpm spec:check`. Vale para os sistemas que usam o C3 e para tudo que o C3 publica como exemplo:

- **Vitrine**: tela de negócio sai do motor, com o mesmo visual; "Mostrar código" mostra o JSON
  ([`docs/vitrine-por-json.md`](../vitrine-por-json.md)).
- **Storybook**: a história de algo que o motor monta é montada por JSON; o que ainda não dá fica marcado como uso
  direto, com a lacuna citada.
- **Exemplos, README e docs**: mostram o JSON antes do TS. TS aparece como integração (`<C3Shell>`, `components`,
  `Hooks`) ou como exceção, nunca como o jeito normal de fazer uma tela.
- **Skills do plugin `c3`**: mandam o agente escrever JSON e subir a escada do `c3-spec` degrau por degrau.

### Exceções (lista fechada)

Só estas continuam em TS. Entrar uma exceção nova pede um ADR que substitua este.

1. **Página registrada**: tela que o motor não monta e não é cadastro (caixa do PDV com TEF, montagem do pedido do
   delivery). Fica num componente com nome, citado em `pages[].component`, e o que varia por loja vai em `config`,
   validado contra o `components/<nome>.schema.json` do componente (`spec/README.md`, "Página registrada"). O
   componente usa os campos e blocos do `@c3theme/ui`, nunca markup próprio.
2. **Catálogo de primitivas**: a peça solta do `@c3theme/ui` (botão, chip, campo, token, skeleton) no Storybook e nas
   páginas de componente da vitrine. É o que o motor usa por dentro, então mostrar a peça em TS é correto. As páginas
   públicas da vitrine (erro, manutenção) entram aqui como demonstração de `MessagePage` e `AuthLayout`; o login de um
   sistema vem do `auth` do `app.json`.
3. **Chat** (`@c3theme/chat`): conversa e assistente são componente com porta (`ChatTransport`). As telas que o
   assistente mostra na resposta saem do motor (`c3.form`, `c3.record`, `c3.action`).
4. **Flow** (`@c3theme/flow`): editor de grafo de passos, com contrato próprio `{ nodes, edges }`.
5. **Moldura do desktop**: `AppLayout desktop`, `desktopTokens` e os adaptadores do `@c3theme/electron`. É a janela em
   volta do motor, não tela.

Componente custom de campo, coluna ou seção (degraus 4 e 5 da escada) não é exceção: é permitido quando os degraus de
baixo não resolvem, fica registrado por nome na spec e conta no critério de 30% abaixo.

### O que o motor não alcança vira lacuna, nunca TS escondido

Quando uma tela não sai do motor com o resultado esperado:

1. a diferença vira **lacuna registrada**, com número e descrição (`docs/vitrine-por-json.md` para a vitrine; a
   história marcada como uso direto no Storybook; uma issue para os sistemas);
2. a lacuna vira **trabalho no motor** (spec, shell, backend Rust e Node, conformidade), um PR por lacuna ou por tela;
3. enquanto não fecha, a versão em TS pode ficar, **visível como lacuna**: com o aviso na tela ou na história e a
   linha na tabela. Não vale tela em TS sem aviso, componente custom genérico para contornar a spec, nem mudar o visual
   para caber no que o motor já faz.

Uma lacuna só vira chave nova da spec com um uso real (vitrine, Storybook ou sistema) e depois de conferir que nenhum
degrau abaixo resolve. Isso mantém a regra de 18/10/2026: piloto e uso real antes de crescer a spec.

### Critério para repensar o modelo

Mantém-se a decisão de 18/10/2026: **se o piloto (o primeiro sistema de verdade sobre o motor) precisar de mais de 30%
de telas custom, o modelo volta para a mesa**, em vez de seguir escrevendo TS ao redor dele.

- Conta-se por tela do menu do piloto. É custom a tela cujo corpo é uma página registrada, ou que depende de seção
  custom para a tarefa principal. Widget de um campo ou de uma coluna não torna a tela custom.
- As exceções 3 a 5 não entram na conta; a página registrada entra.
- A conta é feita e anotada na conclusão do piloto, e a cada nova página registrada dele.

## Consequências

- **Melhora**: um visual só; melhoria da shell chega a todas as telas; os agentes têm um caminho único para seguir;
  cada lacuna aparece em vez de ficar escondida num exemplo em TS.
- **Piora**: a vitrine e o Storybook andam no ritmo do motor, e uma tela que em TS sairia num dia pode esperar o PR da
  lacuna. A spec cresce, e cada chave nova é contrato para dois backends (Rust e Node) e para a conformidade.
- **Risco**: a vitrine puxar recurso que nenhum sistema pediu. A mitigação é a regra da lacuna acima e a escada do
  `c3-spec`; se uma lacuna só serve à vitrine, ela é anotada e não implementada.
- **Ainda não está feito** em 09/11/2026: a maioria das telas de negócio da vitrine ainda é TS (lacunas L10–L33); o
  Storybook ainda não monta histórias por JSON. Esses dois são o trabalho que segue este ADR. O `pnpm create-app`
  passou a gerar o sistema pelo motor (front + backend Rust ou Node); o app sem motor ficou atrás de `--sem-motor`,
  como exceção.

## Alternativas consideradas

- **Motor como opção ao lado do TS** (o que existia na prática): rejeitada; o exemplo em TS ganha porque é o que
  aparece primeiro, e as lacunas não aparecem.
- **JSON genérico de layout** (árvore de componentes em JSON): rejeitada desde 30/10/2026. Vira React escrito em JSON,
  sem as regras de negócio que a spec carrega. A spec descreve o quê (campos, visões, ações), não a árvore da tela.
- **Converter também catálogo, chat e flow**: rejeitada; são componentes, não telas de negócio, e o motor os usa ou os
  posiciona.

## Como aplicar na revisão de PR

Tela de negócio nova ou alterada em TS, fora das cinco exceções e sem lacuna registrada, é motivo de reprovar o PR.
PR que fecha uma lacuna atualiza a tabela dela e troca a tela em TS pela do motor.
