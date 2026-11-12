// A conversa da página de chat vinda da rota (#100, ADR 0009). Em JS puro: a shell e o `pnpm spec:check` usam o mesmo.

/** Id de conversa das rotas /_chat/{conversation} (spec/v0/chat.yaml). */
export const CONVERSATION_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** `{nome}` em `chat.conversation`: a conversa vem do `:nome` da rota da página. */
const SLOT = /^\{([a-z][a-z0-9]*)\}$/;

/** Parâmetro que vale quando `chat.conversation` está ausente e a rota tem `:conversation`. */
const DEFAULT_PARAM = 'conversation';

/** Os `:nome` da rota, na ordem (`/conversa/:conversation` → `conversation`). */
export const routeParams = (path) =>
  (path ?? '')
    .split('/')
    .filter((s) => s.startsWith(':'))
    .map((s) => s.slice(1));

const slotOf = (conversation) => (typeof conversation === 'string' ? SLOT.exec(conversation)?.[1] : undefined);

/** Nome do parâmetro de rota que dá a conversa, ou null quando ela é fixa (o id da spec ou o padrão). */
export function conversationParam(conversation, path) {
  const slot = slotOf(conversation);
  if (slot) return slot;
  return conversation === undefined && routeParams(path).includes(DEFAULT_PARAM) ? DEFAULT_PARAM : null;
}

/** O que o spec:check recusa: `{nome}` sem `:nome` na rota, ou fora de página (`layout.header.assistant`). */
export function conversationIssue(conversation, path) {
  const slot = slotOf(conversation);
  if (!slot) return null;
  if (path === undefined) return `'${conversation}' só vale em página, com ':${slot}' na rota`;
  return routeParams(path).includes(slot) ? null : `'${conversation}' sem ':${slot}' na rota '${path}'`;
}
