import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { Theme } from '@mui/material/styles';

import ReactFlowCanvas from '../adapters/reactFlow/ReactFlowCanvas';
import type { FlowCanvas } from '../canvas/port';
import { addNode, canAdd, connect, isRemovable, moveNode, removeEdges, removeNodes, unlink, updateNode } from '../core/graph';
import { autoLayout } from '../core/layout';
import { runSummary } from '../core/run';
import type { FlowExtraIssue, FlowGraph, FlowPosition, FlowRun } from '../core/types';
import { issuesByNode, validateFlow } from '../core/validate';
import FlowToolbar from './FlowToolbar';
import type { FlowNodeKind } from './kinds';
import NodeInspector from './NodeInspector';
import { useCanvasModel } from './useCanvasModel';
import { useFlowText } from './text';

export interface FlowEditorProps {
  /** O fluxo (`{ nodes, edges }`). Controlado: toda mudança volta pelo `onChange`. */
  value: FlowGraph;
  onChange?: (next: FlowGraph) => void;
  /** Tipos de passo do app (gatilho, agente, condição, esperar, fim...). */
  kinds: FlowNodeKind[];
  /** Execução para acompanhar ao vivo: situação por nó e caminho percorrido. O editor não executa nada. */
  run?: FlowRun;
  /** Só olhar (acompanhar execução): sem arrastar, ligar nem remover. Sem `onChange`, vale `true`. */
  readOnly?: boolean;
  minimap?: boolean;
  /** Altura do editor (o canvas ocupa o que sobra da barra). */
  height?: number | string;
  /** Canvas usado. Padrão: React Flow. Outro adaptador só precisa seguir a porta `FlowCanvasProps`. */
  canvas?: FlowCanvas;
  /** Passo aberto no painel, controlado pelo app (ex.: abrir a partir da lista de problemas). Sem ele, o editor guarda. */
  selectedId?: string | null;
  /** Avisa qual passo abriu ou fechou (`null`), controlado ou não (ex.: para o botão "Testar este passo"). */
  onSelectedChange?: (id: string | null) => void;
  /** Problemas que só o app conhece, com o texto pronto: marcados no nó e somados na barra. */
  extraIssues?: FlowExtraIssue[];
}

const INSPECTOR_WIDTH = 320;

// painel do passo: à direita no desktop, embaixo no celular, com a divisória no tom do tema
const inspectorSx = (theme: Theme) => ({
  flexShrink: 0,
  overflowY: 'auto',
  maxHeight: '50%',
  borderTop: `1px solid ${theme.vars.palette.divider}`,
  [theme.breakpoints.up('md')]: {
    width: INSPECTOR_WIDTH,
    maxHeight: 'none',
    borderTop: 0,
    borderLeft: `1px solid ${theme.vars.palette.divider}`
  }
});

/** Editor de fluxo de trabalho: canvas de passos e ligações, painel do passo, validação marcada no nó e execução ao vivo. */
export default function FlowEditor({
  value,
  onChange,
  kinds,
  run,
  readOnly: readOnlyProp,
  minimap = true,
  height = 560,
  canvas: Canvas = ReactFlowCanvas,
  selectedId: selectedProp,
  onSelectedChange,
  extraIssues
}: FlowEditorProps) {
  const t = useFlowText();
  const readOnly = readOnlyProp ?? !onChange;
  const [ownSelected, setOwnSelected] = useState<string | null>(null);
  const selectedId = selectedProp === undefined ? ownSelected : selectedProp;
  const setSelectedId = useCallback(
    (id: string | null) => {
      setOwnSelected(id);
      onSelectedChange?.(id);
    },
    [onSelectedChange]
  );
  const [fitKey, setFitKey] = useState(0);
  const issues = useMemo(() => validateFlow(value, kinds), [value, kinds]);
  const byNode = useMemo(() => issuesByNode(issues), [issues]);
  const model = useCanvasModel({ graph: value, kinds, run, byNode, extraIssues, selectedId, readOnly, t });
  const selected = value.nodes.find((n) => n.id === selectedId);

  const change = useCallback((next: FlowGraph) => onChange?.(next), [onChange]);
  const onMove = useCallback((id: string, p: FlowPosition) => change(moveNode(value, id, p)), [change, value]);
  const onConnect = useCallback(
    (s: string, port: string, target: string) => change(connect(value, kinds, s, port, target)),
    [change, value, kinds]
  );
  const onRemove = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      // passo de tipo `removable: false` (ex.: o gatilho único) fica, mesmo selecionado junto
      const gone = nodeIds.filter((id) => value.nodes.some((n) => n.id === id && isRemovable(kinds, n)));
      if (!gone.length && !edgeIds.length) return;
      if (gone.includes(selectedId ?? '')) setSelectedId(null);
      change(removeEdges(removeNodes(value, gone), edgeIds));
    },
    [change, value, kinds, selectedId, setSelectedId]
  );

  const add = (kind: FlowNodeKind) => {
    const anchor =
      selected ??
      value.nodes.reduce<(typeof value.nodes)[number] | undefined>((a, n) => (!a || n.position.x > a.position.x ? n : a), undefined);
    const position = anchor ? { x: anchor.position.x + 280, y: anchor.position.y } : { x: 0, y: 0 };
    const { graph, id } = addNode(value, kind, position);
    // com um passo selecionado e saída livre, o novo já entra ligado nele
    const port =
      selected &&
      kinds
        .find((k) => k.type === selected.type)
        ?.outputs.find((p) => !value.edges.some((e) => e.source === selected.id && e.sourcePort === p.id));
    change(port && kind.hasInput ? connect(graph, kinds, selected.id, port.id, id) : graph);
    setSelectedId(id);
    setFitKey((k) => k + 1);
  };

  const layout = () => {
    change(autoLayout(value));
    setFitKey((k) => k + 1);
  };

  return (
    <Paper variant="outlined" sx={{ height, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <FlowToolbar
        kinds={kinds.filter((k) => canAdd(value, k))}
        readOnly={readOnly}
        issueCount={issues.length + (extraIssues?.length ?? 0)}
        summary={run ? runSummary(value, run) : undefined}
        t={t}
        onAdd={add}
        onLayout={layout}
      />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1, minHeight: 240, minWidth: 0 }}>
          <Canvas
            nodes={model.nodes}
            edges={model.edges}
            selectedId={selectedId}
            readOnly={readOnly}
            minimap={minimap}
            fitKey={fitKey}
            labels={model.labels}
            onSelect={setSelectedId}
            onMove={onMove}
            onConnect={onConnect}
            onRemove={onRemove}
          />
        </Box>
        {selected && (
          <Box sx={inspectorSx}>
            <NodeInspector
              graph={value}
              node={selected}
              kinds={kinds}
              status={run?.status[selected.id]}
              issues={model.issueTexts.get(selected.id) ?? []}
              readOnly={readOnly}
              removable={isRemovable(kinds, selected)}
              t={t}
              onRename={(label) => change(updateNode(value, selected.id, { label: label || undefined }))}
              onConfig={(config) => change(updateNode(value, selected.id, { config }))}
              onLink={(port, target) =>
                change(target ? connect(value, kinds, selected.id, port, target) : unlink(value, selected.id, port))
              }
              onRemove={() => onRemove([selected.id], [])}
              onClose={() => setSelectedId(null)}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
}
