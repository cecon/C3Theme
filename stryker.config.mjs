// Testes de mutação dos pacotes TS (Stryker + vitest). Meta 90%; os pisos medidos por pacote ficam em
// scripts/quality/mutation-floors.mjs. Quem escolhe o alvo é o scripts/mutation-ts.mjs:
//   C3_MUTATE  lista JSON de "arquivo:início-fim" (as linhas do PR)
//   C3_PACKAGE um pacote inteiro (ui, engine, ...), na rodada semanal
//   C3_BREAK   placar mínimo; abaixo dele o Stryker sai com erro
const SOURCE = (pkg) => [
  `packages/${pkg}/src/**/*.{ts,tsx,mts}`,
  '!**/*.test.{ts,tsx}',
  '!**/*.test-util.ts',
  '!**/*.test-utils.ts',
  '!**/*.test-utils.tsx',
  '!**/*.d.ts',
  '!**/*.d.mts'
];

const mutate = process.env.C3_MUTATE ? JSON.parse(process.env.C3_MUTATE) : SOURCE(process.env.C3_PACKAGE ?? '*');
const report = `reports/mutation/${process.env.C3_PACKAGE ?? 'pr'}`;

export default {
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: { related: true },
  coverageAnalysis: 'perTest',
  // mutante "estático" (roda na carga do módulo: dicionários de texto, tabelas) exige rodar todos os testes
  // a cada um e quase nunca é morto por teste de comportamento; fica fora do placar
  ignoreStatic: true,
  mutate,
  timeoutMS: 10000,
  reporters: ['clear-text', 'progress', 'json', 'html'],
  clearTextReporter: { reportMutants: false, reportScoreTable: true },
  jsonReporter: { fileName: `${report}/mutation.json` },
  htmlReporter: { fileName: `${report}/mutation.html` },
  thresholds: { high: 90, low: 80, break: process.env.C3_BREAK ? Number(process.env.C3_BREAK) : null },
  // cópia do repositório que o Stryker monta; vitest, eslint e git a ignoram (fora do node_modules, senão o vitest
  // não acha os testes dela)
  tempDirName: '.stryker-tmp'
};
