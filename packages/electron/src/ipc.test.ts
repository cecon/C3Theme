import { describe, expect, it, vi } from 'vitest';

import { fakeIpc } from './fakeIpc.test-util';
import { forwardTo, resolveInside } from './forward';
import { createC3Bridge, exposeC3Bridge } from './preload';
import { ipcFetch } from './renderer';
import { fromPage, serveC3, type C3Handler } from './serve';

const allow = fromPage('file:///app/dist/index.html');

function wire(handler: C3Handler) {
  const { ipcMain, ipcRenderer, listeners } = fakeIpc();
  const stop = serveC3(ipcMain, handler, { allow });
  return { fetch: ipcFetch(createC3Bridge(ipcRenderer)), stop, listeners };
}

describe('renderer → preload → main', () => {
  it('leva método, caminho, cabeçalhos e corpo, e devolve a Response', async () => {
    const seen: unknown[] = [];
    const send = vi.fn(async (url: string, init: RequestInit) => {
      seen.push({ url, method: init.method, headers: init.headers, body: init.body });
      return Response.json({ data: { ok: true } }, { status: 201, headers: { 'c3-message': 'feito' } });
    });
    const { fetch } = wire(forwardTo('https://erp.exemplo.com/api', { fetch: send }));
    const res = await fetch('/clientes?page=2', { method: 'post', headers: { Authorization: 'Bearer t' }, body: '{"a":1}' });
    expect(res.status).toBe(201);
    expect(res.headers.get('c3-message')).toBe('feito');
    expect(await res.json()).toEqual({ data: { ok: true } });
    expect(seen).toEqual([
      { url: 'https://erp.exemplo.com/api/clientes?page=2', method: 'POST', headers: { authorization: 'Bearer t' }, body: '{"a":1}' }
    ]);
  });

  it('204 volta sem corpo e arquivo volta em bytes', async () => {
    const bytes = new Uint8Array([0, 1, 2, 255]);
    const { fetch } = wire(async (req) =>
      req.method === 'DELETE'
        ? new Response(null, { status: 204 })
        : new Response(bytes, { headers: { 'content-type': 'application/pdf' } })
    );
    expect((await fetch('/x/1', { method: 'DELETE' })).status).toBe(204);
    const file = await fetch('/x/1/_files/doc');
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes);
  });

  it('backend fora do ar vira erro de rede (o cliente mostra "Sem conexão")', async () => {
    const { fetch } = wire(async () => {
      throw new TypeError('fetch failed');
    });
    await expect(fetch('/_meta/app')).rejects.toThrow('fetch failed');
  });

  it('recusa caminho que sai da API sem chamar o backend', async () => {
    const send = vi.fn();
    const { fetch } = wire(forwardTo('http://127.0.0.1:3000/api', { fetch: send }));
    await expect(fetch('/../admin')).rejects.toThrow('caminho fora da API');
    await expect(fetch('/%2e%2e/admin')).rejects.toThrow('caminho fora da API');
    await expect(fetch('/http://evil.com/x')).rejects.toThrow('caminho fora da API');
    expect(send).not.toHaveBeenCalled();
  });

  it('barras repetidas continuam dentro da API', () => {
    expect(resolveInside('http://127.0.0.1:3000/api', '//evil.com/x')).toBe('http://127.0.0.1:3000/api/evil.com/x');
  });

  it('recusa pedido malformado vindo do renderer', async () => {
    const { ipcMain, ipcRenderer } = fakeIpc();
    serveC3(ipcMain, async () => new Response('x'), { allow });
    await expect(ipcRenderer.invoke('c3:request', { method: 'TRACE', path: '/x', headers: {} })).rejects.toThrow('pedido inválido');
    await expect(ipcRenderer.invoke('c3:request', { method: 'GET', path: 'x', headers: {} })).rejects.toThrow('pedido inválido');
  });

  it('cabeçalhos do main vão por cima dos do renderer', async () => {
    const send = vi.fn(async () => new Response('{}'));
    const { fetch } = wire(forwardTo(() => 'http://h/api', { fetch: send, headers: () => ({ 'x-device': 'pdv-1' }) }));
    await fetch('/a', { headers: { 'x-device': 'falso' } });
    expect((send.mock.calls[0] as unknown[])[1]).toMatchObject({ headers: { 'x-device': 'pdv-1' } });
  });
});

