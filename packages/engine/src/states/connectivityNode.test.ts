// Sem navegador (SSR, Node): a porta padrão diz on-line e não assina nada.
import { describe, expect, it, vi } from 'vitest';

import { browserConnectivity } from './connectivity';

describe('browserConnectivity fora do navegador', () => {
  it('sempre on-line e o cancelamento não quebra', () => {
    expect(browserConnectivity.online()).toBe(true);
    const change = vi.fn();
    browserConnectivity.subscribe(change)();
    expect(change).not.toHaveBeenCalled();
  });
});
