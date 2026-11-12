// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { memoryTransport } from '../adapters/memoryTransport';
import type { ChatTransport } from '../core/transport';
import type { Message } from '../core/types';
import useMessageWindow from './useMessageWindow';

const me = { id: 'me', name: 'Eu' };
const seed = Array.from({ length: 5 }, (_, i): Message => ({
  id: `s${i}`,
  conversationId: 'c1',
  author: { id: 'ana', name: 'Ana' },
  direction: 'in',
  text: `oi ${i}`,
  createdAt: new Date(Date.UTC(2026, 9, 30, 12, i)).toISOString()
}));

describe('useMessageWindow', () => {
  it('abre pelas mais recentes e sobe no histórico', async () => {
    const { transport } = memoryTransport(seed);
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me, pageSize: 2 }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    expect(result.current.messages.map((m) => m.id)).toEqual(['s3', 's4']);
    expect(result.current.hasMore).toBe(true);
    await act(() => result.current.loadOlder());
    await act(() => result.current.loadOlder());
    expect(result.current.messages.map((m) => m.id)).toEqual(['s0', 's1', 's2', 's3', 's4']);
    expect(result.current.hasMore).toBe(false);
  });

  it('envio otimista vira a mensagem do servidor, sem duplicar', async () => {
    const { transport } = memoryTransport(seed);
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me, newId: () => 'tmp1' }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    act(() => result.current.send('  olá  '));
    expect(result.current.messages.at(-1)).toMatchObject({ id: 'tmp1', status: 'sending', text: 'olá' });
    await waitFor(() => expect(result.current.messages.at(-1)?.status).toBe('sent'));
    expect(result.current.messages).toHaveLength(6);
    expect(result.current.messages.at(-1)).toMatchObject({ clientId: 'tmp1', id: 'm1' });
  });

  it('falha marca failed e retry reenvia', async () => {
    const mem = memoryTransport(seed);
    let fail = true;
    const transport: ChatTransport = { ...mem.transport, send: (m) => (fail ? Promise.reject(new Error('rede')) : mem.transport.send(m)) };
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me, newId: () => 'tmp1' }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    act(() => result.current.send('olá'));
    await waitFor(() => expect(result.current.messages.at(-1)?.status).toBe('failed'));
    fail = false;
    act(() => result.current.retry('tmp1'));
    await waitFor(() => expect(result.current.messages.at(-1)?.status).toBe('sent'));
    expect(result.current.messages).toHaveLength(6);
  });

  it('recebe eventos do transporte e ignora texto vazio', async () => {
    const { transport, emit } = memoryTransport(seed);
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    act(() => emit('c1', { type: 'message', message: { ...seed[0], id: 'novo', createdAt: '2026-10-30T13:00:00.000Z' } }));
    expect(result.current.messages.at(-1)?.id).toBe('novo');
    act(() => result.current.send('   '));
    expect(result.current.messages).toHaveLength(6);
  });

  it('responder a pergunta: mostra na hora e desfaz se o transporte falhar', async () => {
    const asked: Message = { ...seed[4], id: 'q', question: { id: 'q1', prompt: 'Removo?', options: [{ id: 'sim', label: 'Sim' }] } };
    const { transport } = memoryTransport([...seed.slice(0, 4), asked]);
    let fail = false;
    const answers: unknown[] = [];
    const withAnswer: ChatTransport = {
      ...transport,
      async answer(_c, id, a) {
        answers.push([id, a]);
        if (fail) throw new Error('fora do ar');
      }
    };
    const { result } = renderHook(() => useMessageWindow(withAnswer, 'c1', { me }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    await act(() => result.current.answer!('q', { optionIds: ['sim'] }));
    expect(result.current.messages.at(-1)?.question?.answer).toEqual({ optionIds: ['sim'] });
    expect(answers).toEqual([['q', { optionIds: ['sim'] }]]);

    fail = true;
    await act(() => result.current.answer!('q', { dismissed: true }));
    expect(result.current.messages.at(-1)?.question?.answer).toEqual({ optionIds: ['sim'] });
  });

  it('sem answer no transporte, não há como responder', async () => {
    const { transport } = memoryTransport(seed);
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me }));
    expect(result.current.answer).toBeUndefined();
  });
});

