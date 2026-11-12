import { useState } from 'react';

import Box from '@mui/material/Box';

import { AssistantPanel, LanePanel, messagesUntil, useChatText, type AssistantChat, type Lane, type Message } from '@c3theme/chat';
import { hasAside, laneActions, type ChatLanesSpec } from '@c3theme/engine';
import { ASSISTENTE, EU, RESPOSTA } from './mensagens';

/** O que o sistema declara no chat do app.json (`$defs/chatLanes` e `$defs/chatMessageAction`). */
export const DECLARADO: ChatLanesSpec = {
  lanes: { label: 'Conversas à parte' },
  messageActions: [{ id: 'perguntar', label: 'Perguntar à parte', when: { direction: 'in' }, opens: 'aside' }]
};

const at = (min: number) => new Date(Date.UTC(2026, 10, 12, 13, min)).toISOString();
const PERGUNTA: Message = {
  ...RESPOSTA,
  id: 'p1',
  author: EU,
  direction: 'out',
  format: undefined,
  tools: undefined,
  text: 'Quais faturas estão atrasadas?',
  createdAt: at(9),
  status: 'read'
};
const PRINCIPAL: Message[] = [PERGUNTA, { ...RESPOSTA, createdAt: at(10) }];

/** Chat de mentira: guarda as mensagens e responde na hora (a vitrine não tem agente). */
function fakeChat(conversationId: string, messages: Message[], push: (m: Message[]) => void): AssistantChat {
  return {
    conversationId,
    messages,
    hasMore: false,
    loading: null,
    generating: false,
    loadOlder: async () => {},
    retry: () => {},
    stop: () => {},
    answer: async () => {},
    send: (text: string) => push(conversa(conversationId, messages.length, text))
  };
}

const conversa = (conversationId: string, n: number, text: string): Message[] => [
  { id: `${conversationId}-${n}`, conversationId, author: EU, direction: 'out', text, createdAt: at(20 + n), status: 'read' },
  {
    id: `${conversationId}-${n + 1}`,
    conversationId,
    author: ASSISTENTE,
    direction: 'in',
    format: 'markdown',
    text: `Sobre "${text}": sigo a conversa principal enquanto respondo aqui.`,
    createdAt: at(21 + n)
  }
];

/** Conversa principal e o painel das conversas à parte, lado a lado, montados pelo que foi declarado. */
export default function ConversasAParte({ spec = DECLARADO }: { spec?: ChatLanesSpec }) {
  const t = useChatText();
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [byLane, setByLane] = useState<Record<string, Message[]>>({});
  const [open, setOpen] = useState<string>();
  const actions = laneActions(spec, (x) => (typeof x === 'string' ? x : (x.defaultMessage ?? x.id)), t('c3.chat.lanes.branchFrom'));

  function openLane(kind: Lane['kind'], history: Message[], text: string, fromMessageId?: string) {
    const id = `l${lanes.length + 1}`;
    const title = text || (kind === 'branch' ? 'Ramo da resposta' : 'Pergunta à parte');
    const first = text ? conversa(id, history.length, text) : [];
    const messages = [...history.map((m) => ({ ...m, conversationId: id })), ...first];
    setByLane((b) => ({ ...b, [id]: messages }));
    setLanes((ls) => [...ls, { id, title, kind, parentId: 'c1', fromMessageId, unread: 0, updatedAt: at(30 + ls.length) }]);
    setOpen(id);
  }

  const main = fakeChat('c1', PRINCIPAL, () => {});
  const laneChat = open
    ? fakeChat(open, byLane[open] ?? [], (more) => setByLane((b) => ({ ...b, [open]: [...(b[open] ?? []), ...more] })))
    : undefined;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, height: 620 }}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden', minHeight: 0 }}>
        <AssistantPanel
          chat={main}
          messageActions={actions}
          onMessageAction={(m, id) => {
            const action = actions.find((a) => a.id === id);
            if (action?.opens === 'branch') openLane('branch', messagesUntil(PRINCIPAL, m.id), '', m.id);
            else if (action?.opens === 'aside') openLane('aside', [], '', m.id);
          }}
          onAside={hasAside(spec) ? (text) => openLane('aside', [], text) : undefined}
        />
      </Box>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden', minHeight: 0 }}>
        <LanePanel
          title={typeof spec.lanes?.label === 'string' ? spec.lanes.label : undefined}
          lanes={lanes}
          selectedId={open}
          chat={laneChat}
          onSelect={setOpen}
          onBack={() => setOpen(undefined)}
          onNewAside={hasAside(spec) ? () => openLane('aside', [], '') : undefined}
          panel={{ messageActions: actions.filter((a) => a.opens !== 'branch') }}
        />
      </Box>
    </Box>
  );
}
