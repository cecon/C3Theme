// material-ui
import Box from '@mui/material/Box';

import { SettingsGroup, SettingsRow, SettingsSwitch } from '@c3theme/ui';
import { useText } from '../../context';
import type { FieldType } from '../../conditions.mjs';
import { fieldVisible, sectionVisible } from '../../sectionVisibility';
import type { Condition, EntityDef, FieldDef, FormSection, WireRecord } from '../../types';
import FieldInput from '../../widgets/FieldInput';

export interface RowContext {
  entity: string;
  def: EntityDef;
  record: WireRecord;
  errors: Record<string, string>;
  types: Record<string, FieldType>;
  gates: Map<string, Condition>;
  /** Ajuste achado pela busca: a linha fica destacada. */
  highlight?: string;
  locked: (f: FieldDef) => boolean;
  required: (f: FieldDef) => boolean;
  change: (f: FieldDef, value: unknown, required: boolean) => void;
  commit: (f: FieldDef, value: unknown, required: boolean) => void;
}

/** Uma linha de ajuste: booleano vira switch; o resto, o campo normal, que grava ao mudar ou ao sair. */
export function AutosaveRow({ f, component, ctx }: { f: FieldDef; component?: string; ctx: RowContext }) {
  const text = useText();
  const label = text(f.label, f.name);
  const help = f.help ? text(f.help) : undefined;
  const lit = ctx.highlight === f.name;
  const sx = { scrollMarginTop: 96, transition: 'background-color .3s', bgcolor: lit ? 'action.selected' : undefined };
  if (f.type === 'boolean' && !component)
    return (
      <Box data-setting={f.name} sx={sx}>
        <SettingsRow label={label} description={ctx.errors[f.name] ?? help} disabled={ctx.locked(f)}>
          <SettingsSwitch checked={ctx.record[f.name] === true} onChange={(v) => ctx.change(f, v, ctx.required(f))} />
        </SettingsRow>
      </Box>
    );
  return (
    // texto e número gravam ao sair do campo (o foco deixa a linha)
    <Box data-setting={f.name} sx={{ ...sx, px: 2, py: 1.5 }} onBlur={() => ctx.commit(f, ctx.record[f.name], ctx.required(f))}>
      <FieldInput
        field={f}
        component={component}
        value={ctx.record[f.name]}
        onChange={(v) => ctx.change(f, v, ctx.required(f))}
        error={ctx.errors[f.name]}
        required={ctx.required(f)}
        readOnly={ctx.locked(f)}
        existing
        record={ctx.record}
        entity={ctx.entity}
      />
    </Box>
  );
}

/** Seção como grupo de ajustes; some quando nada dela aparece. */
export default function AutosaveGroup({ section: s, ctx }: { section: FormSection; ctx: RowContext }) {
  const text = useText();
  if (!sectionVisible(s, ctx.record, ctx.types)) return null;
  const cells = (s.rows ?? [])
    .flat()
    .map((c) => (typeof c === 'string' ? { field: c } : c))
    .map((c) => ({ ...c, def: ctx.def.fields.find((f) => f.name === c.field) }))
    .filter((c) => c.def && !c.def.denied && fieldVisible(c.def, ctx.record, ctx.types, ctx.gates));
  if (!cells.length) return null;
  return (
    <SettingsGroup title={s.title ? text(s.title) : undefined} footnote={s.description ? text(s.description) : undefined}>
      {cells.map((c) => (
        <AutosaveRow key={c.field} f={c.def!} component={c.component} ctx={ctx} />
      ))}
    </SettingsGroup>
  );
}
