import { describe, expect, it } from 'vitest';
import { metaLogin } from './meta';
import type { Engine } from './engine';

describe('metadados públicos de entrada', () => {
  it('publica status sem expor entidades nem layout', () => {
    const status = { mode: 'maintenance', message: 'Atualização', until: '2026-12-01T12:00:00Z' };
    const engine = { app: { raw: { name: 'Loja', auth: {}, status, entities: ['privada'], layout: { menu: [] } } } } as unknown as Engine;
    expect(metaLogin(engine)).toEqual({ name: 'Loja', auth: {}, status });
  });
  it('mantém a resposta antiga quando não há status', () => {
    expect(metaLogin({ app: { raw: { name: 'Loja' } } } as unknown as Engine)).toEqual({ name: 'Loja', auth: null });
  });
});
