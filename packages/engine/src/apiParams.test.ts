// Ação em conjunto numa consulta do sistema (#35): os parâmetros da lista vão na URL (`p.<nome>`), como na listagem.
import { describe, expect, it, vi } from 'vitest';

import { createClient } from './api';

const ok = () => new Response(JSON.stringify({ message: 'Feito.' }), { status: 200, headers: { 'content-type': 'application/json' } });

describe('parâmetros da consulta nas ações', () => {
  it('togetherAction e a prévia em conjunto levam p.<nome>; sem parâmetros, a rota fica igual', async () => {
    const fetch = vi.fn().mockImplementation(async () => ok());
    const client = createClient('/api/', undefined, undefined, fetch);
    await client.togetherAction('pendencias', 'adiar', ['3'], { days: 7 }, { until: '2020-02-15' });
    await client.preview('pendencias', 'adiar', undefined, {}, ['3'], { until: '2020-02-15', stage: '' });
    await client.togetherAction('pedidos', 'faturar', ['1']);
    expect(fetch.mock.calls.map((c) => c[0])).toEqual([
      '/api/pendencias/_actions/adiar?p.until=2020-02-15',
      '/api/pendencias/_actions/adiar/_preview?p.until=2020-02-15&p.stage=',
      '/api/pedidos/_actions/faturar'
    ]);
  });
});
