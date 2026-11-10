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

describe('progress (ação em etapas, #53)', () => {
  const steps = { ...action, steps: true } as Action;
  const stepped = (outcome: Parameters<typeof buildReply>[3]) => buildReply(() => true, entity, steps, outcome);

  it('vai no JSON com o cursor só no meio da rodada', () => {
    expect(stepped({ message: '2 de 5', progress: { total: 5, done: 2, cursor: 2 } })).toMatchObject({
      body: { progress: { total: 5, done: 2, cursor: 2 } }
    });
    expect(stepped({ progress: { total: 5, done: 5, cursor: 9 } })).toMatchObject({
      body: { progress: { total: 5, done: 5, cursor: null } }
    });
  });

  it('sem steps, sem cursor no meio ou done passando do total é erro do sistema', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => reply({ progress: { total: 5, done: 5 } })).toThrow();
    expect(() => stepped({ progress: { total: 5, done: 2 } })).toThrow();
    expect(() => stepped({ progress: { total: 2, done: 3, cursor: 1 } })).toThrow();
    expect(() => stepped({ progress: { total: 2.5, done: 1, cursor: 1 } })).toThrow();
  });
});
