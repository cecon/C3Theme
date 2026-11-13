import type { ChatTransport, Message, PinnedMessage } from '@c3theme/chat';
import { ApiError, type C3Client } from '../api';

/** Mesmo envelope e autenticação do restante do cliente; 404 significa recurso indisponível. */
export async function listPinned(client: Pick<C3Client, 'raw'>, conversation: string): Promise<PinnedMessage[]> {
  if (!client.raw) throw new ApiError(404, 'not_found', 'Recurso indisponível.');
  const reply = await client.raw('GET', `/_chat/${encodeURIComponent(conversation)}/_pinned`);
  const body = reply.body ? JSON.parse(reply.body) : {};
  if (reply.status < 200 || reply.status >= 300)
    throw new ApiError(reply.status, body.error?.code ?? 'internal', body.error?.message ?? `Erro ${reply.status}.`);
  return body.data;
}

/** Relê a mensagem pela paginação já contratada; não inventa uma rota GET de mensagem única. */
export async function rereadMessage(
  transport: Pick<ChatTransport, 'loadMessages'>,
  conversation: string,
  id: string
): Promise<Message | undefined> {
  let before: string | undefined;
  const seen = new Set<string>();
  while (true) {
    const page = await transport.loadMessages(conversation, { limit: 30, ...(before && { before }) });
    const found = page.messages.find((m) => m.id === id);
    if (found) return found;
    const oldest = page.messages[0]?.id;
    if (!page.hasMore || !oldest || seen.has(oldest)) return;
    seen.add(oldest);
    before = oldest;
  }
}
