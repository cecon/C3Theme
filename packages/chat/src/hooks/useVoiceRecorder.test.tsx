// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import useVoiceRecorder, { type RecorderDevice } from './useVoiceRecorder';

const fake = (deny = false): RecorderDevice => ({
  start: () => (deny ? Promise.reject(new Error('NotAllowed')) : Promise.resolve()),
  stop: () => Promise.resolve(new Blob(['ogg'], { type: 'audio/ogg' })),
  cancel: vi.fn()
});

describe('useVoiceRecorder', () => {
  it('sem microfone no navegador fica unsupported', () => {
    const { result } = renderHook(() => useVoiceRecorder());
    expect(result.current.state).toBe('unsupported');
  });

  it('grava e devolve o áudio', async () => {
    const device = fake();
    const { result } = renderHook(() => useVoiceRecorder({ device: () => device }));
    await act(() => result.current.start());
    expect(result.current.state).toBe('recording');
    let audio: Blob | null = null;
    await act(async () => {
      audio = await result.current.stop();
    });
    expect(audio!.type).toBe('audio/ogg');
    expect(result.current.state).toBe('idle');
  });

  it('permissão negada vira denied', async () => {
    const device = fake(true);
    const { result } = renderHook(() => useVoiceRecorder({ device: () => device }));
    await act(() => result.current.start());
    expect(result.current.state).toBe('denied');
  });
});
