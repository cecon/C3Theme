// Preset sem `where` (#67): é o "Todos" da entidade e não duplica a aba própria.
import { describe, expect, it } from 'vitest';

import { presetTabValue, presetTabs, withPreset } from './presetTabs';
import type { Condition, Preset } from './types';

const ativo: Condition = { field: 'ativo', op: 'eq', value: true };
const own: Condition = { field: 'pai', op: 'eq', value: '1' };
const ativos: Preset = { id: 'ativos', label: 'Ativos', where: ativo };
const todos: Preset = { id: 'todos', label: 'Todos' };

describe('presetTabs', () => {
  it('põe a aba "Todos" própria quando todo preset filtra', () => {
    expect(presetTabs([ativos], 'Tudo')).toEqual([{ id: '', label: 'Tudo' }, ativos]);
  });

  it('o preset sem where ocupa o lugar da aba própria', () => {
    expect(presetTabs([todos, ativos], 'Todos')).toEqual([todos, ativos]);
  });
});

describe('presetTabValue', () => {
  it('mantém a aba atual quando ela existe', () => {
    expect(presetTabValue(presetTabs([todos, ativos], 'Todos'), 'ativos')).toBe('ativos');
    expect(presetTabValue(presetTabs([ativos], 'Todos'), '')).toBe('');
  });

  it('sem aba própria, o vazio e o desconhecido caem no preset sem where', () => {
    const tabs = presetTabs([ativos, todos], 'Todos');
    expect(presetTabValue(tabs, '')).toBe('todos');
    expect(presetTabValue(tabs, 'sumiu')).toBe('todos');
  });

  it('sem nenhum "Todos", cai no vazio', () => {
    expect(presetTabValue([ativos], 'x')).toBe('');
  });
});

describe('withPreset', () => {
  it('soma o where do preset na frente do recorte da tela', () => {
    expect(withPreset(ativos, [own])).toEqual([ativo, own]);
  });

  it('preset sem where ou nenhum é só o recorte da tela (nada de undefined no and)', () => {
    expect(withPreset(todos, [own])).toEqual([own]);
    expect(withPreset(undefined, [own])).toEqual([own]);
    expect(withPreset(todos, [])).toEqual([]);
  });
});
