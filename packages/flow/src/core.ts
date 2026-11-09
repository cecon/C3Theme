// @c3theme/flow/core: contrato do fluxo e regras puras (sem React, sem a biblioteca do canvas).
export * from './core/types';
export {
  addNode,
  canAdd,
  connect,
  edgeFrom,
  isRemovable,
  moveNode,
  nextId,
  nodeName,
  removeEdges,
  removeNodes,
  typeOf,
  unlink,
  updateNode
} from './core/graph';
export { cycles, issuesByNode, validateFlow } from './core/validate';
export { autoLayout } from './core/layout';
export type { LayoutOptions } from './core/layout';
export { runSummary, traversedEdges } from './core/run';
