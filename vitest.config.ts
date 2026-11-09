// Testes de todo o monorepo (pnpm test) e cobertura (pnpm test:coverage).
// Regra do projeto: código de produção dos pacotes com no mínimo 80% de linhas e branches cobertos por testes
// unitários. Os pisos por pacote estão em scripts/coverage-floors.ts.
import { defineConfig } from 'vitest/config';
import { coverageThresholds, NOT_PRODUCTION } from './scripts/coverage-floors';

export default defineConfig({
  // pacote do workspace importado pelo código-fonte (como no tsconfig), não pelo dist: o teste vê a mudança na hora
  resolve: { conditions: ['c3theme-source'] },
  ssr: { resolve: { conditions: ['c3theme-source'] } },
  test: {
    coverage: {
      provider: 'v8',
      // só o código publicado dos pacotes; apps (vitrine, seed, storybook, exemplos) ficam fora
      include: ['packages/*/src/**/*.{ts,tsx,mts}'],
      exclude: [
        ...NOT_PRODUCTION.map((pkg) => `packages/${pkg}/**`),
        // testes e utilitários de teste
        '**/*.test.{ts,tsx}',
        '**/*.test-util.ts',
        '**/*.test-utils.ts',
        // declarações de tipo
        '**/*.d.ts',
        '**/*.d.mts'
      ],
      reporter: ['text-summary', 'json-summary'],
      thresholds: coverageThresholds
    }
  }
});
