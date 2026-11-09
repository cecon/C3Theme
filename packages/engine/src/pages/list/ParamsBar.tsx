import { useEffect, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

import { ApiError } from '../../api';
import type { EntityDef, WireRecord } from '../../types';
import FieldInput from '../../widgets/FieldInput';
import { paramChanges } from './sourceParams';
import type { ListQuery } from './useListQuery';

/**
 * Faixa de parâmetros de uma consulta do sistema, acima dos filtros: o usuário preenche e "Consultar" põe os valores
 * na URL (voltar e compartilhar funcionam). Erro 422 da consulta aparece no campo.
 */
export default function ParamsBar({ def, query, error }: { def: EntityDef; query: ListQuery; error?: unknown }) {
  const fields = def.params?.fields ?? [];
  const applied = query.sourceParams ?? {};
  const [draft, setDraft] = useState<WireRecord>(applied);
  const appliedKey = JSON.stringify(applied);
  // a URL mudou por fora (voltar, link): a faixa mostra o que está aplicado
  useEffect(() => setDraft(JSON.parse(appliedKey)), [appliedKey]);
  if (fields.length === 0) return null;
  const fieldErrors = error instanceof ApiError ? error.fields : undefined;
  const dirty = fields.some((f) => String(draft[f.name] ?? '') !== String(applied[f.name] ?? ''));

  return (
    <Grid
      container
      spacing={1.5}
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        query.set(paramChanges(def, draft));
      }}
      sx={{ px: 2, pt: 2, alignItems: 'center' }}
    >
      {fields.map((f) => (
        <Grid key={f.name} size={{ xs: 12, sm: 6, md: 3 }}>
          <FieldInput
            field={f}
            value={draft[f.name]}
            onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
            error={fieldErrors?.[f.name]?.[0]?.message}
            required={f.required}
          />
        </Grid>
      ))}
      <Grid size={{ xs: 12, sm: 'auto' }}>
        <Button type="submit" variant={dirty ? 'contained' : 'outlined'}>
          Consultar
        </Button>
      </Grid>
    </Grid>
  );
}
