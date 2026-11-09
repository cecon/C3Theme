import { appendDelta, type ChatEvent, type Message } from '@c3theme/chat';
import type { ScriptedAnswer } from './answers';

const BOT = { id: 'assistente', name: 'Assistente' };
const pieces = (text: string, size: number) => text.match(new RegExp(`[\\s\\S]{1,${size}}`, 'g')) ?? [];

/**
 * Toca uma resposta roteirizada como um modelo de verdade faria: raciocínio chegando aos pedaços, cada ferramenta
 * rodando (com entrada, saída e tempo), mais raciocínio e, por fim, a resposta. `later` agenda; `emit` é o
 * "servidor" empurrando o evento.
 */
export default function streamAnswer(
  conversationId: string,
  script: ScriptedAnswer,
  emit: (event: ChatEvent) => void,
  later: (ms: number, fn: () => void) => void,
  onDone: () => void
): string {
  const id = `r${Date.now()}`;
  const started = Date.now();
  let cur: Message = {
    id,
    conversationId,
    author: BOT,
    direction: 'in',
    format: 'markdown',
    text: '',
    reasoning: '',
    tools: [],
    streaming: true,
    // a pergunta só aparece quando a resposta termina de chegar
    question: script.question,
    createdAt: new Date().toISOString()
  };
  const push = () => emit({ type: 'message', message: cur });
  const delta = (text: string, channel: 'text' | 'reasoning', done?: boolean) => {
    cur = appendDelta(cur, text, done, channel);
    emit({ type: 'delta', conversationId, id, text, done, channel });
  };

  let at = 250;
  const step = (ms: number, fn: () => void) => later((at += ms), fn);
  step(0, push);
  const think = (text: string) => pieces(text, 4).forEach((p) => step(22, () => delta(p, 'reasoning')));

  think(script.reasoning[0]);
  script.tools.forEach((tool, i) => {
    const took = 600 + i * 250;
    step(200, () => {
      cur = { ...cur, tools: [...cur.tools!, { ...tool, id: `${id}-t${i}`, status: 'running', output: undefined }] };
      push();
    });
    step(took, () => {
      cur = { ...cur, tools: cur.tools!.map((t, j) => (j === i ? { ...t, status: 'done', output: tool.output, durationMs: took } : t)) };
      push();
    });
  });
  if (script.reasoning[1]) {
    step(150, () => delta('\n\n', 'reasoning'));
    think(script.reasoning[1]);
  }
  // o servidor diz quanto pensou, na hora em que começa a responder
  step(200, () => {
    cur = { ...cur, reasoningMs: Date.now() - started };
    push();
  });
  const chunks = pieces(script.text, 6);
  chunks.forEach((p, i) =>
    step(28, () => {
      const done = i === chunks.length - 1;
      delta(p, 'text', done);
      if (done) onDone();
    })
  );
  return id;
}
