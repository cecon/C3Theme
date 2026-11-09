# 0002. Padrões de qualidade e como cada um é medido

## Status

Aceita em 09/11/2026 (Eduardo: "adr, solid, hexagonal, kiss, dry, 300 linhas max, lint 0, 80% de testes, mutação
quality 90% 80% no test dif, e2e").

## Contexto

As regras existiam espalhadas (instruções do projeto, memória, revisão manual) e só parte delas era checada pela
máquina. Regra que só o revisor lembra cai no primeiro PR apressado. A decisão aqui é dizer, para cada padrão, quem
mede, onde e com que número, e registrar onde o projeto ainda está abaixo dele.

## Decisão

| Padrão                            | Como é medido                                                                                          | Onde                          | Bloqueia?                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------- |
| Arquivo com no máximo 300 linhas  | `pnpm lines:check`                                                                                     | CI do PR                      | Sim                       |
| Lint com 0 erros e 0 avisos       | `pnpm lint` (`--max-warnings 0`, Prettier incluído); `cargo clippy -D warnings`; `cargo fmt --check`   | CI do PR                      | Sim                       |
| 80% de cobertura por pacote       | `pnpm test:coverage` (linhas e branches, pisos em `scripts/coverage-floors.ts`); `pnpm coverage:rust`  | CI do PR                      | Sim                       |
| 80% de cobertura nas linhas do PR | `pnpm coverage:diff`: diff do PR cruzado com os lcov do vitest e do `cargo llvm-cov`                   | CI do PR                      | Sim                       |
| Mutação 90% nas linhas do PR      | `pnpm mutation:ts --diff` (Stryker) e `pnpm mutation:rust --diff` (cargo-mutants `--in-diff`)          | CI do PR, job `mutation-diff` | Ainda não: mede e mostra  |
| Mutação por pacote                | `pnpm mutation:ts <pacote>` e `pnpm mutation:rust k/n`; pisos em `scripts/quality/mutation-floors.mjs` | `mutation.yml`, semanal       | Sim, contra o piso medido |
| e2e dos fluxos afetados           | `pnpm e2e` (Playwright): vitrine pelo motor, Storybook e o app do `create-app` com Node e Rust         | CI do PR                      | Sim                       |
| Acessibilidade                    | `pnpm a11y:storybook` (axe em todas as histórias, claro e escuro)                                      | CI do PR                      | Sim                       |
| ADR, SOLID, hexagonal, KISS, DRY  | Revisão do PR: decisão de arquitetura sem ADR, domínio que importa adaptador, duplicação evitável      | Revisão                       | Sim, pelo revisor         |

Regras de leitura:

- **Piso só sobe.** Pacote abaixo da meta fica travado no nível medido. Teste novo que mata mutante ou cobre linha
  permite subir o piso no mesmo PR; baixar o piso exige um ADR novo.
- **Placar de mutação** = mutantes mortos (inclusive por tempo esgotado) ÷ mutantes válidos. Mutante sem nenhum teste
  que o alcance conta como vivo. Mutante estático (roda na carga do módulo) e mutante Rust que não compila ficam fora.
- **Fora da conta**: `apps/*`, `packages/conformance`, `crates/c3-example`, testes, utilitários de teste e `.d.ts`.
- **SOLID e hexagonal** não têm métrica automática confiável. O que a revisão reprova: regra de negócio dentro de
  componente de tela ou de handler HTTP; domínio importando banco, rede ou framework; porta com mais de um motivo para
  mudar; cópia de lógica que já existe em outro pacote.

## Situação medida em 09/11/2026

| Medida               | Hoje                                                        | Meta |
| -------------------- | ----------------------------------------------------------- | ---- |
| Mutação, electron    | 74%                                                         | 90%  |
| Mutação, flow        | 45%                                                         | 90%  |
| Mutação, chat        | 42%                                                         | 90%  |
| Mutação, engine      | 28%                                                         | 90%  |
| Mutação, engine-node | 24% (65% entre os mutantes que algum teste alcança)         | 90%  |
| Mutação, ui          | sem medida; a primeira rodada semanal mede                  | 90%  |
| Mutação, Rust        | amostra de 25 mutantes: 32%; a primeira rodada semanal mede | 90%  |
| Mutação no último PR | 30,6% nas linhas do PR #1                                   | 90%  |

A distância é grande porque a cobertura de 80% foi alcançada em boa parte por testes de integração (a suíte de
conformidade em processo, a shell inteira em jsdom): eles passam pelas linhas, mas conferem pouco do resultado.
Exemplo da amostra Rust: trocar a checagem de escrita de `access.rs` por "sempre permitido" passa no `cargo test`; só a
conformidade pega.

Por isso a mutação no PR começa medindo sem bloquear. Ela vira bloqueio quando os pacotes chegarem perto de 70%, com
o número decidido pelo Eduardo.

## Consequências

- Toda regra listada tem um comando que roda local e no CI, e uma falha aponta o arquivo e a linha.
- O CI do PR ficou mais longo (e2e, cobertura do diff) e ganhou um job paralelo de mutação. A rodada inteira de mutação
  leva horas e roda só aos domingos ou à mão, porque Actions em repositório privado é cobrado por minuto.
- Subir a mutação exige testes que conferem resultado (valor exato, mensagem, permissão negada), não só que a tela
  renderiza.

## Alternativas consideradas

- **Mutação de 90% bloqueando o PR já**: reprovaria quase todo PR de tela até os testes serem reescritos.
- **Mutação completa em todo PR**: horas por PR; o diff mede o que interessa ao autor.
- **Rodada de mutação noturna**: o placar muda devagar e o custo de minutos não se paga; semanal basta.
