import { useState } from 'react';
import { useSWRConfig } from 'swr';

import { ConfirmDialog, notify } from '@c3theme/ui';
import { useEngine, useText } from '../../context';
import type { WireRecord } from '../../types';

/** Aviso depois de excluir: quantas ficaram, se alguma falhou; senão, quantas saíram. */
export function deleteResultText(done: number, total: number, gender: 'm' | 'f' = 'm') {
  const o = gender === 'f' ? 'a' : 'o';
  if (done < total) return `${total - done} de ${total} não puderam ser excluíd${o}s.`;
  return done === 1 ? `Excluíd${o}.` : `${done} excluíd${o}s.`;
}

/**
 * Excluir da lista (`rowActions` com 'delete'): pergunta, exclui um por um e relê a lista. `onDone` recebe os
 * ids excluídos, para tirar da seleção. Se algum falha, os outros continuam e o aviso diz quantos ficaram.
 */
export function useRowDelete(entity: string, titleOf: (row: WireRecord) => string, onDone: (ids: string[]) => void) {
  const { client, entities } = useEngine();
  const text = useText();
  const { mutate } = useSWRConfig();
  const label = entities[entity].def.label;
  const [rows, setRows] = useState<WireRecord[]>([]);
  // separado das linhas para o texto não mudar durante a animação de saída
  const [open, setOpen] = useState(false);
  const singular = text(label.singular).toLowerCase();
  const plural = text(label.plural).toLowerCase();
  // "Excluída." / "Os ... selecionadas", pelo gênero do nome
  const o = label.gender === 'f' ? 'a' : 'o';

  async function confirm() {
    const done: string[] = [];
    for (const row of rows) {
      try {
        await client.remove(entity, row.id!);
        done.push(row.id!);
      } catch {
        // segue com as outras; o aviso conta as que ficaram
      }
    }
    mutate((key) => Array.isArray(key) && key[0] === 'c3-list' && key[1] === entity);
    onDone(done);
    const failed = rows.length - done.length;
    notify(deleteResultText(done.length, rows.length, label.gender), failed ? 'error' : 'success');
  }

  const dialog = (
    <ConfirmDialog
      open={open}
      title={rows.length === 1 ? `Excluir ${singular}?` : `Excluir ${rows.length} ${plural}?`}
      description={
        rows.length === 1 ? (
          <>
            <b>{titleOf(rows[0])}</b> será removid{o}. Essa ação não pode ser desfeita.
          </>
        ) : (
          `${o === 'a' ? 'As' : 'Os'} ${plural} selecionad${o}s serão removid${o}s. Essa ação não pode ser desfeita.`
        )
      }
      onClose={() => setOpen(false)}
      onConfirm={confirm}
    />
  );

  const askDelete = (list: WireRecord[]) => {
    setRows(list);
    setOpen(true);
  };
  return { askDelete, dialog };
}
