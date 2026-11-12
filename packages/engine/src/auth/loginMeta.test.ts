import { describe, expect, it, vi } from 'vitest';

import { readLoginMeta } from './loginMeta';

const NOW = Date.parse('2026-11-12T12:00:00Z');
const reply = (status: number, body: string, headers: Record<string, string> = {}) =>
  vi.fn(async (_url: string) => new Response(body, { status, headers }));

describe('GET /_meta/login (#81)', () => {
  it('pede na base sem a barra do fim e devolve nome e auth', async () => {
    const t = reply(200, JSON.stringify({ data: { name: 'Loja', auth: { identifier: 'username' } } }));
    expect(await readLoginMeta(t, '/api/', NOW)).toEqual({ name: 'Loja', auth: { identifier: 'username' } });
    expect(t).toHaveBeenCalledWith('/api/_meta/login');
  });

  it('sem nome nem auth: os padrões', async () => {
    expect(await readLoginMeta(reply(200, JSON.stringify({ data: {} })), '/api', NOW)).toEqual({ name: '', auth: {} });
  });

  it('backend sem a rota (404): login com o padrão', async () => {
    expect(await readLoginMeta(reply(404, ''), '/api', NOW)).toEqual({ name: '', auth: {} });
  });

  it('status declarado: só o status', async () => {
    const status = { mode: 'comingSoon', until: '2026-12-01T12:00:00Z' };
    expect(await readLoginMeta(reply(200, JSON.stringify({ data: { name: 'Loja', auth: null, status } })), '/api', NOW)).toEqual({
      status
    });
  });

  it('status inválido no corpo é ignorado', async () => {
    const r = await readLoginMeta(reply(200, JSON.stringify({ data: { name: 'Loja', status: { mode: 'x' } } })), '/api', NOW);
    expect(r).toEqual({ name: 'Loja', auth: {} });
  });

  it('503: o status do corpo, ou manutenção com o Retry-After quando o corpo não é JSON', async () => {
    const body = JSON.stringify({ status: { mode: 'maintenance', message: 'Volta às 18h.' } });
    expect(await readLoginMeta(reply(503, body), '/api', NOW)).toEqual({ status: { mode: 'maintenance', message: 'Volta às 18h.' } });
    expect(await readLoginMeta(reply(503, '<h1>fora</h1>', { 'retry-after': '60' }), '/api', NOW)).toEqual({
      status: { mode: 'maintenance', until: '2026-11-12T12:01:00.000Z' }
    });
  });

  it('outro erro ou sem conexão: lança com a mensagem', async () => {
    await expect(readLoginMeta(reply(500, ''), '/api', NOW)).rejects.toThrow('Erro 500.');
    const down = vi.fn(async () => Promise.reject(new Error('rede')));
    await expect(readLoginMeta(down, '/api', NOW)).rejects.toThrow('Sem conexão com o servidor.');
  });
});
