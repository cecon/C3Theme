// Aviso sonoro curto do tempo real, gerado pelo navegador (sem arquivo de áudio).

let audio: AudioContext | undefined;
let last = 0;

/**
 * Dois toques curtos. Uma rajada de avisos toca uma vez só (no máximo um som por segundo). O navegador só libera
 * o áudio depois que o usuário interagiu com a página; antes disso, não toca e não dá erro.
 */
export function beep(now = Date.now()) {
  if (now - last < 1000 || typeof window === 'undefined' || !('AudioContext' in window)) return;
  last = now;
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume().catch(() => undefined);
    const t = audio.currentTime;
    for (const [start, freq] of [
      [0, 880],
      [0.18, 1175]
    ]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t + start);
      gain.gain.exponentialRampToValueAtTime(0.2, t + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + start + 0.15);
      osc.connect(gain).connect(audio.destination);
      osc.start(t + start);
      osc.stop(t + start + 0.16);
    }
  } catch {
    // sem áudio (política do navegador, aba de fundo): o aviso visual basta
  }
}
