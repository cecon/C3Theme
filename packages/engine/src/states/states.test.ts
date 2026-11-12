// @vitest-environment jsdom
// Regras puras dos estados da tela (#99) e a porta de conexão do navegador.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../apiError';
import { browserConnectivity } from './connectivity';
import { countOf, probeState, stateOfError } from './states';

afterEach(() => vi.restoreAllMocks());

describe('stateOfError', () => {
  it('403 é sem permissão, status 0 é offline, o resto é erro', () => {
    expect(stateOfError(new ApiError(403, 'forbidden', 'x'))).toBe('forbidden');
    expect(stateOfError(new ApiError(0, 'network', 'x'))).toBe('offline');
    expect(stateOfError(new ApiError(500, 'internal', 'x'))).toBe('error');
    expect(stateOfError(new ApiError(404, 'not_found', 'x'))).toBe('error');
    expect(stateOfError(new Error('quebrou'))).toBe('error');
  });
});

describe('probeState', () => {
  it('sem dado nem erro é carregando; zero é vazio; mais que zero é pronta', () => {
    expect(probeState({})).toBe('loading');
    expect(probeState({ data: 0 })).toBe('empty');
    expect(probeState({ data: 1 })).toBe('ready');
  });

  it('a falha vence o dado antigo', () => {
    expect(probeState({ data: 5, error: new ApiError(403, 'forbidden', 'x') })).toBe('forbidden');
    expect(probeState({ error: new ApiError(0, 'network', 'x') })).toBe('offline');
  });
});

describe('countOf', () => {
  it('lê o valor da contagem sem agrupar, em número', () => {
    expect(countOf([{ value: 7 }])).toBe(7);
    expect(countOf([{ value: '12' }])).toBe(12);
    expect(countOf([])).toBe(0);
  });
});

describe('browserConnectivity', () => {
  it('lê navigator.onLine', () => {
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(browserConnectivity.online()).toBe(false);
    spy.mockReturnValue(true);
    expect(browserConnectivity.online()).toBe(true);
  });

  it('avisa as mudanças pelos eventos online/offline até cancelar', () => {
    const change = vi.fn();
    const stop = browserConnectivity.subscribe(change);
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    expect(change.mock.calls).toEqual([[false], [true]]);
    stop();
    window.dispatchEvent(new Event('offline'));
    expect(change).toHaveBeenCalledTimes(2);
  });
});
