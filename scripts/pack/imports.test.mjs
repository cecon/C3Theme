import { describe, expect, it } from 'vitest';

import { fixImports, isHandwrittenModule, isModuleFile, missingInPackage, relativeSpecs, resolveSpec } from './imports.mjs';

const has = (...paths) => {
  const set = new Set(paths);
  return (p) => set.has(p);
};

describe('relativeSpecs', () => {
  it('acha from, import de efeito, import() e import() de tipo; ignora pacote', () => {
    const src = [
      "import { a } from './a';",
      "import './b.css';",
      "const c = await import('../c');",
      'type T = import("./d").T;',
      "import React from 'react';",
      "export * from './e.mjs';"
    ].join('\n');
    expect(relativeSpecs(src)).toEqual(['./a', './b.css', '../c', './d', './e.mjs']);
  });
});

describe('resolveSpec', () => {
  it('põe .js quando o par emitido é .js', () => {
    expect(resolveSpec('dist/pages/x.js', './y', has('dist/pages/y.js'))).toBe('./y.js');
  });
  it('põe .mjs quando só existe o .mjs', () => {
    expect(resolveSpec('dist/x.js', './f', has('dist/f.mjs'))).toBe('./f.mjs');
  });
  it('prefere .js a .mjs', () => {
    expect(resolveSpec('dist/x.js', './f', has('dist/f.js', 'dist/f.mjs'))).toBe('./f.js');
  });
  it('pasta vira index.js, ou index.mjs', () => {
    expect(resolveSpec('dist/x.js', './i18n', has('dist/i18n/index.js'))).toBe('./i18n/index.js');
    expect(resolveSpec('dist/x.js', './i18n', has('dist/i18n/index.mjs'))).toBe('./i18n/index.mjs');
  });
  it('com extensão explícita confere que o arquivo existe (#80)', () => {
    const from = 'dist/pages/list/columnHref.js';
    expect(resolveSpec(from, '../../hrefSlots.mjs', has('dist/hrefSlots.mjs'))).toBe('../../hrefSlots.mjs');
    expect(resolveSpec(from, '../../hrefSlots.mjs', has('src/hrefSlots.mjs'))).toBeNull();
    expect(resolveSpec(from, './a.js', has())).toBeNull();
  });
  it('extensão explícita que existe fica como está', () => {
    expect(resolveSpec('dist/x.js', './a.js', has('dist/a.js'))).toBe('./a.js');
  });
  it('só conta como extensão no fim do nome', () => {
    expect(resolveSpec('dist/x.js', './a.cssx', has('dist/a.cssx.js'))).toBe('./a.cssx.js');
    expect(resolveSpec('dist/x.js', './x.jsdom', has('dist/x.jsdom.js'))).toBe('./x.jsdom.js');
  });
  it('css e json passam sem conferir', () => {
    expect(resolveSpec('dist/x.js', './a.css', has())).toBe('./a.css');
    expect(resolveSpec('dist/x.js', './a.json', has())).toBe('./a.json');
  });
  it('null quando nada responde', () => {
    expect(resolveSpec('dist/x.js', './nada', has('dist/outro.js'))).toBeNull();
  });
});

describe('fixImports', () => {
  it('reescreve os que resolvem e lista os que faltam, sem tocar no resto', () => {
    const src = "import { a } from './a';\nimport { H } from '../h.mjs';\nimport x from 'pkg';";
    const { out, missing } = fixImports('dist/sub/x.js', src, has('dist/sub/a.js'));
    expect(out).toBe("import { a } from './a.js';\nimport { H } from '../h.mjs';\nimport x from 'pkg';");
    expect(missing).toEqual(['../h.mjs']);
  });
  it('mantém a aspa original', () => {
    expect(fixImports('dist/x.d.ts', 'type T = import("./t").T;', has('dist/t.js')).out).toBe('type T = import("./t.js").T;');
  });
  it('sem import relativo devolve o mesmo texto', () => {
    expect(fixImports('dist/x.js', 'export const a = 1;', has())).toEqual({ out: 'export const a = 1;', missing: [] });
  });
});

describe('missingInPackage', () => {
  it('reprova o pacote do #80: columnHref.js importa um .mjs que ficou só em src/', () => {
    const files = new Map([
      ['package.json', ''],
      ['src/hrefSlots.mjs', 'export const HREF_SLOT = 1;'],
      ['dist/pages/list/columnHref.js', "import { HREF_SLOT } from '../../hrefSlots.mjs';"]
    ]);
    expect(missingInPackage(files)).toEqual(['dist/pages/list/columnHref.js importa ../../hrefSlots.mjs, que não está no pacote']);
  });
  it('aprova quando o .mjs foi copiado; ignora src/ e arquivos que não são módulo', () => {
    const files = new Map([
      ['dist/hrefSlots.mjs', ''],
      ['dist/hrefSlots.d.mts', ''],
      ['dist/pages/list/columnHref.js', "import { HREF_SLOT } from '../../hrefSlots.mjs';"],
      ['dist/pages/list/columnHref.js.map', "from './nada'"],
      ['src/pages/list/columnHref.ts', "import { x } from './nada';"],
      ['src/hrefSlots.mjs', "import { x } from './nada.mjs';"]
    ]);
    expect(missingInPackage(files)).toEqual([]);
  });
});

describe('isModuleFile', () => {
  it.each([
    ['dist/a.js', true],
    ['dist/a.mjs', true],
    ['dist/a.d.ts', true],
    ['dist/a.d.mts', true],
    ['dist/a.js.map', false],
    ['dist/a.css', false],
    ['dist/a.ts', false]
  ])('%s → %s', (file, expected) => {
    expect(isModuleFile(file)).toBe(expected);
  });
});

describe('isHandwrittenModule', () => {
  it.each([
    ['hrefSlots.mjs', true],
    ['hrefSlots.d.mts', true],
    ['formulas.test.mjs', false],
    ['hrefSlots.mjs.bak', false],
    ['hrefSlots.d.mts.map', false],
    ['index.ts', false],
    ['types.d.ts', false]
  ])('%s → %s', (file, expected) => {
    expect(isHandwrittenModule(file)).toBe(expected);
  });
});
