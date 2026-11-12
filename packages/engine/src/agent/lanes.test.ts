import { describe, expect, it, vi } from 'vitest';

import { ApiError, type RawReply } from '../api';
import { BRANCH_ACTION, hasAside, laneActions, lanesApi, runLaneAction, type LanesApi, type WireLane } from './lanes';

const text = (t: string | { id: string; defaultMessage?: string }) => (typeof t === 'string' ? t : (t.defaultMessage ?? t.id));
const lane: WireLane = { id: 'l1', title: 'Quanto custa?', kind: 'aside', parentId: 'c1', unread: 0, updatedAt: '2026-11-12T10:00:00Z' };
const reply = (status: number, body: unknown): RawReply => ({
  status,
  contentType: 'application/json',
  body: body === undefined ? '' : JSON.stringify(body)
});

describe('laneActions', () => {
  it('com lanes: "Ramificar daqui" nas respostas e depois as declaradas', () => {
    const actions = laneActions(
      { lanes: {}, messageActions: [{ id: 'fixar', label: { id: 'x.fixar', defaultMessage: 'Fixar' }, when: { author: 'agent' } }] },
      text,
      'Ramificar daqui'
    );
    expect(actions).toEqual([
      { id: BRANCH_ACTION, label: 'Ramificar daqui', when: { direction: 'in' }, opens: 'branch' },
      { id: 'fixar', label: 'Fixar', when: { author: 'agent' }, opens: undefined }
    ]);
  });
  it('branch: false tira o ramo; sem lanes, só as declaradas', () => {
    expect(laneActions({ lanes: { branch: false } }, text, 'R')).toEqual([]);
    expect(laneActions({ messageActions: [{ id: 'a', label: 'A', opens: 'aside' }] }, text, 'R')).toEqual([
      { id: 'a', label: 'A', when: undefined, opens: 'aside' }
    ]);
    expect(laneActions({}, text, 'R')).toEqual([]);
  });
});

describe('hasAside', () => {
  it('só com lanes e sem aside: false', () => {
    expect(hasAside({ lanes: {} })).toBe(true);
    expect(hasAside({ lanes: { aside: true } })).toBe(true);
    expect(hasAside({ lanes: { aside: false } })).toBe(false);
    expect(hasAside({})).toBe(false);
  });
});

describe('lanesApi', () => {
  it('sem raw: sem o recurso', () => {
    expect(lanesApi({})).toBeUndefined();
  });

  it('lista, abre e chama a ação nas rotas da spec', async () => {
    const raw = vi
      .fn()
      .mockResolvedValueOnce(reply(200, { data: [{ ...lane, unread: undefined }] }))
      .mockResolvedValueOnce(reply(201, { data: { ...lane, kind: 'branch', fromMessageId: 'm/1' } }))
      .mockResolvedValueOnce(reply(200, { message: 'Fixada', lane }))
      .mockResolvedValueOnce(reply(200, {}));
    const api = lanesApi({ raw })!;
    expect(await api.list('c 1')).toEqual([lane]);
    expect(raw).toHaveBeenLastCalledWith('GET', '/_chat/c%201/_lanes', undefined);
    expect((await api.open('c1', { kind: 'branch', fromMessageId: 'm/1' })).kind).toBe('branch');
    expect(raw).toHaveBeenLastCalledWith('POST', '/_chat/c1/_lanes', JSON.stringify({ kind: 'branch', fromMessageId: 'm/1' }));
    expect(await api.act('c1', 'm/1', 'fixar')).toEqual({ message: 'Fixada', lane });
    expect(raw).toHaveBeenLastCalledWith('POST', '/_chat/c1/messages/m%2F1/_actions/fixar', undefined);
    expect(await api.act('c1', 'm1', 'fixar')).toEqual({ message: undefined, lane: undefined });
  });

  it('erro vira ApiError com o código do servidor, ou genérico', async () => {
    const raw = vi
      .fn()
      .mockResolvedValueOnce(reply(404, { code: 'not_found', message: 'Sem conversa' }))
      .mockResolvedValueOnce(reply(500, undefined))
      .mockResolvedValueOnce({ status: 502, contentType: 'application/json', body: 'null' })
      .mockResolvedValueOnce(reply(199, {}))
      .mockResolvedValueOnce(reply(300, {}));
    const api = lanesApi({ raw })!;
    const first = await api.list('c1').catch((e: unknown) => e);
    expect(first).toBeInstanceOf(ApiError);
    expect(first).toMatchObject({ status: 404, code: 'not_found', message: 'Sem conversa' });
    await expect(api.list('c1')).rejects.toMatchObject({ status: 500, code: 'internal', message: 'Erro 500.' });
    await expect(api.list('c1')).rejects.toMatchObject({ status: 502, code: 'internal', message: 'Erro 502.' });
    await expect(api.list('c1')).rejects.toMatchObject({ status: 199 });
    await expect(api.list('c1')).rejects.toMatchObject({ status: 300 });
  });

  it('2xx nas pontas da faixa passa', async () => {
    const raw = vi
      .fn()
      .mockResolvedValueOnce(reply(200, { data: [] }))
      .mockResolvedValueOnce(reply(299, { data: [] }));
    const api = lanesApi({ raw })!;
    await expect(api.list('c1')).resolves.toEqual([]);
    await expect(api.list('c1')).resolves.toEqual([]);
  });
});

describe('runLaneAction', () => {
  const api = (): LanesApi => ({
    list: vi.fn(),
    open: vi.fn().mockResolvedValue(lane),
    act: vi.fn().mockResolvedValue({ message: 'ok' })
  });
  const actions = laneActions(
    {
      lanes: {},
      messageActions: [
        { id: 'fixar', label: 'Fixar' },
        { id: 'perguntar', label: 'Perguntar', opens: 'aside' }
      ]
    },
    text,
    'R'
  );

  it('ramo: abre com a mensagem de origem', async () => {
    const a = api();
    expect(await runLaneAction(a, actions, 'c1', 'm1', BRANCH_ACTION)).toEqual({ lane });
    expect(a.open).toHaveBeenCalledWith('c1', { kind: 'branch', fromMessageId: 'm1' });
  });
  it('à parte declarada: abre aside citando a mensagem', async () => {
    const a = api();
    await runLaneAction(a, actions, 'c1', 'm1', 'perguntar');
    expect(a.open).toHaveBeenCalledWith('c1', { kind: 'aside', fromMessageId: 'm1' });
  });
  it('sem opens: ação do sistema', async () => {
    const a = api();
    expect(await runLaneAction(a, actions, 'c1', 'm1', 'fixar')).toEqual({ message: 'ok' });
    expect(a.act).toHaveBeenCalledWith('c1', 'm1', 'fixar');
    expect(a.open).not.toHaveBeenCalled();
  });
  it('ação fora da lista: nada', async () => {
    const a = api();
    expect(await runLaneAction(a, actions, 'c1', 'm1', 'outra')).toBeUndefined();
    expect(a.act).not.toHaveBeenCalled();
  });
});
