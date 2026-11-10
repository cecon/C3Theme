import { useEffect, useState } from 'react';

/** Porta do medidor: o padrão usa o Web Audio do navegador; testes e apps nativos passam o seu. */
export type LevelMeter = (stream: MediaStream, onLevel: (level: number) => void) => () => void;

/** Volume do áudio (0 a 1) por quadro, pelo AnalyserNode. Sem Web Audio, fica em 0. */
export const browserMeter: LevelMeter = (stream, onLevel) => {
  const Ctx = typeof window === 'undefined' ? undefined : window.AudioContext;
  if (!Ctx) return () => {};
  const ctx = new Ctx();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let frame = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const v of data) sum += ((v - 128) / 128) ** 2;
    onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
    frame = requestAnimationFrame(tick);
  };
  tick();
  return () => {
    cancelAnimationFrame(frame);
    void ctx.close();
  };
};

/**
 * Volume do microfone ou da voz do assistente (0 a 1), para a bola da conversa por voz pulsar com a fala. O app passa
 * o `MediaStream` que já tem (o do microfone ou o da resposta); sem stream, 0.
 */
export default function useAudioLevel(stream: MediaStream | null | undefined, meter: LevelMeter = browserMeter): number {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!stream) return;
    const stop = meter(stream, setLevel);
    return () => {
      stop();
      setLevel(0);
    };
  }, [stream, meter]);
  return stream ? level : 0;
}
