/**
 * Eventos de tarefa: o motor mede quanto custa criar, alterar ou rodar uma ação pela tela, para comparar com o
 * assistente (docs/chat-agentico.md, 13.4). Sem dado pessoal: nem valores, nem id do registro, nem usuário.
 * O motor só emite; quem guarda ou manda para um serviço de analytics é o sistema, pela porta `TelemetryPort`.
 */
export type TaskEventType = 'task.start' | 'task.done' | 'task.abandon';

/** O que a tarefa faz: incluir, alterar ou rodar uma ação (de registro, em lote ou da lista). */
export type TaskOp = 'create' | 'update' | 'action';

/** Por onde a tarefa foi feita: tela normal do motor ou assistente no chat. */
export type TaskChannel = 'chat' | 'screen';

export interface TaskEvent {
  type: TaskEventType;
  /** Igual nos eventos da mesma tarefa: liga o `task.start` ao `task.done` ou ao `task.abandon`. */
  taskId: string;
  /** Nome da entidade na spec, ex.: 'pedido_compra'. */
  entity: string;
  op: TaskOp;
  channel: TaskChannel;
  /** Nome da ação, quando `op` é 'action'. */
  action?: string;
  /** Mensagens até concluir (só no chat). */
  turns?: number;
  /** Campos que o usuário mudou (no `task.done` de formulário). */
  fields?: number;
  /** Campos que vieram sugeridos (só no chat). */
  suggested?: number;
  /** Duração desde o `task.start`, em milissegundos (no `task.done` e no `task.abandon`). */
  ms?: number;
}

/**
 * Porta de telemetria: o sistema recebe cada evento e decide o destino (log, fila, `navigator.sendBeacon`).
 * Pode ser chamada no `pagehide`, então deve ser síncrona e rápida; erro nela não quebra a tela.
 */
export type TelemetryPort = (event: TaskEvent) => void;