describe('useMessageWindow.answerUi', () => {
  const withPart: Message = {
    id: 'a1',
    conversationId: 'c1',
    author: { id: 'bot', name: 'Assistente' },
    direction: 'in',
    text: 'Preciso do motivo.',
    createdAt: new Date(Date.UTC(2026, 10, 3, 12)).toISOString(),
    ui: [{ id: 'p1', kind: 'c3.form', payload: { fields: [] } }]
  };

  it('marca na hora e o transporte recebe', async () => {
    const got: string[] = [];
    const { transport } = memoryTransport([withPart], { onAnswerUi: (_c, m, p, a) => got.push(`${m}/${p}/${a.action}`) });
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    let ok = false;
    await act(async () => {
      ok = await result.current.answerUi!('a1', 'p1', { action: 'accept', values: { motivo: 'atraso' } });
    });
    expect(ok).toBe(true);
    expect(got).toEqual(['a1/p1/accept']);
    expect(result.current.messages[0].ui![0]).toMatchObject({ state: 'submitted', result: { motivo: 'atraso' } });
  });

  it('falha no transporte volta a parte para pendente', async () => {
    const mem = memoryTransport([withPart]);
    const transport: ChatTransport = { ...mem.transport, answerUi: () => Promise.reject(new Error('rede')) };
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    let ok = true;
    await act(async () => {
      ok = await result.current.answerUi!('a1', 'p1', { action: 'decline' });
    });
    expect(ok).toBe(false);
    expect(result.current.messages[0].ui![0].state).toBeUndefined();
  });

  it('409: a parte já tinha sido substituída e o card fecha dizendo isso', async () => {
    const mem = memoryTransport([withPart]);
    const { result } = renderHook(() => useMessageWindow(mem.transport, 'c1', { me }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    // o servidor fechou a parte, mas o aviso ainda não chegou à tela
    mem.store[0] = { ...withPart, ui: [{ ...withPart.ui![0], state: 'cancelled', reason: 'superseded' }] };
    let ok = true;
    await act(async () => {
      ok = await result.current.answerUi!('a1', 'p1', { action: 'accept', values: { motivo: 'x' } });
    });
    expect(ok).toBe(false);
    expect(result.current.messages[0].ui![0]).toMatchObject({ state: 'cancelled', reason: 'superseded' });
  });

  it('409 sem a parte do servidor também fecha como substituída', async () => {
    const mem = memoryTransport([withPart]);
    const conflict = Object.assign(new Error('Conflict'), { status: 409 });
    const transport: ChatTransport = { ...mem.transport, answerUi: () => Promise.reject(conflict) };
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    await act(async () => {
      await result.current.answerUi!('a1', 'p1', { action: 'decline' });
    });
    expect(result.current.messages[0].ui![0]).toMatchObject({ state: 'cancelled', reason: 'superseded' });
  });

  it('resposta leva a versão; versão velha dá 409', async () => {
    const mem = memoryTransport([{ ...withPart, ui: [{ ...withPart.ui![0], version: 1 }] }]);
    await expect(mem.transport.answerUi!('c1', 'a1', 'p1', { action: 'accept', version: 0 })).rejects.toMatchObject({ status: 409 });
    await expect(mem.transport.answerUi!('c1', 'a1', 'p1', { action: 'accept', version: 1 })).resolves.toBeUndefined();
    await expect(mem.transport.answerUi!('c1', 'a1', 'p1', { action: 'accept', version: 1 })).rejects.toMatchObject({ status: 409 });
  });

  it('nova parte do assistente cancela a anterior e a mensagem digitada leva a pendente', async () => {
    const mem = memoryTransport([withPart]);
    const sent: unknown[] = [];
    const transport: ChatTransport = { ...mem.transport, send: (out) => (sent.push(out.pendingPart), mem.transport.send(out)) };
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me, newId: () => 'x1' }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    act(() => {
      mem.emit('c1', {
        type: 'message',
        message: { ...withPart, id: 'a2', createdAt: '2026-11-03T12:05:00.000Z', ui: [{ id: 'p2', kind: 'c3.form', payload: {} }] }
      });
    });
    expect(result.current.messages.map((m) => m.ui![0].state ?? 'pending')).toEqual(['cancelled', 'pending']);
    expect(mem.store[0].ui![0]).toMatchObject({ state: 'cancelled', reason: 'superseded' });
    await act(async () => result.current.send('esquece'));
    expect(sent).toEqual([{ messageId: 'a2', partId: 'p2', kind: 'c3.form', version: undefined }]);
    act(() => mem.cancelUi('c1', 'p2'));
    expect(result.current.messages[1].ui![0]).toMatchObject({ state: 'cancelled', reason: 'agent' });
  });

  it('sem answerUi no transporte fica undefined', async () => {
    const { transport } = memoryTransport([withPart]);
    const { answerUi: _, ...plain } = transport;
    const { result } = renderHook(() => useMessageWindow(plain, 'c1', { me }));
    expect(result.current.answerUi).toBeUndefined();
  });

  it('orientar manda steer e a mensagem fica pending; remover tira e, se falhar, volta', async () => {
    const mem = memoryTransport(seed);
    const sent: unknown[] = [];
    let fail = false;
    const transport: ChatTransport = {
      ...mem.transport,
      send: (m) => (sent.push(m), mem.transport.send(m)),
      remove: (c, id) => (fail ? Promise.reject(new Error('já leu')) : mem.transport.remove!(c, id))
    };
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me, newId: () => 'tmp1' }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    act(() => result.current.send('vá pelo norte', { steer: true }));
    expect(result.current.messages.at(-1)).toMatchObject({ id: 'tmp1', steer: 'pending', status: 'sending' });
    await waitFor(() => expect(result.current.messages.at(-1)?.status).toBe('sent'));
    expect(sent[0]).toMatchObject({ steer: true, text: 'vá pelo norte' });
    expect(result.current.messages.at(-1)).toMatchObject({ id: 'm1', steer: 'pending' });
    fail = true;
    await act(() => result.current.remove!('m1'));
    expect(result.current.messages.at(-1)?.id).toBe('m1');
    fail = false;
    await act(() => result.current.remove!('m1'));
    expect(result.current.messages.some((m) => m.id === 'm1')).toBe(false);
    await act(() => result.current.remove!('nada'));
    expect(result.current.messages).toHaveLength(5);
  });

  it('envio comum não leva steer; sem remove no transporte, remove é undefined', async () => {
    const mem = memoryTransport(seed);
    const sent: Record<string, unknown>[] = [];
    const transport: ChatTransport = { ...mem.transport, remove: undefined, send: (m) => (sent.push({ ...m }), mem.transport.send(m)) };
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    expect(result.current.remove).toBeUndefined();
    act(() => result.current.send('oi'));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect('steer' in sent[0]).toBe(false);
    expect(result.current.messages.at(-1)?.steer).toBeUndefined();
  });

  it('aviso do servidor aparece e some no dismiss', async () => {
    const { transport, emit } = memoryTransport(seed);
    const { result } = renderHook(() => useMessageWindow(transport, 'c1', { me }));
    await waitFor(() => expect(result.current.loading).toBeNull());
    act(() => emit('c1', { type: 'notice', conversationId: 'c1', text: 'O agente vai parar e responder.' }));
    expect(result.current.notice).toMatchObject({ text: 'O agente vai parar e responder.', tone: 'info' });
    act(() => result.current.dismissNotice());
    expect(result.current.notice).toBeNull();
  });
});
