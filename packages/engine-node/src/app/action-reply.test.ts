// `link` na resposta da ação (#31): só endereço web ou do próprio servidor, e nunca junto com `open`.
import { describe, expect, it, vi } from 'vitest';

import type { Action } from '../domain/action-spec';
import type { Entity } from '../domain/entity';
import { buildReply } from './action-reply';

const entity = { name: 'app' } as Entity;
const action = { name: 'baixar', returnsFile: false } as Action;
const reply = (outcome: Parameters<typeof buildReply>[3]) => buildReply(() => true, entity, action, outcome);

describe('link', () => {
  it('vai no JSON quando é http(s):// ou caminho do servidor', () => {
    expect(reply({ link: 'https://releases.exemplo.com/pdv.exe' })).toEqual({
      kind: 'json',
      body: { message: null, link: 'https://releases.exemplo.com/pdv.exe' }
    });
    expect(reply({ message: 'Baixando.', link: '/downloads/kds.msi' })).toMatchObject({ body: { link: '/downloads/kds.msi' } });
  });

  it('outro formato, ou junto com open, é erro do sistema', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const bad of ['javascript:alert(1)', '//outro.com/x', 'data:text/html,oi']) expect(() => reply({ link: bad })).toThrow();
    expect(() => reply({ link: '/x', open: { id: '1' } })).toThrow();
  });
});
