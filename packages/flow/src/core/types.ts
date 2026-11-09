// Contrato do fluxo: JSON puro, sem React e sem a biblioteca do canvas. É o que o app grava e devolve no onChange.

export interface FlowPosition {
  x: number;
  y: number;
}

/** Passo do fluxo. `type` aponta para um tipo de nó declarado pelo app; `config` é do formulário desse tipo. */
export interface FlowNode {
  id: string;
  type: string;
  position: FlowPosition;
  /** Nome que aparece no nó. Sem ele, vale o rótulo do tipo. */
  label?: string;
  config?: Record<string, unknown>;
}

/** Ligação de uma saída (`sourcePort`, ex.: "sim") até a entrada de outro nó. */
export interface FlowEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowPort {
  id: string;
  /** Rótulo da saída no nó e no menu de ligar (ex.: "sim", "não"). Sem rótulo, a saída é a única do nó. */
  label?: string;
}

/** Campo do formulário de configuração do nó, declarado como dado (o editor monta com os campos do @c3theme/ui). */
export interface FlowField {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'number' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  helperText?: string;
}

/** Tipo de nó declarado pelo app: gatilho, agente, condição, esperar, fim... */
export interface FlowNodeType {
  type: string;
  label: string;
  /** Gatilho não tem entrada; os outros têm uma. */
  hasInput: boolean;
  outputs: FlowPort[];
  fields?: FlowField[];
  /**
   * Chave do `config` com o limite de voltas (ex.: "maxTentativas"). Ciclo que passa por um nó desse tipo com o
   * limite preenchido (> 0) é aceito; sem nenhum, vira erro "ciclo sem limite".
   */
  loopLimitKey?: string;
  /** Quantos passos desse tipo o fluxo aceita (ex.: 1 gatilho). No limite, o tipo some do menu de adicionar. */
  max?: number;
  /** `false`: o passo não sai pelo Delete nem pelo painel (ex.: o gatilho único). */
  removable?: boolean;
  /** `config` inicial do passo novo, para ele já entrar válido (ex.: o primeiro agente da empresa). */
  defaults?: () => Record<string, unknown>;
}

export type NodeRunStatus = 'idle' | 'running' | 'waiting' | 'done' | 'failed';

/** Execução acompanhada ao vivo: situação por nó e, se o app souber, as ligações percorridas. */
export interface FlowRun {
  status: Record<string, NodeRunStatus>;
  /** Ligações percorridas. Sem a lista, o editor deduz pela situação dos nós (ver `traversedEdges`). */
  traversed?: string[];
}

export type FlowIssueCode = 'unknownType' | 'orphan' | 'unlinkedOutput' | 'missingInput' | 'cycle' | 'required';

export interface FlowIssue {
  code: FlowIssueCode;
  nodeId: string;
  /** Saída sem ligação (`unlinkedOutput`) ou campo obrigatório vazio (`required`, a chave do campo). */
  detail?: string;
}

/** Problema que só o app conhece (ex.: agente desativado), com o texto pronto. Marca o nó e soma na barra. */
export interface FlowExtraIssue {
  nodeId: string;
  message: string;
}
