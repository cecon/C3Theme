import { useEffect } from 'react';

import type { TaskExtra } from '../telemetry';
import useTaskTelemetry from './useTaskTelemetry';

/**
 * Tarefa do formulário: começa quando ele entra em edição (abrir o novo, ou clicar Editar no gravado) e termina em
 * `done` ao gravar. Cancelar, sair da tela ou fechar o diálogo sem gravar vira `task.abandon`.
 * Ver o registro sem editar não é tarefa.
 */
export default function useFormTelemetry(entity: string, isNew: boolean, editing: boolean): (extra?: TaskExtra) => void {
  const task = useTaskTelemetry();
  useEffect(() => {
    if (!editing) return;
    task.start({ entity, op: isNew ? 'create' : 'update' });
    return () => task.abandon();
  }, [editing, entity, isNew, task]);
  return task.done;
}
