import { useEffect, useRef, useState } from 'react';

import { neighborOf, notify, type ThreadTab } from '@c3theme/ui';

import type { WireLane } from '../../agent/lanes';
import { DRAFT_PREFIX, isDraft, laneTab, MAIN_TAB } from './tabsDef';
import { useTabPrefs } from './tabPrefs';

interface Input {
  /** Chave das preferências (servidor + agente). */
  prefsKey: string;
  mainLabel: string;
  draftLabel: string;
  lanes: WireLane[];
  /** A lista já veio sem erro: dá para tirar as abas de threads que sumiram (arquivadas ou apagadas em outro lugar). */
  settled: boolean;
  /** Thread que acabou de abrir (à parte ou ramo): vira aba e fica ativa. */
  opened?: string;
  onOpened: () => void;
}

/** Estado da faixa (#134): abas abertas e ordem guardadas, rascunhos só na memória, ativa e o desfazer do fechar. */
export default function useThreadTabs({ prefsKey, mainLabel, draftLabel, lanes, settled, opened, onOpened }: Input) {
  const [prefs, change] = useTabPrefs(prefsKey);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [active, setActive] = useState(MAIN_TAB);
  const byId = new Map(lanes.map((l) => [l.id, l]));
  const open = prefs.open.filter((id) => byId.has(id));
  const ids = [MAIN_TAB, ...open, ...drafts];
  const current = ids.includes(active) ? active : MAIN_TAB;

  // aba de thread que não existe mais não fica fantasma
  const stale = settled && open.length !== prefs.open.length;
  useEffect(() => {
    if (stale) change((p) => ({ ...p, open: p.open.filter((id) => byId.has(id)) }));
  });
  // cada abertura vale uma vez (até a próxima): re-render com o mesmo `opened` não reabre a aba fechada
  const handled = useRef<string>(undefined);
  useEffect(() => {
    if (opened === handled.current) return;
    handled.current = opened;
    if (!opened) return;
    change((p) => (p.open.includes(opened) ? p : { ...p, open: [...p.open, opened] }));
    setActive(opened);
    onOpened();
  }, [opened, change, onOpened]);

  const tabs: ThreadTab[] = ids.map((id) =>
    id === MAIN_TAB
      ? { id, label: mainLabel, closable: false }
      : isDraft(id)
        ? { id, label: prefs.names[id] ?? draftLabel }
        : laneTab(byId.get(id)!, prefs.names)
  );
  const select = (id: string) => setActive(id);
  const close = (id: string) => {
    if (id === current) setActive(neighborOf(ids, id) ?? MAIN_TAB);
    if (isDraft(id)) return setDrafts((d) => d.filter((x) => x !== id));
    const before = prefs.open;
    change((p) => ({ ...p, open: p.open.filter((x) => x !== id) }));
    notify('Aba fechada.', 'info', { label: 'Desfazer', onClick: () => change((p) => ({ ...p, open: before })) });
  };
  const closeOthers = (id: string) => {
    const before = prefs.open;
    setActive(id);
    setDrafts((d) => d.filter((x) => x === id));
    change((p) => ({ ...p, open: p.open.filter((x) => x === id) }));
    notify('Outras abas fechadas.', 'info', { label: 'Desfazer', onClick: () => change((p) => ({ ...p, open: before })) });
  };
  const rename = (id: string, label: string) => change((p) => ({ ...p, names: { ...p.names, [id]: label } }));
  const reorder = (next: string[]) => {
    change((p) => ({ ...p, open: next.filter((id) => id !== MAIN_TAB && !isDraft(id)) }));
    setDrafts(next.filter(isDraft));
  };
  const reopen = (id: string) => {
    change((p) => ({ ...p, open: [...p.open.filter((x) => x !== id), id] }));
    setActive(id);
  };
  const addDraft = () => {
    const id = `${DRAFT_PREFIX}${globalThis.crypto.randomUUID()}`;
    setDrafts((d) => [...d, id]);
    setActive(id);
  };
  const dropDraft = (id: string) => setDrafts((d) => d.filter((x) => x !== id));
  const step = (delta: number) => {
    const enabled = tabs.filter((t) => !t.disabled).map((t) => t.id);
    setActive(enabled[(enabled.indexOf(current) + delta + enabled.length) % enabled.length]);
  };
  const closed = lanes.filter((l) => !open.includes(l.id)).map((l) => laneTab(l, prefs.names));
  return { tabs, ids, current, closed, select, close, closeOthers, rename, reorder, reopen, addDraft, dropDraft, step };
}
