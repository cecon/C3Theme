// material-ui
import Box from '@mui/material/Box';

import useActionPreview from '../hooks/useActionPreview';
import type useActionInput from '../hooks/useActionInput';
import type { ActionDef } from '../types';
import ActionInputs from './ActionInputs';
import ActionPreviewPanel from './ActionPreviewPanel';
import RepeatLog, { type useRepeatLog } from './RepeatLog';

/**
 * Conteúdo do diálogo da ação: os campos e, em ação `preview: true`, a prévia do sistema. A prévia é pedida ao
 * abrir e ao sair de um campo (o foco deixa o campo), não a cada tecla. `bulk`: sem prévia (vários registros), a
 * não ser em conjunto, com a seleção em `ids`.
 */
export default function ActionBody({
  entity,
  id,
  action,
  form,
  error,
  bulk = false,
  ids,
  log
}: {
  entity: string;
  id?: string;
  action: ActionDef | null;
  form: ReturnType<typeof useActionInput>;
  error: (name: string) => string | undefined;
  bulk?: boolean;
  ids?: string[];
  /** Ação `repeat`: as últimas leituras, mostradas embaixo dos campos. */
  log?: ReturnType<typeof useRepeatLog>['items'];
}) {
  const preview = useActionPreview(entity, bulk && !ids ? null : action, id, form, ids);
  return (
    <>
      <Box onBlur={preview.enabled ? preview.refresh : undefined}>
        <ActionInputs form={form} rows={action?.input?.rows} error={error} />
      </Box>
      {preview.enabled && <ActionPreviewPanel state={preview} />}
      {log && <RepeatLog items={log} />}
    </>
  );
}
