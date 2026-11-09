import { createContext, ReactNode, useContext, useMemo, useReducer, useState } from 'react';

import { Card, Column, Comment, INITIAL_DATA, KanbanData, Story } from './data';

type Action =
  | { type: 'moveColumn'; from: number; to: number }
  | { type: 'moveCard'; cardId: string; toColumn: string; toIndex: number }
  | { type: 'addColumn'; column: Column }
  | { type: 'renameColumn'; id: string; title: string }
  | { type: 'deleteColumn'; id: string }
  | { type: 'setDoneColumn'; id: string | null }
  | { type: 'addCard'; card: Card; columnId: string; storyId: string | null }
  | { type: 'updateCard'; id: string; patch: Partial<Omit<Card, 'id'>> }
  | { type: 'deleteCard'; id: string }
  | { type: 'addCardComment'; cardId: string; comment: Comment }
  | { type: 'setCardStory'; cardId: string; storyId: string | null; toIndex?: number }
  | { type: 'saveStory'; story: Story }
  | { type: 'deleteStory'; id: string }
  | { type: 'moveStory'; from: number; to: number }
  | { type: 'addStoryComment'; storyId: string; comment: Comment };

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const without = (ids: string[], id: string) => ids.filter((x) => x !== id);

function mapValues<T>(record: Record<string, T>, fn: (v: T) => T): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, fn(v)]));
}

function reducer(state: KanbanData, action: Action): KanbanData {
  switch (action.type) {
    case 'moveColumn':
      return { ...state, columnOrder: move(state.columnOrder, action.from, action.to) };

    case 'moveCard': {
      // tira o cartão de onde estiver e insere na coluna de destino
      const columns = mapValues(state.columns, (c) => ({ ...c, cardIds: without(c.cardIds, action.cardId) }));
      const target = columns[action.toColumn];
      const cardIds = [...target.cardIds];
      cardIds.splice(Math.min(action.toIndex, cardIds.length), 0, action.cardId);
      return { ...state, columns: { ...columns, [action.toColumn]: { ...target, cardIds } } };
    }

    case 'addColumn':
      return {
        ...state,
        columns: { ...state.columns, [action.column.id]: action.column },
        columnOrder: [...state.columnOrder, action.column.id]
      };

    case 'renameColumn':
      return { ...state, columns: { ...state.columns, [action.id]: { ...state.columns[action.id], title: action.title } } };

    case 'deleteColumn': {
      // os cartões da coluna saem do quadro e das histórias; histórias nessa situação vão para a primeira coluna
      const removed = new Set(state.columns[action.id]?.cardIds ?? []);
      const columns = { ...state.columns };
      delete columns[action.id];
      const columnOrder = without(state.columnOrder, action.id);
      const cards = Object.fromEntries(Object.entries(state.cards).filter(([id]) => !removed.has(id)));
      const stories = mapValues(state.stories, (s) => ({
        ...s,
        cardIds: s.cardIds.filter((id) => !removed.has(id)),
        columnId: s.columnId === action.id ? (columnOrder[0] ?? '') : s.columnId
      }));
      const doneColumnId = state.doneColumnId === action.id ? null : state.doneColumnId;
      return { ...state, columns, columnOrder, cards, stories, doneColumnId };
    }

    case 'setDoneColumn':
      return { ...state, doneColumnId: action.id };

    case 'addCard': {
      const column = state.columns[action.columnId];
      const stories = action.storyId
        ? {
            ...state.stories,
            [action.storyId]: { ...state.stories[action.storyId], cardIds: [...state.stories[action.storyId].cardIds, action.card.id] }
          }
        : state.stories;
      return {
        ...state,
        cards: { ...state.cards, [action.card.id]: action.card },
        columns: { ...state.columns, [column.id]: { ...column, cardIds: [...column.cardIds, action.card.id] } },
        stories
      };
    }

    case 'updateCard':
      return { ...state, cards: { ...state.cards, [action.id]: { ...state.cards[action.id], ...action.patch } } };

    case 'deleteCard': {
      const cards = { ...state.cards };
      delete cards[action.id];
      return {
        ...state,
        cards,
        columns: mapValues(state.columns, (c) => ({ ...c, cardIds: without(c.cardIds, action.id) })),
        stories: mapValues(state.stories, (s) => ({ ...s, cardIds: without(s.cardIds, action.id) }))
      };
    }

    case 'addCardComment': {
      const card = state.cards[action.cardId];
      return { ...state, cards: { ...state.cards, [card.id]: { ...card, comments: [...card.comments, action.comment] } } };
    }

    case 'setCardStory': {
      const stories = mapValues(state.stories, (s) => ({ ...s, cardIds: without(s.cardIds, action.cardId) }));
      if (action.storyId) {
        const target = stories[action.storyId];
        const cardIds = [...target.cardIds];
        cardIds.splice(Math.min(action.toIndex ?? cardIds.length, cardIds.length), 0, action.cardId);
        stories[action.storyId] = { ...target, cardIds };
      }
      return { ...state, stories };
    }

    case 'saveStory': {
      const exists = !!state.stories[action.story.id];
      return {
        ...state,
        stories: { ...state.stories, [action.story.id]: action.story },
        storyOrder: exists ? state.storyOrder : [...state.storyOrder, action.story.id]
      };
    }

    case 'deleteStory': {
      // os itens continuam no quadro, só deixam de pertencer à história
      const stories = { ...state.stories };
      delete stories[action.id];
      return { ...state, stories, storyOrder: without(state.storyOrder, action.id) };
    }

    case 'moveStory':
      return { ...state, storyOrder: move(state.storyOrder, action.from, action.to) };

    case 'addStoryComment': {
      const story = state.stories[action.storyId];
      return { ...state, stories: { ...state.stories, [story.id]: { ...story, comments: [...story.comments, action.comment] } } };
    }
  }
}

interface KanbanContextValue {
  data: KanbanData;
  dispatch: (action: Action) => void;
  /** Cartão aberto na gaveta de detalhes (compartilhada entre quadro e backlog). */
  openCardId: string | null;
  openCard: (id: string | null) => void;
  columnOf: (cardId: string) => Column | undefined;
  storyOf: (cardId: string) => Story | undefined;
}

const KanbanContext = createContext<KanbanContextValue | null>(null);

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, INITIAL_DATA);
  const [openCardId, openCard] = useState<string | null>(null);

  const value = useMemo<KanbanContextValue>(
    () => ({
      data,
      dispatch,
      openCardId,
      openCard,
      columnOf: (cardId) => Object.values(data.columns).find((c) => c.cardIds.includes(cardId)),
      storyOf: (cardId) => Object.values(data.stories).find((s) => s.cardIds.includes(cardId))
    }),
    [data, openCardId]
  );

  return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>;
}

export function useKanban() {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error('useKanban precisa estar dentro de <KanbanProvider>.');
  return ctx;
}

let seq = 0;

/** Id único para dados em memória. */
export function newId(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}
