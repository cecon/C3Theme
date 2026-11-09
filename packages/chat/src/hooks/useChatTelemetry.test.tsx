// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TaskOf } from '../core/telemetry';
import type { Message } from '../core/types';
import useChatTelemetry from './useChatTelemetry';

const taskOf: TaskOf = () => ({ entity: 'cliente', op: 'create' });
const msg = (conversationId: string, state: 'pending' | 'submitted'): Message => ({
  id: `m-${conversationId}`,
  conversationId,
  author: { id: 'ia', name: 'Assistente' },
  direction: 'in',
  ui: [{ id: `p-${conversationId}`, kind: 'c3.record', payload: {}, state }],
  createdAt: new Date().toISOString()
});

describe('useChatTelemetry', () => {
  it('emite pela porta e ignora mensagens de outra conversa', () => {
    const port = vi.fn();
    const { rerender } = renderHook(({ id, messages }) => useChatTelemetry(id, messages, port, taskOf), {
      initialProps: { id: 'c1', messages: [msg('c1', 'pending')] }
    });
    rerender({ id: 'c1', messages: [msg('c1', 'submitted')] });
    rerender({ id: 'c2', messages: [msg('c1', 'pending')] });
    expect(port.mock.calls.map((c) => [c[0].type, c[0].taskId])).toEqual([
      ['task.start', 'p-c1'],
      ['task.done', 'p-c1']
    ]);
  });

  it('erro na porta não quebra', () => {
    const port = () => {
      throw new Error('fora');
    };
    expect(() => renderHook(() => useChatTelemetry('c1', [msg('c1', 'pending')], port, taskOf))).not.toThrow();
  });
});
