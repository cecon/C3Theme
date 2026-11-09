import { describe, expect, it } from 'vitest';

import { widgetLink } from '../../dashboard';
import { readWidgetWhere } from './readFilters';

describe('recorte do painel na lista', () => {
  it('o link do widget leva o where em w, e a lista lê de volta a mesma condição', () => {
    const where = { field: 'seller_id', op: 'eq' as const, value: '1' };
    const link = widgetLink({ type: 'kpi', title: 'Em aberto', entity: 'sales_order', preset: 'em-aberto', where });
    const params = new URL(link, 'http://x').searchParams;
    expect(params.get('preset')).toBe('em-aberto');
    expect(readWidgetWhere(params)).toEqual(where);
  });

  it('sem where, o link é o da lista; w inválido é ignorado', () => {
    expect(widgetLink({ type: 'kpi', title: 'Todos', entity: 'customer' })).not.toContain('w=');
    expect(readWidgetWhere(new URLSearchParams('w=%7Bquebrado'))).toBeNull();
    expect(readWidgetWhere(new URLSearchParams('w=%5B1%5D'))).toBeNull();
  });
});
