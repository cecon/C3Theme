import { useMemo } from 'react';

import Button from '@mui/material/Button';

import { notify } from '@c3theme/ui';
import { evaluate } from '../conditions.mjs';
import { useEngine, useText } from '../context';
import useAction from '../hooks/useAction';
import type { FieldType, WireRecord } from '../types';
import { plain } from './bulkText';

/**
 * Ação de registro direto na linha ou no cartão (`rowActions: [{ "action": "instalar" }]`, #13): roda no clique,
 * sem abrir o registro. Só aparece com a permissão e com o `visibleWhen` da ação valendo para a linha.
 */
export default function RowActionButton({
  entity,
  row,
  action,
  size = 'small'
}: {
  entity: string;
  row: WireRecord;
  action: string;
  size?: 'small' | 'medium';
}) {
  const { entities } = useEngine();
  const text = useText();
  const { def, capabilities } = entities[entity];
  const { run, running } = useAction(entity);
  const types = useMemo(() => Object.fromEntries(def.fields.map((f) => [f.name, f.type])) as Record<string, FieldType>, [def]);
  const a = def.actions?.find((x) => x.name === action && x.target !== 'list');
  if (!a || !capabilities.actions?.[a.name] || (a.visibleWhen && !evaluate(a.visibleWhen, plain(row), types))) return null;
  return (
    <Button
      size={size}
      variant="outlined"
      loading={running}
      onClick={(e) => {
        e.stopPropagation();
        void run(String(row.id), a.name).then((r) =>
          r
            ? notify(r.message ?? (a.successMessage ? text(a.successMessage) : 'Feito.'))
            : notify('Não deu para concluir. Tente de novo.', 'error')
        );
      }}
    >
      {text(a.label, a.name)}
    </Button>
  );
}
