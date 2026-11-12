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

  test('chat', 'conversas filhas: ramo copia até a origem, à parte não copia e enviar não altera a principal', async () => {
    const before = (await call('GET', `${path}/messages`)).body.messages;
    const branch = await call('POST', `${path}/_lanes`, { kind: 'branch', fromMessageId: before[0].id });
    assert.equal(branch.status, 201, JSON.stringify(branch.body));
    assert.equal(branch.body.data.parentId, conv);
    const childPath = `/_chat/${branch.body.data.id}`;
    const copy = (await call('GET', `${childPath}/messages`)).body.messages;
    assert.deepEqual(
      copy.map((m) => m.id),
      [before[0].id],
      'somente o histórico até a origem'
    );
    assert.equal((await call('POST', `${childPath}/messages`, { clientId: 'filha', text: 'uma pergunta filha' })).status, 200);
    const after = (await call('GET', `${path}/messages`)).body.messages;
    assert.ok(!after.some((m) => m.clientId === 'filha'), 'o envio ficou somente na filha');
    const aside = await call('POST', `${path}/_lanes`, { kind: 'aside', text: 'pergunta sem histórico' });
    assert.equal(aside.status, 201);
    const asideMessages = (await call('GET', `/_chat/${aside.body.data.id}/messages`)).body.messages;
    assert.equal(asideMessages[0].text, 'pergunta sem histórico');
    assert.ok(!asideMessages.some((m) => m.id === before[0].id));
    const list = (await call('GET', `${path}/_lanes`)).body.data;
    assert.ok(list.some((l) => l.id === branch.body.data.id));
    assert.ok(list.some((l) => l.id === aside.body.data.id));
    assert.deepEqual((await call('GET', `/_chat/sem-filhas-${tag}/_lanes`)).body.data, []);
    const otherUser = { headers: { authorization: 'Bearer reader' } };
    const hidden = await fetch(base + `${childPath}/messages`, otherUser);
    assert.equal(hidden.status, 200);
    assert.deepEqual((await hidden.json()).messages, [], 'histórico da filha não atravessa usuários');
    const hiddenLanes = await fetch(base + `${path}/_lanes`, otherUser);
    assert.deepEqual((await hiddenLanes.json()).data, [], 'a lista não atravessa usuários');
    assert.equal((await call('POST', `${path}/_lanes`, { kind: 'branch', fromMessageId: 'outra-conversa' })).status, 400);
    assert.equal((await call('POST', `${path}/_lanes`, { kind: 'branch' })).status, 400);
  });

  test('chat', 'orientar: lida no meio da resposta e respondida no fim; a que espera sai pelo DELETE; sem turno, aviso', async () => {
    const steerPath = `/_chat/${conv}-orienta`;
    const sse = await open(base, `${steerPath}/_events`);
    try {
      assert.equal((await sse.next())?.name, 'ready');
      assert.equal((await call('POST', `${steerPath}/messages`, { clientId: 'o1', text: 'Relatório de vendas do mês' })).status, 200);
      const gone = await call('POST', `${steerPath}/messages`, { clientId: 'o2', text: 'esquece', steer: true });
      assert.equal(gone.body.data.steer, 'pending', JSON.stringify(gone.body));
      const goneUri = `${steerPath}/messages/${encodeURIComponent(gone.body.data.id)}`;
      assert.equal((await call('DELETE', goneUri)).status, 204);
      assert.equal((await call('DELETE', goneUri)).status, 404);
      const kept = await call('POST', `${steerPath}/messages`, { clientId: 'o3', text: 'só o mês atual', steer: true });
      assert.equal(kept.body.data.steer, 'pending');
      const removed = await sse.until((e) => e.name === 'removed');
      assert.equal(removed?.data.id, gone.body.data.id);
      const taken = await sse.until((e) => e.name === 'message' && e.data.message.id === kept.body.data.id);
      assert.equal(taken?.data.message.steer, 'taken', 'o agente leu no meio da resposta');
      assert.equal((await call('DELETE', `${steerPath}/messages/${encodeURIComponent(kept.body.data.id)}`)).status, 409);
      const answered = await sse.until((e) => e.name === 'message' && e.data.message.text?.includes('só o mês atual'));
      assert.ok(answered, 'a orientação foi respondida no fim');
      const history = (await call('GET', `${steerPath}/messages?limit=100`)).body.messages;
      assert.ok(!history.some((m) => m.id === gone.body.data.id), 'a removida saiu do histórico');
      assert.equal(history.find((m) => m.id === kept.body.data.id)?.steer, 'taken');
    } finally {
      sse.close();
    }
    const idlePath = `/_chat/${conv}-parado`;
    const idle = await open(base, `${idlePath}/_events`);
    try {
      assert.equal((await idle.next())?.name, 'ready');
      const sent = await call('POST', `${idlePath}/messages`, { clientId: 'p1', text: 'oi', steer: true });
      assert.equal(sent.status, 200);
      assert.equal(sent.body.data.steer, undefined, 'sem turno, vai como mensagem comum');
      const notice = await idle.until((e) => e.name === 'notice');
      assert.equal(typeof notice?.data.text, 'string');
      assert.equal(notice?.data.conversationId, `${conv}-parado`);
    } finally {
      idle.close();
    }
    assert.equal((await call('POST', `${idlePath}/messages`, { clientId: 'p2', text: 'oi', steer: 'sim' })).status, 400);
  });
}
