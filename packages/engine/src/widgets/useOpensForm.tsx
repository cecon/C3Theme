// Ação `opensForm` (#45): abre o formulário de criar de outra entidade num diálogo, com os valores do registro de
// origem (`values`), e depois de salvar grava o id criado no campo reference de origem (`assignTo`).
import { useState } from 'react';
import { useSWRConfig } from 'swr';

import { notify } from '@c3theme/ui';
import type { ActionDef } from '../actionTypes';
import { useEngine } from '../context';
import EntityDialog from '../pages/EntityDialog';
import type { WireRecord } from '../types';

/** Valores iniciais do formulário aberto: cada campo de destino recebe o campo de origem que não está vazio. */
export function openingValues(values: Record<string, string> = {}, record: WireRecord = {}): WireRecord {
  return Object.fromEntries(
    Object.entries(values)
      .map(([to, from]) => [to, record[from]] as const)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export default function useOpensForm(origin: string, id?: string, record?: WireRecord) {
  const { client, entities } = useEngine();
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState<{ action: ActionDef; initial: WireRecord } | null>(null);

  /** `true` quando a ação abre formulário (e já abriu); as outras seguem o caminho de sempre. */
  const start = (action: ActionDef) => {
    if (!action.opensForm || !id) return false;
    const target = entities[action.opensForm.entity];
    if (!target?.capabilities.create) {
      notify('Você não tem permissão para cadastrar aqui.', 'warning');
      return true;
    }
    setOpen({ action, initial: openingValues(action.opensForm.values, record) });
    return true;
  };

  const close = async (_changed: boolean, saved?: WireRecord) => {
    const assignTo = open?.action.opensForm?.assignTo;
    setOpen(null);
    if (!saved?.id || !assignTo || !id) return;
    try {
      const updated = await client.update(origin, id, { [assignTo]: String(saved.id) });
      mutate(['c3-record', origin, id], updated, { revalidate: false });
      mutate((key) => Array.isArray(key) && key[0] === 'c3-list');
      notify('Cadastrado e vinculado.', 'success');
    } catch (e) {
      notify(`Cadastrado, mas não deu para vincular: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  };

  const target = open?.action.opensForm?.entity;
  const dialog =
    open && target && entities[target] ? (
      <EntityDialog open={{}} entity={target} initial={open.initial} onClose={(c, s) => void close(c, s)} />
    ) : null;
  return { start, dialog };
}
