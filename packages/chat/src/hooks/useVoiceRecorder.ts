import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'denied' | 'unsupported';

/** Porta do gravador: o padrão usa o microfone do navegador; testes e apps nativos passam o seu. */
export interface RecorderDevice {
  start(): Promise<void>;
  /** Para e devolve o áudio. */
  stop(): Promise<Blob>;
  /** Para e descarta. */
  cancel(): void;
}

export interface UseVoiceRecorderOptions {
  /** Corta sozinho neste tempo. Padrão: 5 minutos. */
  maxMs?: number;
  /** Chamado com o áudio quando o corte é automático (o `stop` manual já devolve o áudio). */
  onAutoStop?: (audio: Blob) => void;
  device?: () => RecorderDevice | null;
}

/**
 * Gravação de áudio para mensagem de voz: `start`, `stop` (devolve o Blob) e `cancel`, com o tempo decorrido.
 * Sem microfone ou permissão negada, o estado diz isso e a tela esconde ou desabilita o botão.
 */
export default function useVoiceRecorder({ maxMs = 5 * 60 * 1000, onAutoStop, device = browserRecorder }: UseVoiceRecorderOptions = {}) {
  const [state, setState] = useState<RecorderState>(() => (device() ? 'idle' : 'unsupported'));
  const [elapsedMs, setElapsed] = useState(0);
  const rec = useRef<RecorderDevice | null>(null);
  const started = useRef(0);

  const stop = useCallback(async () => {
    const r = rec.current;
    if (!r) return null;
    rec.current = null;
    setState('idle');
    return r.stop();
  }, []);

  const cancel = useCallback(() => {
    rec.current?.cancel();
    rec.current = null;
    setState((s) => (s === 'recording' ? 'idle' : s));
    setElapsed(0);
  }, []);

  const start = useCallback(async () => {
    const r = device();
    if (!r) return setState('unsupported');
    try {
      await r.start();
    } catch {
      return setState('denied');
    }
    rec.current = r;
    started.current = Date.now();
    setElapsed(0);
    setState('recording');
  }, [device]);

  useEffect(() => {
    if (state !== 'recording') return;
    const timer = setInterval(() => {
      const ms = Date.now() - started.current;
      setElapsed(ms);
      if (ms >= maxMs) void stop().then((audio) => audio && onAutoStop?.(audio));
    }, 250);
    return () => clearInterval(timer);
  }, [state, maxMs, stop, onAutoStop]);

  // sair da tela gravando: solta o microfone
  useEffect(() => () => rec.current?.cancel(), []);

  return { state, elapsedMs, start, stop, cancel };
}

/** Gravador do navegador (MediaRecorder); `null` quando não existe. */
export function browserRecorder(): RecorderDevice | null {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return null;
  let media: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  const release = () => media?.stream.getTracks().forEach((t) => t.stop());
  return {
    async start() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      media = new MediaRecorder(stream);
      chunks = [];
      media.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      media.start();
    },
    stop() {
      return new Promise<Blob>((resolve) => {
        if (!media) return resolve(new Blob());
        const m = media;
        m.onstop = () => {
          release();
          resolve(new Blob(chunks, { type: m.mimeType }));
        };
        m.stop();
      });
    },
    cancel() {
      if (media && media.state !== 'inactive') media.stop();
      release();
    }
  };
}
