import type { TaskChannel, TaskEvent, TaskOp, TelemetryPort } from './events';

/** O que identifica a tarefa; o canal é 'screen' quando não vem. */
export interface TaskBase {
  entity: string;
  op: TaskOp;
  action?: string;
  channel?: TaskChannel;
}

/** Números do fim da tarefa (o `ms` o rastreador mede sozinho). */
export type TaskExtra = Pick<TaskEvent, 'fields' | 'turns' | 'suggested'>;

/** Uma tarefa em andamento: emite `task.start` ao criar e no máximo um `task.done` ou `task.abandon`. */
export interface TaskTracker {
  done(extra?: TaskExtra): void;
  abandon(): void;
  readonly finished: boolean;
}

export interface TrackerDeps {
  now: () => number;
  newId: () => string;
}

const defaults: TrackerDeps = {
  now: () => Date.now(),
  newId: () => globalThis.crypto?.randomUUID?.() ?? `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
};

/** Começa uma tarefa. Erro na porta do sistema é engolido: telemetria nunca impede gravar. */
export function startTask(port: TelemetryPort, base: TaskBase, deps: TrackerDeps = defaults): TaskTracker {
  const taskId = deps.newId();
  const startedAt = deps.now();
  const common = {
    taskId,
    entity: base.entity,
    op: base.op,
    channel: base.channel ?? 'screen',
    ...(base.action && { action: base.action })
  };
  const emit = (event: TaskEvent) => {
    try {
      port(event);
    } catch {
      // a porta é do sistema; falha dela não é falha da tarefa
    }
  };
  let finished = false;
  const finish = (type: 'task.done' | 'task.abandon', extra?: TaskExtra) => {
    if (finished) return;
    finished = true;
    emit({ type, ...common, ...extra, ms: Math.max(0, deps.now() - startedAt) });
  };
  emit({ type: 'task.start', ...common });
  return {
    done: (extra) => finish('task.done', extra),
    abandon: () => finish('task.abandon'),
    get finished() {
      return finished;
    }
  };
}

/** Quantos campos mudaram entre o que abriu e o que vai gravar. Campos de controle (`_can`, `_branch`) não contam. */
export function changedFields(before: Record<string, unknown> | undefined, after: Record<string, unknown>): number {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after)]);
  let n = 0;
  for (const k of keys) {
    if (k === 'id' || k.startsWith('_')) continue;
    if (JSON.stringify(before?.[k] ?? null) !== JSON.stringify(after[k] ?? null)) n++;
  }
  return n;
}
