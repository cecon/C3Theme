// Ação da lista (spec/README.md, "Ação da lista"): sem registro, em POST /{entity}/_actions/{action} com { input }.
// No exemplo: aplicar uma jornada a todos os vendedores de um canal, na filial ativa.

import assert from 'node:assert/strict';

const fieldCodes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

export function listActionTests({ test, as, tag }) {
  const apply = (user, branch, body) => as(user, branch).post('/seller/_actions/apply_schedule', body);

  test('ações', 'ação da lista: roda sem registro, na filial ativa, e devolve a mensagem do sistema', async () => {
    const seller = async (channel, branch = 1) =>
      (await as(null, branch).post('/seller', { name: `Jornada ${channel} ${tag}`, channel, work_days: 2 })).body.data;
    const [loja, pista, outra] = [await seller('LOJA'), await seller('PISTA'), await seller('LOJA', 2)];
    assert.equal((await as(null, 1).get('/_meta/entities/seller')).body.capabilities.actions.apply_schedule, true);
    const res = await apply(null, 1, { input: { channel: 'LOJA', work_days: 126 } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.match(res.body.message, /Jornada aplicada/);
    const days = async (s, branch = 1) => (await as(null, branch).get(`/seller/${s.id}`)).body.data.work_days;
    assert.equal(await days(loja), 126);
    assert.equal(await days(pista), 2, 'outro canal não muda');
    assert.equal(await days(outra, 2), 2, 'outra filial não muda');
  });

  test('ações', 'ação da lista: input validado (422), sem permissão (403), corpo de lote (400) e rota de registro (404)', async () => {
    assert.deepEqual(fieldCodes(await apply(null, 1, { input: { work_days: 2 } }), 'channel'), ['required']);
    assert.equal((await apply('ana', 2, { input: { channel: 'LOJA', work_days: 2 } })).status, 403);
    assert.equal((await apply(null, 1, { ids: ['1'], input: { channel: 'LOJA', work_days: 2 } })).status, 400);
    assert.equal((await as(null, 1).post('/seller/1/_actions/apply_schedule', {})).status, 404);
  });

  test('ações', 'ação da lista em etapas: progress a cada chamada, cursor de volta até done == total', async () => {
    const review = (body) => as(null, 1).post('/seller/_actions/review', body);
    const seen = [];
    let cursor;
    for (let i = 0; i < 10; i++) {
      const res = await review(cursor === undefined ? { input: {} } : { input: {}, cursor });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      const { total, done, cursor: next } = res.body.progress;
      seen.push(`${done}/${total}`);
      assert.equal(typeof res.body.message, 'string');
      if (done === total) {
        assert.equal(next, null, 'a última etapa não manda cursor');
        break;
      }
      cursor = next;
    }
    assert.deepEqual(seen, ['2/5', '4/5', '5/5']);
    // cursor só vale na ação em etapas: nas outras é campo desconhecido
    assert.equal((await apply(null, 1, { input: { channel: 'LOJA', work_days: 2 }, cursor: 1 })).status, 400);
  });
}
