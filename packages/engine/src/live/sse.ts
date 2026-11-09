// Leitor de Server-Sent Events por fetch. O EventSource do navegador não manda cabeçalho (Authorization do
// sistema), então o fluxo de GET /{entity}/_events é lido à mão. Sem React.

/** O que aconteceu com o registro: `changed` (sem id) é "relê tudo". */
export type LiveChange = 'created' | 'updated' | 'deleted' | 'changed';

/** `ready`: a assinatura vale a partir daqui. `change`: um aviso. `notification`: chegou aviso no sino (relê a lista). */
export type LiveMessage = { type: 'ready' } | { type: 'change'; change: LiveChange; id: string | null } | { type: 'notification' };

/** Separa os eventos completos (terminados em linha em branco) do pedaço que ainda está chegando. */
export function parseSse(buffer: string): { events: { event: string; data: string }[]; rest: string } {
  const text = buffer.replace(/\r\n?/g, '\n');
  const blocks = text.split('\n\n');
  const rest = blocks.pop() ?? '';
  const events = blocks.flatMap((block) => {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith(':')) continue; // comentário: mantém a conexão viva
      const i = line.indexOf(':');
      const [name, value] = i < 0 ? [line, ''] : [line.slice(0, i), line.slice(i + 1).replace(/^ /, '')];
      if (name === 'event') event = value;
      else if (name === 'data') data.push(value);
    }
    return data.length ? [{ event, data: data.join('\n') }] : [];
  });
  return { events, rest };
}

/** Evento do SSE na mensagem que a shell entende; o resto (evento desconhecido, JSON quebrado) é ignorado. */
export function toMessage(e: { event: string; data: string }): LiveMessage | null {
  if (e.event === 'ready') return { type: 'ready' };
  if (e.event === 'notification') return { type: 'notification' };
  if (e.event !== 'change') return null;
  try {
    const d = JSON.parse(e.data) as { change?: LiveChange; id?: string | null };
    if (!d.change) return null;
    return { type: 'change', change: d.change, id: d.id ?? null };
  } catch {
    return null;
  }
}

/** Lê o corpo até o servidor fechar (ou o `signal` abortar), chamando `onMessage` a cada aviso. */
export async function readSse(body: ReadableStream<Uint8Array>, onMessage: (m: LiveMessage) => void): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseSse(buffer);
    buffer = rest;
    for (const e of events) {
      const m = toMessage(e);
      if (m) onMessage(m);
    }
  }
}
