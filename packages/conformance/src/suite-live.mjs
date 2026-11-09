// Tempo real (spec/README.md, "Tempo real"): GET /{entity}/_events em SSE para entidade com `live`. Primeiro vem
// `ready`, depois um `change` por gravação. Usa activity (live no exemplo); customer não declara live.

import assert from 'node:assert/strict';

/** Abre o SSE e devolve um leitor de eventos (com prazo) e o fechamento. */
async function open(base, path, headers) {
  const ctrl = new AbortController();
  const res = await fetch(base + path, { headers, signal: ctrl.signal });
  assert.equal(res.status, 200, `${path}: ${res.status}`);
  assert.match(res.headers.get('content-type') ?? '', /^text\/event-stream/);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  async function next(ms = 3000) {
    const deadline = Date.now() + ms;
    for (;;) {
      const end = buffer.indexOf('\n\n');
      if (end >= 0) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const event = /^event: (.*)$/m.exec(block)?.[1];
        const data = /^data: (.*)$/m.exec(block)?.[1];
        if (event) return { event, data: data ? JSON.parse(data) : null };
        continue;
      }
      const left = deadline - Date.now();
      if (left <= 0) return null;
      const chunk = await Promise.race([reader.read(), new Promise((r) => setTimeout(() => r(null), left))]);
      if (!chunk || chunk.done) return null;
      buffer += decoder.decode(chunk.value, { stream: true });
    }
  }
  return { next, close: () => ctrl.abort() };
}

export function liveTests({ test, call, raw, tag, base }) {
  test('live', 'entidade sem live não tem canal (404)', async () => {
    const res = await raw('/customer/_events');
    assert.equal(res.status, 404);
    await res.body?.cancel();
  });

  test('live', 'ready, depois created e deleted das gravações, com o id', async () => {
    const sse = await open(base, '/activity/_events', {});
    try {
      assert.deepEqual(await sse.next(), { event: 'ready', data: {} });
      const created = await call('POST', '/activity', { subject: `Ligar ${tag}`, stage: 'todo', due_date: '2026-01-10' });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      const id = created.body.data.id;
      assert.deepEqual(await sse.next(), { event: 'change', data: { change: 'created', id } });
      assert.equal((await call('DELETE', `/activity/${id}`)).status, 204);
      assert.deepEqual(await sse.next(), { event: 'change', data: { change: 'deleted', id } });
    } finally {
      sse.close();
    }
  });
}
