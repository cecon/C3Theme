import { describe, expect, it } from 'vitest';

import { parseChangedLines, scopeDiff, toRanges } from './diff.mjs';

const DIFF = `diff --git a/packages/ui/src/a.ts b/packages/ui/src/a.ts
index 1..2 100644
--- a/packages/ui/src/a.ts
+++ b/packages/ui/src/a.ts
@@ -3,0 +4,2 @@ export const x = 1;
+const y = 2;
+const z = 3;
@@ -10 +12 @@ function f() {
-  return 1;
+  return 2;
@@ -20,2 +22,0 @@
-apagada
-apagada
diff --git a/old.ts b/old.ts
deleted file mode 100644
--- a/old.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-a
-b
diff --git a/new.ts b/new.ts
new file mode 100644
--- /dev/null
+++ b/new.ts
@@ -0,0 +1,3 @@
+um
+dois
+++três
`;

describe('parseChangedLines', () => {
  it('pega as linhas novas no número do arquivo novo, por arquivo', () => {
    const changed = parseChangedLines(DIFF);
    expect(changed.get('packages/ui/src/a.ts')).toEqual([4, 5, 12]);
    expect(changed.get('new.ts')).toEqual([1, 2, 3]);
  });

  it('ignora arquivo apagado e linha só removida', () => {
    const changed = parseChangedLines(DIFF);
    expect(changed.has('old.ts')).toBe(false);
    expect([...changed.keys()]).toEqual(['packages/ui/src/a.ts', 'new.ts']);
  });

  it('com contexto (-U3) conta as linhas de contexto sem marcá-las', () => {
    const diff = ['+++ b/c.ts', '@@ -1,3 +1,4 @@', ' a', '+b', ' c', '-d', '+e'].join('\n');
    expect(parseChangedLines(diff).get('c.ts')).toEqual([2, 4]);
  });

  it('diff vazio não tem nada', () => {
    expect(parseChangedLines('').size).toBe(0);
  });
});

describe('toRanges', () => {
  it('junta linhas seguidas e ordena', () => {
    expect(toRanges([9, 3, 5, 4, 4])).toEqual([
      [3, 5],
      [9, 9]
    ]);
  });

  it('lista vazia não tem faixa', () => {
    expect(toRanges([])).toEqual([]);
  });
});

describe('scopeDiff', () => {
  const two = [
    'diff --git a/crates/x/src/lib.rs b/crates/x/src/lib.rs',
    '--- a/crates/x/src/lib.rs',
    '+++ b/crates/x/src/lib.rs',
    '@@ -1 +1 @@',
    '-a',
    '+b',
    'diff --git a/crates/y/src/lib.rs b/crates/y/src/lib.rs',
    '--- a/crates/y/src/lib.rs',
    '+++ b/crates/y/src/lib.rs',
    '@@ -1 +1 @@',
    '-a',
    '+b',
    ''
  ].join('\n');

  it('fica só com os arquivos do subdiretório, com o caminho relativo a ele', () => {
    const scoped = scopeDiff(two, 'crates/x/');
    expect(scoped).toContain('+++ b/src/lib.rs');
    expect(scoped).not.toContain('crates/y');
    expect(parseChangedLines(scoped).get('src/lib.rs')).toEqual([1]);
  });

  it('nada no subdiretório é diff vazio', () => {
    expect(scopeDiff(two, 'crates/z/')).toBe('');
  });
});
