import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import Alert from '@mui/material/Alert';
import { SectionSidebar } from '@c3theme/ui';
import { iconByName, useEngine, useText } from '../context';
import type { SidebarDef, SidebarPort } from './types';

export default function DeclaredSidebar({ def, onNavigate }: { def: SidebarDef; onNavigate?: () => void }) {
  const { sidebars } = useEngine();
  const port = sidebars?.[def.source];
  return port ? (
    <ConnectedSidebar key={def.source} def={def} port={port} onNavigate={onNavigate} />
  ) : (
    <Alert severity="error">Fonte da lista lateral indisponível: {def.source}</Alert>
  );
}
function ConnectedSidebar({ def, port, onNavigate }: { def: SidebarDef; port: SidebarPort; onNavigate?: () => void }) {
  const data = useSyncExternalStore(port.subscribe, port.getSnapshot, port.getSnapshot);
  const { icons } = useEngine();
  const text = useText();
  const navigate = useNavigate();
  return (
    <SectionSidebar
      storageKey={`${encodeURIComponent(def.source)}/${encodeURIComponent(data.serverId)}`}
      label={text(def.label)}
      title={text(def.title)}
      empty={text(def.empty, 'Nenhum item nesta lista.')}
      sections={[...def.sections, ...(data.sections ?? []).filter((s) => !def.sections.some((base) => base.id === s.id))].map((s) => ({
        ...s,
        label: text(s.label)
      }))}
      items={data.items.map((i) => {
        const Icon = iconByName(i.icon, icons);
        return {
          ...i,
          label: text(i.label),
          status: i.status && text(i.status),
          mark: Icon ? <Icon size={20} /> : undefined,
          actions: i.actions?.map((a) => ({ ...a, label: text(a.label) }))
        };
      })}
      views={data.views?.map((v) => ({ ...v, label: text(v.label) }))}
      view={data.view}
      onView={port.setView}
      active={data.active}
      loading={data.loading}
      error={data.error}
      onRetry={port.retry}
      onSelect={(id) => {
        const item = data.items.find((i) => i.id === id);
        if (item?.path) navigate(item.path);
        port.select?.(id);
        onNavigate?.();
      }}
      onAction={port.action}
      onCardAction={port.cardAction}
      onOverflowAlert={port.overflowAlert}
      cards={def.cards?.flatMap((card) => {
        const state = data.cards?.find((c) => c.id === card.id);
        return state
          ? [
              {
                ...card,
                severity: state.severity,
                label: text(card.label),
                message: text(state.message ?? card.message),
                action: { ...card.action, label: text(card.action.label) }
              }
            ]
          : [];
      })}
    />
  );
}
