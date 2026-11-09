import { useEffect, useMemo, useRef } from 'react';

import { useEngine } from '../context';
import { startTask, TaskBase, TaskExtra, TaskTracker } from '../telemetry';

export interface TaskTelemetry {
  /** Começa uma tarefa; se havia outra aberta, ela vira `task.abandon`. */
  start(base: TaskBase): void;
  done(extra?: TaskExtra): void;
  abandon(): void;
}

/**
 * Uma tarefa por vez para a tela que a usa, pela porta `telemetry` do motor. Sem porta, não faz nada.
 * Sair da tela (desmontar) ou fechar a aba (`pagehide`) com a tarefa aberta emite `task.abandon`.
 * O objeto devolvido é estável: serve como dependência de efeito.
 */
export default function useTaskTelemetry(): TaskTelemetry {
  const { telemetry } = useEngine();
  const port = useRef(telemetry);
  const current = useRef<TaskTracker | null>(null);
  useEffect(() => {
    port.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    const leave = () => {
      current.current?.abandon();
      current.current = null;
    };
    window.addEventListener('pagehide', leave);
    return () => {
      window.removeEventListener('pagehide', leave);
      leave();
    };
  }, []);

  return useMemo<TaskTelemetry>(
    () => ({
      start(base) {
        current.current?.abandon();
        current.current = port.current ? startTask(port.current, base) : null;
      },
      done(extra) {
        current.current?.done(extra);
        current.current = null;
      },
      abandon() {
        current.current?.abandon();
        current.current = null;
      }
    }),
    []
  );
}
