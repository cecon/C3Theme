import { describe, expect, it } from 'vitest';

import { inlineText, parseInline, parseMarkdown, safeHref } from './markdown';

describe('parseInline', () => {
  it('negrito, itálico, riscado e código', () => {
    expect(parseInline('tem **1 produto** e *um* ~~dois~~ `x`')).toEqual([
      { t: 'text', v: 'tem ' },
      { t: 'strong', c: [{ t: 'text', v: '1 produto' }] },
      { t: 'text', v: ' e ' },
      { t: 'em', c: [{ t: 'text', v: 'um' }] },
      { t: 'text', v: ' ' },
      { t: 'del', c: [{ t: 'text', v: 'dois' }] },
      { t: 'text', v: ' ' },
      { t: 'code', v: 'x' }
    ]);
  });

  it('sublinhado dentro de palavra não vira itálico (nome de ferramenta)', () => {
    expect(parseInline('nati_rotas, nati_consultar')).toEqual([{ t: 'text', v: 'nati_rotas, nati_consultar' }]);
  });

  it('delimitador sem par fica como texto (resposta ainda chegando)', () => {
    expect(inlineText(parseInline('Hoje a loja tem **1 prod'))).toBe('Hoje a loja tem **1 prod');
  });

  it('link seguro vira link; javascript: vira texto', () => {
    expect(parseInline('[site](https://c3.dev)')).toEqual([{ t: 'link', href: 'https://c3.dev', c: [{ t: 'text', v: 'site' }] }]);
    expect(parseInline('[clique](javascript:alert(1))')).toEqual([{ t: 'text', v: 'clique' }]);
    expect(safeHref('data:text/html,<b>')).toBeNull();
    expect(safeHref('/produtos/1')).toBe('/produtos/1');
  });

  it('endereço solto vira link sem levar a pontuação final', () => {
    const nodes = parseInline('veja https://c3.dev/doc.');
    expect(nodes[1]).toEqual({ t: 'link', href: 'https://c3.dev/doc', c: [{ t: 'text', v: 'https://c3.dev/doc' }] });
    expect(nodes[2]).toEqual({ t: 'text', v: '.' });
  });

  it('HTML não é interpretado', () => {
    expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([{ t: 'text', v: '<img src=x onerror=alert(1)>' }]);
  });

  it('escape e quebra de linha', () => {
    expect(parseInline('\\*não\\*\nlinha')).toEqual([{ t: 'text', v: '*não*' }, { t: 'br' }, { t: 'text', v: 'linha' }]);
  });
});

describe('parseMarkdown', () => {
  it('título, parágrafo e linha', () => {
    expect(parseMarkdown('## Estoque\ntexto\n\n---').map((b) => b.t)).toEqual(['h', 'p', 'hr']);
  });

  it('lista com sublista', () => {
    const [list] = parseMarkdown('- a\n- b\n  1. b1\n  2. b2\n- c');
    expect(list).toMatchObject({ t: 'list', ordered: false });
    if (list.t !== 'list') throw new Error();
    expect(list.items).toHaveLength(3);
    expect(list.items[1][1]).toMatchObject({ t: 'list', ordered: true, start: 1 });
  });

  it('lista numerada começa no número dado', () => {
    expect(parseMarkdown('3. três\n4. quatro')[0]).toMatchObject({ t: 'list', ordered: true, start: 3 });
  });

  it('código cercado, inclusive sem fechar (streaming)', () => {
    expect(parseMarkdown('```sql\nselect 1\n```')).toEqual([{ t: 'code', lang: 'sql', v: 'select 1' }]);
    expect(parseMarkdown('```\nselect')).toEqual([{ t: 'code', lang: '', v: 'select' }]);
  });

  it('tabela com alinhamento', () => {
    const [table] = parseMarkdown('| Produto | Qtd |\n|:--|--:|\n| Coca | 10 |\n| Água |');
    expect(table).toMatchObject({ t: 'table', align: ['left', 'right'] });
    if (table.t !== 'table') throw new Error();
    expect(table.rows).toHaveLength(2);
    expect(table.rows[1][1]).toEqual([]);
  });

  it('citação', () => {
    expect(parseMarkdown('> atenção\n> aqui')).toEqual([
      { t: 'quote', c: [{ t: 'p', c: [{ t: 'text', v: 'atenção' }, { t: 'br' }, { t: 'text', v: 'aqui' }] }] }
    ]);
  });
});
