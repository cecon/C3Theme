import { useCallback, useEffect, useState } from 'react';
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type OnDelete,
  type OnSelectionChangeParams
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import type { CanvasEdge, FlowCanvasProps } from '../../canvas/port';
import C3Node, { type C3FlowNode } from './C3Node';
import { canvasSx, edgeColor } from './canvasSx';

const NODE_TYPES = { c3: C3Node };
const DELETE_KEYS = ['Delete', 'Backspace'];

/** Ajusta a vista a todos os nós quando `fitKey` muda (organizar, abrir outro fluxo). */
function FitOnKey({ fitKey }: { fitKey: number }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!fitKey) return;
    // espera o passo novo entrar e ser medido e o painel do passo abrir (o canvas encolhe); antes disso o ajuste erra
    const timer = setTimeout(() => fitView({ padding: 0.2, maxZoom: 1, duration: 200 }), 150);
    return () => clearTimeout(timer);
  }, [fitKey, fitView]);
  return null;
}

/**
 * Adaptador da porta `FlowCanvas` sobre o React Flow (@xyflow/react, MIT). Guarda só o estado de interação (arraste,
 * seleção, medidas); o grafo continua sendo o `value` do editor, que recebe a posição no fim do arraste.
 */
export default function ReactFlowCanvas(props: FlowCanvasProps) {
  const { nodes, edges, selectedId, readOnly, minimap, fitKey, labels, onSelect, onMove, onConnect, onRemove } = props;
  const theme = useTheme();
  const [rfNodes, setRfNodes] = useState<C3FlowNode[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  useEffect(() => {
    setRfNodes((prev) => {
      const before = new Map(prev.map((n) => [n.id, n]));
      // mantém as medidas do nó anterior: sem elas o React Flow esconde o nó até medir de novo
      return nodes.map((n) => ({
        ...before.get(n.id),
        id: n.id,
        type: 'c3',
        position: n.position,
        data: { node: n },
        ariaLabel: n.ariaLabel,
        selected: n.id === selectedId
      }));
    });
  }, [nodes, selectedId]);

  useEffect(() => {
    setRfEdges((prev) => {
      const selected = new Set(prev.filter((e) => e.selected).map((e) => e.id));
      return edges.map((e: CanvasEdge) => {
        const stroke = edgeColor(theme, e.tone);
        return {
          id: e.id,
          source: e.source,
          sourceHandle: e.sourcePort,
          target: e.target,
          type: 'smoothstep',
          ariaLabel: e.ariaLabel,
          animated: e.tone === 'active',
          selected: selected.has(e.id),
          style: { stroke, strokeWidth: e.tone === 'default' ? 1.5 : 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: stroke }
        };
      });
    });
  }, [edges, theme]);

  const onNodesChange = useCallback(
    (changes: NodeChange<C3FlowNode>[]) => {
      // a remoção vem pelo onDelete (nós e ligações juntos); aqui só arraste, seleção e medidas
      setRfNodes((cur) =>
        applyNodeChanges(
          changes.filter((c) => c.type !== 'remove'),
          cur
        )
      );
      for (const c of changes) if (c.type === 'position' && c.position && c.dragging === false) onMove(c.id, c.position);
    },
    [onMove]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setRfEdges((cur) =>
        applyEdgeChanges(
          changes.filter((c) => c.type !== 'remove'),
          cur
        )
      ),
    []
  );

  const onDelete: OnDelete<C3FlowNode, Edge> = useCallback(
    ({ nodes: gone, edges: cut }) =>
      onRemove(
        gone.map((n) => n.id),
        cut.map((e) => e.id)
      ),
    [onRemove]
  );

  const handleConnect = useCallback(
    (c: Connection) => {
      if (c.sourceHandle) onConnect(c.source, c.sourceHandle, c.target);
    },
    [onConnect]
  );
  // o React Flow pede o onSelectionChange estável (senão dispara de novo a cada render)
  const handleSelection = useCallback(({ nodes: sel }: OnSelectionChangeParams) => onSelect(sel[0]?.id ?? null), [onSelect]);

  return (
    <Box role="region" aria-label={labels.canvas} sx={(t) => ({ height: '100%', width: '100%', ...canvasSx(t) })}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDelete={onDelete}
        onConnect={handleConnect}
        onSelectionChange={handleSelection}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        // Tab passa só pelos passos; ligação se desfaz no painel do passo ("Sem ligação") ou clicando nela + Delete
        edgesFocusable={false}
        deleteKeyCode={readOnly ? null : DELETE_KEYS}
        multiSelectionKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        proOptions={{ hideAttribution: true }}
        ariaLabelConfig={{
          'controls.ariaLabel': labels.canvas,
          'controls.zoomIn.ariaLabel': labels.zoomIn,
          'controls.zoomOut.ariaLabel': labels.zoomOut,
          'controls.fitView.ariaLabel': labels.fitView,
          'minimap.ariaLabel': labels.minimap,
          'node.a11yDescription.default': labels.node,
          'node.a11yDescription.keyboardDisabled': labels.node,
          'edge.a11yDescription.default': labels.edge,
          'handle.ariaLabel': labels.handle
        }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
        {minimap && <MiniMap pannable zoomable nodeBorderRadius={8} />}
        <FitOnKey fitKey={fitKey} />
      </ReactFlow>
    </Box>
  );
}
