// @c3theme/flow: contrato e regras do fluxo (também em @c3theme/flow/core) + editor visual sobre o @c3theme/ui.
export * from './core';
export type { CanvasEdge, CanvasEdgeTone, CanvasLabels, CanvasNode, CanvasPort, FlowCanvas, FlowCanvasProps } from './canvas/port';
export { default as ReactFlowCanvas } from './adapters/reactFlow/ReactFlowCanvas';
export { default as FlowEditor } from './ui/FlowEditor';
export type { FlowEditorProps } from './ui/FlowEditor';
export type { FlowNodeKind } from './ui/kinds';
export { FLOW_MESSAGES_EN } from './ui/text';
export type { FlowMessageId } from './ui/text';
