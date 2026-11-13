import type { AgentDockItem, AgentDockPosition } from '@c3theme/ui';
import type { Text } from '../types';

export interface AgentDockDef {
  /** Nome da porta em C3Shell.agentDocks; não é nome de componente. */
  source: string;
  position: AgentDockPosition;
  /** Pixels reservados; limitado a metade da janela em telas pequenas. */
  size: number;
  label: Text;
  states?: {
    loading?: Text;
    empty?: { message: Text; action?: { label: Text; path: string } };
    error?: Text;
    offline?: Text;
    retry?: Text;
  };
}
export interface DockAgent extends AgentDockItem {
  path: string;
}
export interface AgentDockSnapshot {
  items: readonly DockAgent[];
  loading?: boolean;
  error?: boolean;
  offline?: boolean;
}
/** Snapshot estável e imutável até subscribe avisar. Ordem e dados pertencem ao app. */
export interface AgentDockPort {
  getSnapshot(): AgentDockSnapshot;
  subscribe(listener: () => void): () => void;
  retry(): void | Promise<void>;
}
