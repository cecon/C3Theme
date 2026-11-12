import { describe, expect, it, vi } from 'vitest';
import { summaryValue, summaryNumber, summaryPercent, summaryFormat } from './summaryDashboard';
import { createClient } from './api';

describe('documento de resumo', () => {
  it('lê campos próprios, incluindo índices, e recusa protótipos', () => {
    expect(summaryValue({ usage: [{ tokens: 0 }] }, 'usage.0.tokens')).toBe(0);
    expect(summaryValue({}, 'constructor')).toBeUndefined();
    expect(summaryValue(null, 'x.y')).toBeUndefined();
    expect(summaryValue({ x: 2 }, 'x.y')).toBeUndefined();
  });
  it('normaliza números e limita o progresso', () => {
    for (const value of [null, undefined, {}, true, '', ' ', 'infinity', Infinity]) expect(summaryNumber(value)).toBeUndefined();
    expect(summaryNumber('2.5')).toBe(2.5);
    expect(summaryPercent(25, 100)).toBe(25);
    expect(summaryPercent(120, 100)).toBe(100);
    expect(summaryPercent(-5, 100)).toBe(0);
    expect(summaryPercent(1, 0)).toBe(0);
    expect(summaryPercent('bad', 10)).toBe(0);
  });
  it('formata moeda do resumo e datas sem lançar para dados inválidos', () => {
    const format = (value: unknown, kind?: 'text' | 'date' | 'datetime' | 'number' | 'currency', currency: unknown = 'BRL') =>
      summaryFormat({ value, currency }, { label: 'Valor', field: 'value', format: kind, currencyField: 'currency' }, 'pt-BR');
    expect(format(1234, 'number')).toBe('1.234');
    expect(format(12.5, 'currency')).toContain('12,50');
    expect(format(12.5, 'currency', 'invalid')).toBe('—');
    expect(format('bad', 'currency')).toBe('—');
    expect(format('2026-11-12T12:00:00Z', 'date')).toContain('2026');
    expect(format('2026-11-12T12:00:00Z', 'datetime')).toContain('2026');
    expect(format('bad', 'date')).toBe('—');
    expect(format(null)).toBe('—');
    expect(format({})).toBe('—');
    expect(format('Texto')).toBe('Texto');
    expect(format('bad', 'number')).toBe('—');
  });
  it('consulta e executa ações pelo transporte autenticado, com erros HTTP normais', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ tokens: 12 }), { headers: { 'content-type': 'application/json' } }));
    const client = createClient('/api', () => ({ Authorization: 'Bearer example' }), undefined, fetch);
    expect(await client.summary!('/uso')).toEqual({ tokens: 12 });
    expect(fetch).toHaveBeenCalledWith(
      '/api/uso',
      expect.objectContaining({ method: 'GET', headers: { Authorization: 'Bearer example' } })
    );
    await client.summary!('/atualizacao/verificar', 'POST');
    expect(fetch).toHaveBeenLastCalledWith('/api/atualizacao/verificar', expect.objectContaining({ method: 'POST' }));
    for (const path of ['//outro', 'https://outro', '/uso#fragment', '/\\outro']) expect(() => client.summary!(path)).toThrow('Caminho');
  });
});
