import { describe, expect, it } from 'vitest';

import { isRustSource, isTsSource, packageOf } from './scope.mjs';

describe('isTsSource', () => {
  it.each([
    ['packages/ui/src/layout/crumbs.ts', true],
    ['packages/engine/src/pages/list/EntityList.tsx', true],
    ['packages/electron/src/main.mts', true],
    ['packages/ui/src/layout/crumbs.test.ts', false],
    ['packages/flow/src/core/fixture.test-utils.ts', false],
    ['packages/flow/src/css.d.ts', false],
    ['packages/conformance/src/run.ts', false],
    ['apps/showcase/src/App.tsx', false],
    ['packages/ui/README.md', false],
    ['scripts/quality/diff.mjs', false]
  ])('%s → %s', (file, expected) => {
    expect(isTsSource(file)).toBe(expected);
  });
});

describe('isRustSource', () => {
  it.each([
    ['crates/c3-engine/src/access.rs', true],
    ['crates/c3-engine-rusqlite/src/lib.rs', true],
    ['crates/c3-engine/src/condition/tests.rs', false],
    ['crates/c3-engine/src/relative_date_tests.rs', false],
    ['crates/c3-engine/tests/http.rs', false],
    ['crates/c3-example/src/main.rs', false],
    ['packages/ui/src/a.ts', false]
  ])('%s → %s', (file, expected) => {
    expect(isRustSource(file)).toBe(expected);
  });
});

it('packageOf pega o pacote do caminho', () => {
  expect(packageOf('packages/engine/src/a.ts')).toBe('engine');
});
