import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import SettingsSections from './SettingsSections';
import { useMemo } from 'react';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { evaluate } from '../conditions.mjs';
import { FormSkeleton, SettingsGroup, SettingsRow, SettingsSwitch } from '@c3theme/ui';
import { useEngine, useText } from '../context';
import useAutosave, { type SaveState } from '../hooks/useAutosave';
import { fieldTypes, fieldVisible, sectionGates, sectionVisible } from '../sectionVisibility';
import type { FieldDef, FormSection } from '../types';
import { extraReadOnly, recordTitle } from '../views';
import FieldInput from '../widgets/FieldInput';

const STATE_TEXT: Record<SaveState, string> = { idle: '', saving: 'Salvando…', saved: 'Salvo', error: 'Não salvo' };

/**
 * Configuração que vale na hora (`views.form.autosave` em entidade `singleton`, #160): abre editável, sem Editar
 * nem Salvar. Booleano vira a linha de ajuste (rótulo à esquerda, switch à direita); o resto usa o campo normal,
 * que grava ao mudar (select, data) ou ao sair (texto). `visibleWhen` vale para os valores na tela.
 */
export default function AutosaveForm({ entity, id }: { entity: string; id: string }) {
  const { client, entities } = useEngine();
  const text = useText();
  const { capabilities } = entities[entity];
  const { data: loaded, error } = useSWR(['c3-record', entity, id], () => client.get(entity, id));
  const { def, record, errors, state, formError, change, commit, pending, confirm, cancel, restart } = useAutosave(entity, id, loaded);
  const types = useMemo(() => fieldTypes(def), [def]);
  const gates = useMemo(() => sectionGates(def), [def]);
  const sections = def.views?.form?.sections ?? [{ rows: def.fields.filter((f) => !f.readOnly).map((f) => [f.name]) }];

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!loaded) return <FormSkeleton />;

  const canUpdate = capabilities.update && (loaded._can?.update ?? true);
  const required = (f: FieldDef) => Boolean(f.required) || Boolean(f.requiredWhen && evaluate(f.requiredWhen, record, types));
  const locked = (f: FieldDef) =>
    !canUpdate ||
    f.readOnly ||
    f.denied === 'readOnly' ||
    Boolean(f.createOnly || (f.readOnlyWhen && evaluate(f.readOnlyWhen, loaded, types)));

  const row = (f: FieldDef, component?: string) => {
    const label = text(f.label, f.name);
    const help = f.help ? text(f.help) : undefined;
    if (f.type === 'boolean' && !component)
      return (
        <Box key={f.name} data-setting={f.name}>
          <SettingsRow label={label} description={errors[f.name] ?? help} disabled={locked(f)}>
            <SettingsSwitch checked={record[f.name] === true} onChange={(v) => change(f, v, required(f))} />
          </SettingsRow>
        </Box>
      );
    return (
      // texto e número gravam ao sair do campo (o foco deixa a linha)
      <Box
        key={f.name}
        data-setting={f.name}
        sx={{ px: 2, py: 1.5 }}
        onBlur={() => {
          if (!locked(f)) void commit(f, record[f.name], required(f));
        }}
      >
        <FieldInput
          field={f}
          component={component}
          value={record[f.name]}
          onChange={(v) => change(f, v, required(f))}
          error={errors[f.name]}
          required={required(f)}
          readOnly={locked(f)}
          existing
          record={record}
          entity={entity}
        />
      </Box>
    );
  };

  const group = (s: FormSection, key: number) => {
    if (!sectionVisible(s, record, types)) return null;
    const cells = (s.rows ?? [])
      .flat()
      .map((c) => (typeof c === 'string' ? { field: c } : c))
      .map((c) => ({ ...c, def: def.fields.find((f) => f.name === c.field) }))
      .filter((c) => c.def && !c.def.denied && fieldVisible(c.def, record, types, gates));
    if (!cells.length) return null;
    return (
      <SettingsGroup key={key} title={s.title ? text(s.title) : undefined} footnote={s.description ? text(s.description) : undefined}>
        {cells.map((c) => row(c.def!, c.component))}
      </SettingsGroup>
    );
  };

  const extra = extraReadOnly(def, sections);
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h4">{recordTitle(def, loaded) || text(def.label.singular)}</Typography>
        <Typography variant="body2" role="status" aria-live="polite" color={state === 'error' ? 'error' : 'text.secondary'}>
          {STATE_TEXT[state]}
        </Typography>
      </Stack>
      {pending && (
        <Dialog open onClose={cancel} aria-labelledby="setting-confirm-title">
          <DialogTitle id="setting-confirm-title">{text(pending.field.confirmChange!.question)}</DialogTitle>
          <DialogContent>{text(pending.field.confirmChange!.effect)}</DialogContent>
          <DialogActions>
            <Button onClick={cancel}>Cancelar</Button>
            <Button onClick={confirm}>Confirmar</Button>
          </DialogActions>
        </Dialog>
      )}
      {restart && <Alert severity="info">{text(restart.restartNotice)}</Alert>}
      {formError && <Alert severity="error">{formError}</Alert>}
      <SettingsSections
        def={def}
        sections={sections
          .filter((s) => sectionVisible(s, record, types))
          .map((s) => ({
            ...s,
            rows: s.rows?.map((r) =>
              r.filter((c) => {
                const f = def.fields.find((f) => f.name === (typeof c === 'string' ? c : c.field));
                return f && !f.denied && fieldVisible(f, record, types, gates);
              })
            )
          }))}
        render={group}
      />
      {extra.length > 0 && <SettingsGroup>{extra.map((f) => row(f))}</SettingsGroup>}
    </Stack>
  );
}
