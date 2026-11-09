import { describe, expect, it } from 'vitest';

import { fallbackModels, filterModels, keepFallback, normalizeSearch, selectableValues, stepModel, type ModelGroup } from './models';

const GROUPS: ModelGroup[] = [
  {
    id: 'opencode',
    label: 'OpenCode',
    options: [
      { value: 'opencode/grok', label: 'Grok Code', flags: ['free'] },
      { value: 'opencode/qwen', label: 'Qwen Coder', unavailable: 'Fora do ar' }
    ]
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    unavailable: 'Entre na Anthropic para usar',
    options: [{ value: 'anthropic/sonnet', label: 'Claude Sonnet' }]
  },
  { id: 'ollama', label: 'Ollama', options: [{ value: 'ollama/llama', label: 'Llama Média', flags: ['local'] }] }
];

describe('models', () => {
  it('busca ignora acento, maiúscula e espaço extra', () => {
    expect(normalizeSearch('  LLAMA  média ')).toBe('llama media');
    expect(filterModels(GROUPS, 'media').map((g) => g.id)).toEqual(['ollama']);
  });

  it('busca casa todas as palavras no nome, no id ou no provedor', () => {
    const found = filterModels(GROUPS, 'anthropic son');
    expect(found.map((g) => g.options.map((o) => o.value))).toEqual([['anthropic/sonnet']]);
    expect(
      filterModels(GROUPS, 'grok')
        .flatMap((g) => g.options)
        .map((o) => o.value)
    ).toEqual(['opencode/grok']);
    expect(filterModels(GROUPS, 'nada disso')).toEqual([]);
    expect(filterModels(GROUPS, '  ')).toBe(GROUPS);
  });

  it('setas passam só pelas opções disponíveis e dão a volta', () => {
    const values = selectableValues(GROUPS);
    expect(values).toEqual(['opencode/grok', 'ollama/llama']);
    expect(stepModel(values, 'opencode/grok', 1)).toBe('ollama/llama');
    expect(stepModel(values, 'ollama/llama', 1)).toBe('opencode/grok');
    expect(stepModel(values, null, -1)).toBe('ollama/llama');
    expect(stepModel([], null, 1)).toBeNull();
  });

  it('reserva não lista o principal nem os indisponíveis', () => {
    const list = fallbackModels(GROUPS, 'opencode/grok');
    expect(list.flatMap((g) => g.options).map((o) => o.value)).toEqual(['ollama/llama']);
  });

  it('reserva é limpo quando vira o principal ou fica indisponível; senão é mantido', () => {
    expect(keepFallback(GROUPS, 'opencode/grok', 'ollama/llama')).toBe('ollama/llama');
    expect(keepFallback(GROUPS, 'ollama/llama', 'ollama/llama')).toBeNull();
    expect(keepFallback(GROUPS, 'opencode/grok', 'anthropic/sonnet')).toBeNull();
    expect(keepFallback(GROUPS, 'opencode/grok', 'sumiu')).toBeNull();
    expect(keepFallback(GROUPS, 'opencode/grok', null)).toBeNull();
  });
});
