import { describe, expect, it, vi } from 'vitest';

import {
  actionsFor,
  countByKind,
  filterCatalog,
  groupByCategory,
  isInstalled,
  primaryAction,
  primaryCallback,
  type CatalogItem
} from './catalog';

const item = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({
  id,
  kind: 'agent',
  name: id,
  summary: '',
  version: '1.0.0',
  status: { state: 'available' },
  ...over
});

describe('primaryAction', () => {
  it('muda a ação principal conforme o estado', () => {
    expect(primaryAction({ state: 'available' })).toBe('install');
    expect(primaryAction({ state: 'installing', progress: 30 })).toBe('installing');
    expect(primaryAction({ state: 'installed' })).toBe('open');
    expect(primaryAction({ state: 'update-available', version: '2.0.0' })).toBe('update');
    expect(primaryAction({ state: 'removed-from-catalog' })).toBe('open');
    expect(primaryAction({ state: 'error', message: 'sem espaço' })).toBe('retry');
  });

  it('entrega o callback da ação e nada enquanto instala ou sem callback', () => {
    const onUpdate = vi.fn();
    expect(primaryCallback({ state: 'update-available', version: '2' }, { onUpdate })).toBe(onUpdate);
    expect(primaryCallback({ state: 'installing' }, { onUpdate })).toBeUndefined();
    expect(primaryCallback({ state: 'available' }, { onUpdate })).toBeUndefined();
  });

  it('instalado inclui atualização pendente e item que saiu do catálogo', () => {
    expect(isInstalled({ state: 'update-available', version: '2' })).toBe(true);
    expect(isInstalled({ state: 'removed-from-catalog' })).toBe(true);
    expect(isInstalled({ state: 'error' })).toBe(false);
  });
});

describe('filterCatalog', () => {
  const items = [
    item('a', { name: 'Atendente da clínica', kind: 'agent', author: 'Piecework' }),
    item('b', { name: 'Resumo de PDF', kind: 'skill', summary: 'Lê contratos' }),
    item('c', { name: 'WhatsApp', kind: 'app', category: 'Mensagens' })
  ];

  it('filtra por tipo', () => {
    expect(filterCatalog(items, { kind: 'skill' }).map((i) => i.id)).toEqual(['b']);
    expect(filterCatalog(items, { kind: 'all' })).toHaveLength(3);
  });

  it('busca sem acento e sem caixa, todas as palavras, em nome, resumo, autor e categoria', () => {
    expect(filterCatalog(items, { query: 'CLINICA' }).map((i) => i.id)).toEqual(['a']);
    expect(filterCatalog(items, { query: 'contratos pdf' }).map((i) => i.id)).toEqual(['b']);
    expect(filterCatalog(items, { query: 'piecework' }).map((i) => i.id)).toEqual(['a']);
    expect(filterCatalog(items, { query: 'mensagens' }).map((i) => i.id)).toEqual(['c']);
    expect(filterCatalog(items, { query: 'pdf whatsapp' })).toEqual([]);
  });

  it('conta por tipo', () => {
    expect(countByKind(items)).toEqual({ all: 3, agent: 1, skill: 1, app: 1 });
  });
});

describe('groupByCategory', () => {
  it('mantém a ordem de chegada e deixa os sem categoria no fim', () => {
    const groups = groupByCategory([
      item('x'),
      item('a', { category: 'Vendas' }),
      item('b', { category: 'Suporte' }),
      item('c', { category: 'Vendas' })
    ]);
    expect(groups.map((g) => [g.category, g.items.map((i) => i.id)])).toEqual([
      ['Vendas', ['a', 'c']],
      ['Suporte', ['b']],
      [undefined, ['x']]
    ]);
  });
});

describe('actionsFor', () => {
  it('callbacks soltos valem para todos; objeto por tipo vale só para o tipo do item', () => {
    const onOpen = vi.fn();
    expect(actionsFor({ onOpen }, 'skill')).toEqual({ onOpen });
    expect(actionsFor({ app: { onOpen } }, 'app')).toEqual({ onOpen });
    expect(actionsFor({ app: { onOpen } }, 'skill')).toEqual({});
    expect(actionsFor(undefined, 'agent')).toEqual({});
  });
});
