// @vitest-environment jsdom
// Autorização de outro usuário (#48): o transporte reenvia o mesmo pedido com o cabeçalho; o diálogo pede os campos.
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EngineProvider } from '../context';
import { AUTHORIZATION_HEADER, authorizingFetch, encodeAuthorization } from './fetch';
import { useAuthorization } from './useAuthorization';

afterEach(cleanup);

const refuse = (code: string, message: string, status = 409) =>
  new Response(JSON.stringify({ error: { code, message } }), { status, headers: { 'content-type': 'application/json' } });
const ok = () => new Response('{"data":{}}', { status: 200, headers: { 'content-type': 'application/json' } });
const decode = (v: string) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(v), (c) => c.charCodeAt(0))));

describe('authorizingFetch', () => {
  it('reenvia o mesmo pedido com o cabeçalho; recusa nova volta ao diálogo com a mensagem', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(refuse('orcamento_excedido', 'Passou do orçado.'))
      .mockResolvedValueOnce(refuse('senha_invalida', 'Senha errada.', 403))
      .mockResolvedValueOnce(ok());
    const ask = vi.fn().mockResolvedValue({ usuario: 'ana', senha: 'x', motivo: 'liberação' });
    const res = await authorizingFetch(
      fetch,
      () => ['orcamento_excedido'],
      ask
    )('/api/x', {
      method: 'POST',
      body: '{"a":1}',
      headers: { 'content-type': 'application/json' }
    });
    expect(res.status).toBe(200);
    expect(ask.mock.calls.map((c) => c[0])).toEqual([
      { code: 'orcamento_excedido', message: 'Passou do orçado.', error: undefined },
      { code: 'orcamento_excedido', message: 'Passou do orçado.', error: 'Senha errada.' }
    ]);
    const [, init] = fetch.mock.calls[2];
    expect(init.body).toBe('{"a":1}');
    expect(init.headers['content-type']).toBe('application/json');
    expect(decode(init.headers[AUTHORIZATION_HEADER])).toEqual({ usuario: 'ana', senha: 'x', motivo: 'liberação' });
  });

  it('código que não é da lista, sucesso e cancelar devolvem a resposta como veio', async () => {
    const other = refuse('outro', 'x');
    const plain = authorizingFetch(vi.fn().mockResolvedValue(other), () => ['orcamento_excedido'], vi.fn());
    expect(await plain('/a')).toBe(other);
    const first = refuse('orcamento_excedido', 'y');
    const cancel = authorizingFetch(
      vi.fn().mockResolvedValue(first),
      () => ['orcamento_excedido'],
      async () => null
    );
    expect(await cancel('/a')).toBe(first);
    // outro erro na nova tentativa (422 de campo) vai para a tela
    const field = refuse('invalid', 'Campo.', 422);
    const f = vi.fn().mockResolvedValueOnce(refuse('orcamento_excedido', 'y')).mockResolvedValueOnce(field);
    expect(
      await authorizingFetch(
        f,
        () => ['orcamento_excedido'],
        async () => ({ a: 'b' })
      )('/a')
    ).toBe(field);
    expect(encodeAuthorization({ a: 'ç' })).toBe(btoa(unescape(encodeURIComponent('{"a":"ç"}'))));
  });
});

describe('diálogo', () => {
  const config = {
    codes: ['orcamento_excedido'],
    fields: [
      { name: 'usuario', label: 'Usuário' },
      { name: 'senha', label: 'Senha', type: 'password' as const },
      { name: 'motivo', label: 'Motivo', type: 'text' as const, minLength: 5 }
    ]
  };
  const value = { client: {} as never, app: { name: 'x' } as never, entities: {}, components: {} };

  it('mostra a mensagem, pede os campos, exige o mínimo e devolve os valores', async () => {
    const { result } = renderHook(() => useAuthorization(config));
    const Dialog = () => <>{result.current.dialog}</>;
    const { rerender } = render(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={value}>
          <Dialog />
        </EngineProvider>
      </IntlProvider>
    );
    expect(result.current.codes()).toEqual(['orcamento_excedido']);
    let answer: Promise<Record<string, string> | null>;
    act(() => {
      answer = result.current.ask({ code: 'orcamento_excedido', message: 'Passou do orçado.' });
    });
    rerender(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={value}>
          <Dialog />
        </EngineProvider>
      </IntlProvider>
    );
    expect(await screen.findByText('Passou do orçado.')).toBeTruthy();
    expect((screen.getByLabelText(/Senha/) as HTMLInputElement).type).toBe('password');
    fireEvent.change(screen.getByLabelText(/Usuário/), { target: { value: 'ana' } });
    fireEvent.change(screen.getByLabelText(/Senha/), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: 'curto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Autorizar' }));
    await expect(answer!).resolves.toEqual({ usuario: 'ana', senha: '123', motivo: 'curto' });
  });
});
