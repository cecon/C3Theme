import { describe, expect, it } from 'vitest';

import { tableEdgesSx } from './tableEdges';

const HEAD = '& > thead > tr:last-of-type > th:last-child:not([colspan]:not([colspan="1"]))';

describe('tableEdgesSx', () => {
  it('recua as bordas e faz a última coluna abraçar o conteúdo', () => {
    const sx = tableEdgesSx() as Record<string, unknown>;
    expect(sx[HEAD]).toEqual({ width: '1%', whiteSpace: 'nowrap' });
    expect(Object.keys(sx).some((k) => k.includes(':first-child:not(.MuiTableCell-paddingCheckbox)'))).toBe(true);
    // linha que ocupa a tabela toda (vazio, detalhe) não perde a quebra de linha
    expect(Object.keys(sx).some((k) => k.includes('td:last-child:not([colspan]:not([colspan="1"]))'))).toBe(true);
  });

  it('desliga cada parte em separado', () => {
    expect(tableEdgesSx({ hugLast: false })).not.toHaveProperty([HEAD]);
    const onlyHug = tableEdgesSx({ edges: false }) as Record<string, unknown>;
    expect(Object.keys(onlyHug).some((k) => k.includes(':first-child'))).toBe(false);
    expect(onlyHug[HEAD]).toBeDefined();
  });
});
