// material-ui
import Grid from '@mui/material/Grid';

import FieldInput from './FieldInput';
import GridInput from './GridInput';
import type useActionInput from '../hooks/useActionInput';

/** Campos do input de uma ação, na disposição de `input.rows` (padrão: um por linha). A grade ocupa a linha toda. */
export default function ActionInputs({
  form,
  rows,
  error
}: {
  form: ReturnType<typeof useActionInput>;
  rows?: string[][];
  error: (name: string) => string | undefined;
}) {
  const all = [...form.fields, ...form.grids];
  if (all.length === 0) return null;
  const layout = rows ?? all.map((f) => [f.name]);
  return (
    <Grid container spacing={2.5}>
      {layout.flatMap((row) => {
        const grid = form.grids.find((g) => row.includes(g.name));
        if (grid)
          return [
            <Grid key={grid.name} size={12}>
              <GridInput grid={grid} form={form} error={error} />
            </Grid>
          ];
        const items = row.map((name) => form.fields.find((f) => f.name === name)!).filter((f) => f && form.visible(f));
        return items.map((f) => (
          <Grid key={f.name} size={{ xs: 12, sm: 12 / items.length }}>
            <FieldInput
              field={f}
              value={form.input[f.name]}
              onChange={(v) => form.change(f.name, v)}
              error={error(f.name)}
              required={form.required(f)}
            />
          </Grid>
        ));
      })}
    </Grid>
  );
}
