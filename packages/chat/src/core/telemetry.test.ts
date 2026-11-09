import { describe, expect, it } from 'vitest';

import { newTaskWatch, watchTasks, type TaskOf } from './telemetry';
import type { Message } from './types';
import type { UiPart } from './ui';

const taskOf: TaskOf = (p) => (p.kind === 'c3.record' ? { entity: 'cliente', op: 'create', fields: 2 } : null);
const at = (s: number) => new Date(Date.UTC(2026, 10, 4, 12, 0, s)).toISOString();
const user = (id: string, s: number): Message => ({
  id,
  conversationId: 'c1',
  author: { id: 'u', name: 'Ana' },
  direction: 'out',
  text: 'oi',
  createdAt: at(s)
});
const bot = (id: string, s: number, ui: UiPart[]): Message => ({
  id,
  conversationId: 'c1',
  author: { id: 'ia', name: 'Assistente' },
  direction: 'in',
  ui,
  createdAt: at(s)
});
const part = (state: UiPart['state'], kind = 'c3.record'): UiPart => ({ id: 'p1', kind, payload: {}, state });
const now = (s: number) => Date.parse(at(s));

describe('telemetria do chat', () => {
  it('começa quando a parte aparece e termina ao gravar, contando do pedido', () => {
    const watch = newTaskWatch();
    const msgs = [user('m1', 0), bot('m2', 5, [part('pending')])];
    expect(watchTasks(watch, msgs, taskOf, now(6))).toEqual([
      { type: 'task.start', taskId: 'p1', channel: 'chat', entity: 'cliente', op: 'create', fields: 2 }
    ]);
    expect(watchTasks(watch, msgs, taskOf, now(7))).toEqual([]);
    const after = [user('m1', 0), bot('m2', 5, [part('submitted')]), user('m3', 20)];
    expect(watchTasks(watch, after, taskOf, now(30))).toEqual([
      { type: 'task.done', taskId: 'p1', channel: 'chat', entity: 'cliente', op: 'create', fields: 2, turns: 2, ms: 30_000 }
    ]);
  });

  it('recusar é abandono; o pedido é a primeira mensagem desde a parte anterior', () => {
    const watch = newTaskWatch();
    const old = { ...part('submitted'), id: 'p0' };
    const msgs = [user('m0', 0), bot('m1', 2, [old]), user('m2', 10), user('m3', 12), bot('m4', 15, [part('pending')])];
    expect(watchTasks(watch, msgs, taskOf, now(16)).map((e) => e.type)).toEqual(['task.start']);
    msgs[4] = bot('m4', 15, [part('declined')]);
    expect(watchTasks(watch, msgs, taskOf, now(20))).toMatchObject([{ type: 'task.abandon', turns: 2, ms: 10_000 }]);
  });

  it('histórico já fechado e parte que não é tarefa não geram nada', () => {
    const watch = newTaskWatch();
    expect(watchTasks(watch, [bot('m1', 0, [part('submitted')])], taskOf, now(1))).toEqual([]);
    expect(watchTasks(newTaskWatch(), [bot('m1', 0, [part('pending', 'c3.form')])], taskOf, now(1))).toEqual([]);
  });

  it('parte que venceu sem resposta é abandono', () => {
    const watch = newTaskWatch();
    const p = { ...part('pending'), expiresAt: at(10) };
    watchTasks(watch, [bot('m1', 0, [p])], taskOf, now(1));
    expect(watchTasks(watch, [bot('m1', 0, [p])], taskOf, now(11))).toMatchObject([{ type: 'task.abandon' }]);
  });
});
