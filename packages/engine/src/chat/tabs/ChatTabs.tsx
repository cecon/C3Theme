import { useCallback, useEffect, useState, type ReactNode } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

import { ThreadTabs } from '@c3theme/ui';
import type { AssistantPanelProps, Author, ChatTransport } from '@c3theme/chat';

import { useEngine, useText } from '../../context';
import { shortcutFromKey } from '../../shortcut.mjs';
import type { ChatDef } from '../chatDef';
import type useLanes from '../useLanes';
import { isDraft, MAIN_TAB, shortcutAction, type ChatTabsDef } from './tabsDef';
import { tabPrefsKey } from './tabPrefs';
import { DraftThread, LaneThread } from './TabThreads';
import useThreadTabs from './useThreadTabs';

interface Props {
  def: ChatDef & { tabs: ChatTabsDef };
  conversationId: string;
  /** A conversa principal já montada (com ações, fixadas e partes): fica montada e só se esconde. */
  main: ReactNode;
  mainTitle: string;
  lanes: ReturnType<typeof useLanes>;
  transport: ChatTransport;
  me: Author;
  panel: Omit<AssistantPanelProps, 'chat'>;
}

const PANE_SX = { flex: 1, minHeight: 0 } as const;

/**
 * Faixa de abas das threads no alto do painel central (#134, ADR 0016). A principal fica sempre montada: trocar de
 * aba não perde rascunho nem histórico. As laterais abertas também ficam montadas depois da primeira visita.
 */
export default function ChatTabs({ def, conversationId, main, mainTitle, lanes: l, transport, me, panel }: Props) {
  const { app } = useEngine();
  const text = useText();
  const { setSelected } = l;
  const onOpened = useCallback(() => setSelected(undefined), [setSelected]);
  const tabs = useThreadTabs({
    prefsKey: tabPrefsKey(app.name, conversationId),
    mainLabel: text(def.tabs.main, mainTitle),
    draftLabel: 'Nova thread',
    lanes: l.lanes,
    settled: !l.loading && !l.listError,
    opened: l.selected,
    onOpened
  });
  const canNew = def.tabs.new !== false && l.enabled;
  const [visited, setVisited] = useState<string[]>([]);
  const { current } = tabs;
  useEffect(() => setVisited((v) => (v.includes(current) ? v : [...v, current])), [current]);

  const shortcuts = def.tabs.shortcuts;
  useEffect(() => {
    if (!shortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      const action = shortcutAction(shortcuts, shortcutFromKey(e), e.target, e.isComposing);
      if (!action) return;
      e.preventDefault();
      if (action === 'next') tabs.step(1);
      else if (action === 'previous') tabs.step(-1);
      else if (action === 'new') {
        if (canNew) tabs.addDraft();
      } else if (current !== MAIN_TAB) tabs.close(current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const send = (draft: string) => (value: string) =>
    l
      .run(async () => ({ lane: await l.api!.open(conversationId, { kind: 'aside', text: value }) }))
      .then((ok) => {
        if (ok) tabs.dropDraft(draft);
        return ok;
      });
  const live = visited.filter((id) => id !== MAIN_TAB && tabs.ids.includes(id));
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <ThreadTabs
        label={text(def.tabs.label, 'Threads da conversa')}
        tabs={tabs.tabs}
        active={current}
        onSelect={tabs.select}
        onNew={canNew ? tabs.addDraft : undefined}
        onClose={tabs.close}
        onCloseOthers={tabs.closeOthers}
        onRename={tabs.rename}
        onReorder={tabs.reorder}
        closed={tabs.closed}
        onReopen={tabs.reopen}
        loading={l.loading}
        error={l.listError || undefined}
        onRetry={l.retryList}
      />
      {l.actionError && (
        <Alert severity="info" onClose={l.clearError}>
          {l.actionError}
        </Alert>
      )}
      <Box role="tabpanel" aria-labelledby={`thread-tab-${current}`} sx={{ ...PANE_SX, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ ...PANE_SX, display: current === MAIN_TAB ? 'block' : 'none' }}>{main}</Box>
        {live.map((id) => (
          <Box key={id} sx={{ ...PANE_SX, display: current === id ? 'block' : 'none' }}>
            {isDraft(id) ? (
              <DraftThread hint="Escreva para começar uma thread nova." panel={panel} onSend={send(id)} />
            ) : (
              <LaneThread id={id} transport={transport} me={me} panel={panel} />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
