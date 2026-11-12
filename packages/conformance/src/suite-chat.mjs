// Chat com o agente (spec/v0/chat.yaml): histórico, envio, o SSE com a resposta do agente, a resposta de uma parte
// e as recusas. O CRM de exemplo responde por roteiro ("Cadastrar…" devolve um rascunho c3.record). Cada rodada usa
// uma conversa nova (`tag`), então a suíte pode rodar de novo no mesmo banco.

import assert from 'node:assert/strict';

/** Abre o SSE e devolve o leitor do próximo evento `{ name, data }` (com prazo) e o fechamento. */
async function open(base, path) {
  const ctrl = new AbortController();
  const res = await fetch(base + path, { signal: ctrl.signal });
  assert.equal(res.status, 200, `${path}: ${res.status}`);
  assert.match(res.headers.get('content-type') ?? '', /^text\/event-stream/);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  async function next(ms = 5000) {
    const deadline = Date.now() + ms;
    for (;;) {
      const end = buffer.indexOf('\n\n');
      if (end >= 0) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const name = /^event: (.*)$/m.exec(block)?.[1];
        if (name) return { name, data: JSON.parse(/^data: (.*)$/m.exec(block)?.[1] ?? 'null') };
        continue;
      }
      const left = deadline - Date.now();
      if (left <= 0) return null;
      const chunk = await Promise.race([reader.read(), new Promise((r) => setTimeout(() => r(null), left))]);
      if (!chunk || chunk.done) return null;
      buffer += decoder.decode(chunk.value, { stream: true });
    }
  }
  /** Lê até achar o evento que `match` aceita (ou o prazo acabar). */
  async function until(match, ms = 8000) {
    const deadline = Date.now() + ms;
    for (;;) {
      const e = await next(Math.max(1, deadline - Date.now()));
      if (!e || match(e)) return e;
    }
  }
  return { next, until, close: () => ctrl.abort() };
}

export function chatTests({ test, call, base, tag }) {
  const conv = `conf-${tag}`;
  const path = `/_chat/${conv}`;

  test('chat', 'conversa, limite e corpo fora do formato são 400', async () => {
    assert.equal((await call('GET', '/_chat/com%20espa%C3%A7o/messages')).status, 400);
    assert.equal((await call('GET', `${path}/messages?limit=0`)).status, 400);
    assert.equal((await call('GET', `${path}/messages?limit=101`)).status, 400);
    assert.equal((await call('POST', `${path}/messages`, { text: 'oi' })).status, 400);
    assert.equal((await call('POST', `${path}/messages`, { clientId: 'c1', text: '' })).status, 400);
    assert.equal((await call('POST', `${path}/messages`, { clientId: 'c1', text: 'oi', files: [] })).status, 400);
    assert.equal((await call('POST', `${path}/messages/m1/_ui/p1`, { action: 'talvez' })).status, 400);
  });

  test('chat', 'envio devolve a mensagem com o clientId; o SSE traz a resposta com a parte e responder fecha a parte', async () => {
    const sse = await open(base, `${path}/_events`);
    try {
      assert.equal((await sse.next())?.name, 'ready');
      const sent = await call('POST', `${path}/messages`, { clientId: 'c1', text: 'Cadastrar a Padaria Bom Dia' });
      assert.equal(sent.status, 200, JSON.stringify(sent.body));
      assert.equal(sent.body.data.clientId, 'c1');
      assert.equal(sent.body.data.direction, 'out');
      assert.equal(typeof sent.body.data.id, 'string');

      const final = await sse.until((e) => e.name === 'message' && e.data.message.ui?.length > 0);
      assert.ok(final, 'a resposta com a parte chegou');
      const { message } = final.data;
      assert.equal(message.conversationId, conv);
      assert.equal(message.direction, 'in');
      const [part] = message.ui;
      assert.equal(part.kind, 'c3.record');

      const ui = `${path}/messages/${encodeURIComponent(message.id)}/_ui/${encodeURIComponent(part.id)}`;
      assert.equal((await call('POST', ui, { action: 'decline' })).status, 204);
      assert.equal((await call('POST', ui, { action: 'decline' })).status, 409, 'parte já respondida');
      assert.equal((await call('POST', `${path}/messages/${encodeURIComponent(message.id)}/_ui/nada`, { action: 'accept' })).status, 404);
    } finally {
      sse.close();
    }
  });

  test('chat', 'histórico da mais antiga para a mais nova, com limit e before', async () => {
    const page = await call('GET', `${path}/messages`);
    assert.equal(page.status, 200, JSON.stringify(page.body));
    const { messages, hasMore } = page.body;
    assert.equal(hasMore, false);
    assert.ok(messages.length >= 2, 'a mensagem do usuário e a resposta');
    assert.equal(messages[0].clientId, 'c1');
    const one = await call('GET', `${path}/messages?limit=1&before=${encodeURIComponent(messages[1].id)}`);
    assert.deepEqual(one.body, { messages: [messages[0]], hasMore: false });
    assert.deepEqual((await call('GET', `/_chat/vazia-${tag}/messages`)).body, { messages: [], hasMore: false });
    assert.equal((await call('POST', `${path}/_stop`)).status, 204);
  });
}
