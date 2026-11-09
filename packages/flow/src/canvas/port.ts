import type { ComponentType, ReactNode } from 'react';

import type { FlowPosition } from '../core/types';

// Porta do canvas: o que o editor precisa de qualquer biblioteca de grafo. O adaptador padrão é o React Flow
// (adapters/reactFlow); trocar de biblioteca é escrever outro componente com estas props, sem mexer no editor.

export interface CanvasPort {
  id: string;
  label?: string;
}

export interface CanvasNode {
  id: string;
  position: FlowPosition;
  hasInput: boolean;
  outputs: CanvasPort[];
  /** Texto para leitor de tela (nome, tipo, situação e problemas). */
  ariaLabel: string;
  /** Conteúdo do cartão, montado pelo editor (MUI). O canvas só põe as entradas e saídas em volta. */
  content: ReactNode;
}

export type CanvasEdgeTone = 'default' | 'traversed' | 'active' | 'failed';

export interface CanvasEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  /** Texto para leitor de tela ("Atendente para Pedido confirmado?, saída sim"). */
  ariaLabel: string;
  tone: CanvasEdgeTone;
}

export interface FlowCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedId: string | null;
  readOnly: boolean;
  minimap: boolean;
  /** Muda quando a vista deve se ajustar a todos os nós de novo (depois de organizar ou de adicionar um passo). */
  fitKey: number;
  onSelect: (id: string | null) => void;
  /** Fim do arraste: posição final do nó. */
  onMove: (id: string, position: FlowPosition) => void;
  onConnect: (source: string, sourcePort: string, target: string) => void;
  /** Delete no teclado: nós e ligações selecionados juntos, numa chamada só (um onChange só no editor). */
  onRemove: (nodeIds: string[], edgeIds: string[]) => void;
  /** Textos dos controles do canvas (aproximar, afastar, ajustar, minimapa). */
  labels: CanvasLabels;
}

export interface CanvasLabels {
  canvas: string;
  zoomIn: string;
  zoomOut: string;
  fitView: string;
  minimap: string;
  node: string;
  edge: string;
  handle: string;
}

export type FlowCanvas = ComponentType<FlowCanvasProps>;
