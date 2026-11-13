import { useEffect, useRef, useState } from 'react';
import { PinnedMenu, useChatText, type AssistantChat, type PinnedMessage } from '@c3theme/chat';
import { ApiError } from '../api';
import { useEngine, useText } from '../context';
import type { ChatDef } from './chatDef';
import { listPinned } from './pinned';

/** Uma página anterior por transição; para ao encontrar, falhar, acabar ou repetir o cursor. */
export default function usePinned(def: ChatDef, chat: AssistantChat, revision: number) {
  const { client } = useEngine();
  const text = useText();
  const t = useChatText();
  const [items, setItems] = useState<PinnedMessage[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [target, setTarget] = useState<string>();
  const [jumpTo, setJumpTo] = useState<{ messageId: string; seq: number }>();
  const cursor = useRef<string | undefined>(undefined);
  const enabled = !!def.pinned;
  const pinVersion = chat.messages
    .filter((m) => m.meta?.fixada === true)
    .map((m) => m.id)
    .join('|');
  const { loading: chatLoading, messages, error: chatError, hasMore, loadOlder } = chat;
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    setLoading(true);
    setError('');
    void listPinned(client, chat.conversationId)
      .then(
        (data) => {
          if (live) {
            setItems(data);
            setAvailable(true);
          }
        },
        (e: unknown) => {
          if (!live) return;
          if (e instanceof ApiError && e.status === 404) setAvailable(false);
          else {
            setItems([]);
            setError(
              e instanceof ApiError && e.status === 401
                ? t('c3.chat.pinnedLogin')
                : e instanceof Error
                  ? e.message
                  : t('c3.chat.pinnedMissing')
            );
          }
        }
      )
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [client, chat.conversationId, enabled, revision, reload, pinVersion, t]);

  useEffect(() => {
    if (!target || chatLoading) return;
    if (messages.some((m) => m.id === target)) {
      setJumpTo((j) => ({ messageId: target, seq: (j?.seq ?? 0) + 1 }));
      setTarget(undefined);
      return;
    }
    const oldest = messages[0]?.id;
    if (chatError || !hasMore || !oldest || cursor.current === oldest) {
      setError(t('c3.chat.pinnedMissing'));
      setTarget(undefined);
      return;
    }
    cursor.current = oldest;
    void loadOlder();
  }, [target, chatLoading, messages, chatError, hasMore, loadOlder, t]);

  return {
    jumpTo,
    actions:
      enabled && available ? (
        <PinnedMenu
          label={typeof def.pinned === 'object' ? text(def.pinned.label, t('c3.chat.pinned')) : undefined}
          items={items}
          loading={loading || !!target}
          error={error}
          onRetry={() => setReload((n) => n + 1)}
          onSelect={(id) => {
            cursor.current = undefined;
            setError('');
            setTarget(id);
          }}
        />
      ) : undefined
  };
}
