// Piso de cobertura (%) de cada pacote TS, conferido por pnpm test:coverage no CI: linhas e branches.
// A meta é TARGET nos dois, em todos. Pacote abaixo dela tem o piso no nível medido: o PR que escreve testes sobe o
// número, nunca desce. Pacote novo (fora da lista) já nasce com TARGET. Quando todos chegarem lá, a lista some.
// O Rust tem a mesma régua em scripts/coverage-rust.mjs.
import { readdirSync } from 'node:fs';

export const TARGET = 80;

type Floor = { lines: number; branches: number };

const floors: Record<string, Floor> = {
  engine: { lines: TARGET, branches: 77 }
};

// a suíte de conformidade é teste (caixa-preta contra os backends), não código de produção
export const NOT_PRODUCTION = ['conformance'];

const packages = readdirSync(new URL('../packages', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory() && !NOT_PRODUCTION.includes(d.name))
  .map((d) => d.name);

export const coverageThresholds = Object.fromEntries(
  packages.map((pkg) => [`packages/${pkg}/src/**`, floors[pkg] ?? { lines: TARGET, branches: TARGET }])
);
