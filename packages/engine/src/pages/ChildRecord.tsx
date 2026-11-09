import { useMemo } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { Panel } from '@c3theme/ui';
import { evaluate } from '../conditions.mjs';
import { useEngine, useText } from '../context';
import { childLayout, defaults, rowErrors } from '../formValues';
import FieldInput from '../widgets/FieldInput';
import WithLookup from '../widgets/WithLookup';
import useLookups from '../hooks/useLookups';
import type { FieldDef, FieldType, RelatedDef, Text, WireRecord } from '../types';

export interface ChildRecordProps {
  related: RelatedDef;
  title?: Text;
  rows: WireRecord[];
  onChange: (rows: WireRecord[]) => void;
  errors: Record<string, string>;
  editing: boolean;
}

/**
 * Seção `with_parent` de uma linha só (`maxItems: 1`): os campos da filha aparecem direto na seção, como se
 * fossem do pai (dados fiscais do emitente, endereço de entrega). Com `minItems: 0`, uma chave liga e desliga
 * a linha; desligar uma linha gravada só a exclui no Salvar do pai.
 */
export default function ChildRecord({ related, title, rows, onChange, errors, editing }: ChildRecordProps) {
  const { entities } = useEngine();
  const text = useText();
  const child = entities[related.entity];
  const def = child?.def;
  const types = useMemo(() => Object.fromEntries((def?.fields ?? []).map((f) => [f.name, f.type])) as Record<string, FieldType>, [def]);
  // consulta (CEP) na linha: a mudança cria a linha virtual, como digitar
  const lookup = useLookups(def, rows[0] ?? {}, editing, (v) => onChange([{ ...(rows[0] ?? defaults(def!)), ...v }]));
  if (!def) return null;

  const optional = (related.minItems ?? 0) === 0;
  // obrigatória e ainda sem linha (registro novo): edita uma linha virtual, criada na primeira mudança
  const row = rows[0] ?? (optional ? undefined : defaults(def));
  const errs = rowErrors(errors, related.entity, 0);
  const listError = errors[related.entity];
  const singular = text(def.label.singular);
  const visible = (f: FieldDef) => !f.visibleWhen || evaluate(f.visibleWhen, row ?? {}, types);
  const required = (f: FieldDef) => Boolean(f.required) || Boolean(f.requiredWhen && evaluate(f.requiredWhen, row ?? {}, types));
  const layout = childLayout(def, related.field)
    .map((line) => line.filter(visible))
    .filter((line) => line.length > 0);

  const toggle = editing && optional && (
    <FormControlLabel
      control={<Switch checked={Boolean(row)} onChange={(e) => onChange(e.target.checked ? [defaults(def)] : [])} />}
      label="Informar"
      labelPlacement="start"
    />
  );

  return (
    <Panel title={text(title ?? def.label.singular)} action={toggle || undefined}>
      {listError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {listError}
        </Alert>
      )}
      {!row ? (
        <Typography color="text.secondary">
          {editing ? `Sem ${singular.toLowerCase()}. Ligue "Informar" para preencher.` : 'Não informado.'}
        </Typography>
      ) : (
        <Grid container spacing={2.5}>
          {layout.flatMap((line) =>
            line.map((f) => (
              <Grid key={f.name} size={{ xs: 12, md: 12 / line.length }}>
                <WithLookup button={lookup(f.name)}>
                  <FieldInput
                    field={f}
                    value={row[f.name]}
                    record={row}
                    onChange={(v) => onChange([{ ...row, [f.name]: v }])}
                    error={errs[f.name]}
                    required={editing && !f.readOnly && required(f)}
                    readOnly={!editing || f.readOnly}
                  />
                </WithLookup>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Panel>
  );
}
