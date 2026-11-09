// Sino (spec/v0/notifications.yaml): GET /_notifications, POST /_notifications/_read e o SSE
// /_notifications/_events. O exemplo dá três avisos a cada usuário na primeira leitura; a suíte pode rodar mais de
// uma vez contra o mesmo servidor, então só confere o que vale em qualquer rodada.

import assert from 'node:assert/strict';

/** Abre o SSE e devolve o leitor do próximo evento (com prazo) e o fechamento. */
async function open(base, path) {
  const ctrl = new AbortController();
  const res = await fetch(base + path, { signal: ctrl.signal });
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
        if (event) return event;
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

export function notificationsTests({ test, call, base }) {
  test('notifications', 'lista do mais novo ao mais velho, com unread de todos os não lidos', async () => {
    const res = await call('GET', '/_notifications');
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const { items, unread } = res.body;
    assert.ok(Array.isArray(items) && items.length > 0, 'o exemplo tem avisos');
    assert.equal(typeof unread, 'number');
    for (const n of items) {
      assert.equal(typeof n.id, 'string');
      assert.equal(typeof n.title, 'string');
      assert.ok(n.readAt === null || typeof n.readAt === 'string');
      assert.ok(!Number.isNaN(Date.parse(n.createdAt)), n.createdAt);
    }
    const dates = items.map((n) => n.createdAt);
    assert.deepEqual(dates, [...dates].sort().reverse());
    assert.ok(unread >= items.filter((n) => n.readAt === null).length);
  });

  test('notifications', 'limit corta a página; fora de 1..100 é 400', async () => {
    assert.equal((await call('GET', '/_notifications?limit=1')).body.items.length, 1);
    assert.equal((await call('GET', '/_notifications?limit=0')).status, 400);
    assert.equal((await call('GET', '/_notifications?limit=abc')).status, 400);
  });

  test('notifications', 'marcar um como lido grava o readAt; sem ids, marca todos', async () => {
    const [first] = (await call('GET', '/_notifications')).body.items;
    const one = await call('POST', '/_notifications/_read', { ids: [first.id] });
    assert.equal(one.status, 200, JSON.stringify(one.body));
    assert.equal(typeof one.body.unread, 'number');
    const after = (await call('GET', '/_notifications')).body.items.find((n) => n.id === first.id);
    assert.equal(typeof after.readAt, 'string');
    assert.equal((await call('POST', '/_notifications/_read', { ids: 'x' })).status, 400);
    assert.deepEqual((await call('POST', '/_notifications/_read', {})).body, { unread: 0 });
    assert.equal((await call('GET', '/_notifications')).body.unread, 0);
  });

  test('notifications', 'SSE: ready, depois notification quando a lista do usuário muda', async () => {
    const sse = await open(base, '/_notifications/_events');
    try {
      assert.equal(await sse.next(), 'ready');
      assert.equal((await call('POST', '/_notifications/_read', {})).status, 200);
      assert.equal(await sse.next(), 'notification');
    } finally {
      sse.close();
    }
  });
}