describe('quem chama e o que passa', () => {
  it('outra página (ou sem frame) não chega ao handler, nem em fluxo', async () => {
    for (const url of ['https://site-externo.com/', 'file:///app/dist/outra.html', null]) {
      const { ipcMain, ipcRenderer } = fakeIpc(url);
      const handler = vi.fn(async () => new Response('{}'));
      serveC3(ipcMain, handler, { allow });
      const fetch = ipcFetch(createC3Bridge(ipcRenderer));
      await expect(fetch('/_meta/app')).rejects.toThrow('origem não autorizada');
      await expect(fetch('/a/_events', { signal: new AbortController().signal })).rejects.toThrow('origem não autorizada');
      expect(handler).not.toHaveBeenCalled();
    }
  });

  it('letra do drive no Windows em caixa diferente é a mesma página', () => {
    const win = fromPage('file:///C:/App/dist/index.html');
    const call = (url: string) => win({ sender: { id: 1, send: () => {} }, senderFrame: { url } });
    expect(call('file:///c:/App/dist/index.html#/x')).toBe(true);
    expect(call('file:///c:/app/dist/index.html')).toBe(false);
  });

  it('a página do app com rota e busca passa', () => {
    expect(allow({ sender: { id: 1, send: () => {} }, senderFrame: { url: 'file:///app/dist/index.html?x=1#/pedidos/2' } })).toBe(true);
  });

  it('só os cabeçalhos do contrato chegam ao backend', async () => {
    const send = vi.fn(async () => new Response('{}'));
    const { fetch } = wire(forwardTo('http://h/api', { fetch: send }));
    await fetch('/a', {
      method: 'PATCH',
      body: '{}',
      headers: {
        Authorization: 'Bearer t',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'If-Match': '"v1"',
        'C3-Branch': 'f1',
        'C3-Undo': 'true',
        Cookie: 'sessao=roubada',
        'X-Forwarded-For': '10.0.0.1',
        Host: 'interno'
      }
    });
    expect((send.mock.calls[0] as unknown[])[1]).toMatchObject({
      headers: {
        authorization: 'Bearer t',
        'content-type': 'application/json',
        accept: 'application/json',
        'if-match': '"v1"',
        'c3-branch': 'f1',
        'c3-undo': 'true'
      }
    });
    expect(Object.keys(((send.mock.calls[0] as unknown[])[1] as RequestInit).headers as object)).toHaveLength(6);
  });
});

describe('fluxo (tempo real)', () => {
  const sse = (signal: AbortSignal) => {
    let timer: ReturnType<typeof setInterval>;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        const enc = new TextEncoder();
        c.enqueue(enc.encode('event: ready\ndata: {}\n\n'));
        let n = 0;
        timer = setInterval(() => c.enqueue(enc.encode(`event: change\ndata: {"change":"updated","id":"${++n}"}\n\n`)), 5);
        signal.addEventListener('abort', () => {
          clearInterval(timer);
          c.error(new DOMException('abortado', 'AbortError'));
        });
      }
    });
    return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
  };

  it('entrega os pedaços em ordem e abortar cancela no main', async () => {
    let mainSignal: AbortSignal | undefined;
    const { fetch } = wire(async (_req, signal) => ((mainSignal = signal), sse(signal)));
    const ctrl = new AbortController();
    const res = await fetch('/pedidos/_events', { headers: { accept: 'text/event-stream' }, signal: ctrl.signal });
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let text = '';
    while (!text.includes('"id":"2"')) text += dec.decode((await reader.read()).value);
    expect(text.startsWith('event: ready')).toBe(true);
    ctrl.abort();
    await expect(reader.read()).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(mainSignal?.aborted).toBe(true));
  });

  it('fluxo que acaba fecha o corpo; erro antes da resposta rejeita', async () => {
    const ok = wire(async () => new Response('event: ready\ndata: {}\n\n'));
    const res = await ok.fetch('/a/_events', { signal: new AbortController().signal });
    expect(await res.text()).toBe('event: ready\ndata: {}\n\n');
    const bad = wire(async () => {
      throw new Error('recusado');
    });
    await expect(bad.fetch('/a/_events', { signal: new AbortController().signal })).rejects.toThrow('recusado');
  });

  it('desligar o main tira os canais', () => {
    const { stop, listeners } = wire(async () => new Response(''));
    expect(listeners('c3:stream')).toBe(1);
    stop();
    expect(listeners('c3:stream')).toBe(0);
  });
});

describe('exposeC3Bridge', () => {
  it('põe a ponte no window com a chave escolhida', () => {
    const exposed: Record<string, unknown> = {};
    exposeC3Bridge({ exposeInMainWorld: (k, api) => (exposed[k] = api) }, fakeIpc().ipcRenderer, 'erp');
    expect(Object.keys(exposed)).toEqual(['erp']);
    expect(typeof (exposed.erp as { request: unknown }).request).toBe('function');
  });
});
