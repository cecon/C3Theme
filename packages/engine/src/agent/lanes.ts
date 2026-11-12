// Conversas à parte declaradas (app.schema.json $defs/chatLanes e $defs/chatMessageAction, issue #10): do JSON para as
// props do `AssistantPanel`/`LanePanel` do @c3theme/chat, e as rotas de spec/v0/chat-lanes.yaml. O motor não importa o
// chat: as formas abaixo batem com `MessageAction` e `Lane` de lá.

import { ApiError, type C3Client } from '../api';
import type { Text } from '../types';

export type LaneKind = 'aside' | 'branch';

/** `$defs/chatMessageAction`. */
export interface ChatMessageActionDef {
  id: string;
  label: Text;
  when?: { direction?: 'in' | 'out'; author?: 'agent' | 'person' };
  opens?: LaneKind;
}

/** `$defs/chatLanes`. */
export interface ChatLanesDef {
  label?: Text;
  /** Botão "À parte" na caixa. Padrão: ligado. */
  aside?: boolean;
  /** "Ramificar daqui" nas respostas. Padrão: ligado. */
  branch?: boolean;
}

/** O pedaço do chat declarado que interessa aqui (o resto é da #71). */
export interface ChatLanesSpec {
  messageActions?: ChatMessageActionDef[];
  lanes?: ChatLanesDef;
}

/** Ação pronta para o menu da mensagem (mesma forma do `MessageAction` do chat). */
export interface LaneAction {
  id: string;
  label: string;
  when?: ChatMessageActionDef['when'];
  opens?: LaneKind;
}

/** Mesma forma do `Lane` do chat. */
export interface WireLane {
  id: string;
  title: string;
  kind: LaneKind;
  parentId: string;
  fromMessageId?: string;
  working?: boolean;
  unread: number;
  updatedAt: string;
  lastMessage?: { text?: string; createdAt: string; direction: 'in' | 'out' };
}

/** Id da ação pronta "Ramificar daqui" (igual ao `BRANCH_ACTION` do chat). */
export const BRANCH_ACTION = 'c3.branch';

/**
 * Ações do menu de cada mensagem: o "Ramificar daqui" (com `lanes`, salvo `branch: false`) e depois as declaradas, na
 * ordem. `branchLabel` é o texto do chat no idioma da tela (`c3.chat.lanes.branchFrom`).
 */
export function laneActions(spec: ChatLanesSpec, text: (t: Text) => string, branchLabel: string): LaneAction[] {
  const branch: LaneAction[] =
    spec.lanes && spec.lanes.branch !== false
      ? [{ id: BRANCH_ACTION, label: branchLabel, when: { direction: 'in' }, opens: 'branch' }]
      : [];
  return [...branch, ...(spec.messageActions ?? []).map((a) => ({ id: a.id, label: text(a.label), when: a.when, opens: a.opens }))];
}

/** O botão "À parte" vai na caixa? Só com `lanes` e sem `aside: false`. */
export const hasAside = (spec: ChatLanesSpec) => !!spec.lanes && spec.lanes.aside !== false;

/** Resposta de uma ação sem `opens` (POST .../_actions/{id}). */
export interface MessageActionReply {
  lane?: WireLane;
  message?: string;
}

export interface LanesApi {
  list(conversationId: string): Promise<WireLane[]>;
  open(conversationId: string, body: { kind: LaneKind; fromMessageId?: string; text?: string }): Promise<WireLane>;
  act(conversationId: string, messageId: string, actionId: string): Promise<MessageActionReply>;
}

/** As rotas de chat-lanes.yaml sobre o `raw` do cliente (com o token da sessão). Cliente sem `raw`: sem o recurso. */
export function lanesApi(client: Pick<C3Client, 'raw'>): LanesApi | undefined {
  const raw = client.raw;
  if (!raw) return undefined;
  const e = encodeURIComponent;
  const call = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    // sem corpo, o stringify devolve undefined e o pedido sai sem corpo
    const reply = await raw(method, path, JSON.stringify(body) as string | undefined);
    const json = reply.body ? JSON.parse(reply.body) : {};
    if (reply.status < 200 || reply.status > 299) {
      const error = json?.error ?? json;
      throw new ApiError(reply.status, error?.code ?? 'internal', error?.message ?? `Erro ${reply.status}.`);
    }
    return json as T;
  };
  return {
    list: (c) => call<{ data: WireLane[] }>('GET', `/_chat/${e(c)}/_lanes`).then((r) => r.data.map(laneOfWire)),
    open: (c, body) => call<{ data: WireLane }>('POST', `/_chat/${e(c)}/_lanes`, body).then((r) => laneOfWire(r.data)),
    act: (c, m, a) =>
      call<MessageActionReply>('POST', `/_chat/${e(c)}/messages/${e(m)}/_actions/${e(a)}`).then((r) => ({
        message: r.message,
        lane: r.lane && laneOfWire(r.lane)
      }))
  };
}

/** `unread` é opcional no fio (padrão 0); o chat sempre espera o número. */
export const laneOfWire = (lane: WireLane): WireLane => ({ ...lane, unread: lane.unread ?? 0 });

/**
 * O que fazer quando o usuário escolhe uma ação no menu da mensagem: com `opens`, abre a conversa à parte (o ramo leva
 * a mensagem de origem; a pergunta lateral também cita de onde veio); sem, chama a ação do sistema. Ação que não está
 * na lista: nada.
 */
export async function runLaneAction(
  api: LanesApi,
  actions: readonly LaneAction[],
  conversationId: string,
  messageId: string,
  actionId: string
): Promise<MessageActionReply | undefined> {
  const action = actions.find((a) => a.id === actionId);
  if (!action) return undefined;
  if (action.opens) return { lane: await api.open(conversationId, { kind: action.opens, fromMessageId: messageId }) };
  return api.act(conversationId, messageId, actionId);
}
