import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import { evaluate } from '../conditions.mjs';
import { FormSkeleton, SettingsGroup } from '@c3theme/ui';
import { useEngine, useText } from '../context';
import { groupSections } from '../formTabs';
import useAutosave, { type SaveState } from '../hooks/useAutosave';
import useClientPlatform, { onPlatform } from '../hooks/useClientPlatform';
import { fieldTypes, sectionGates } from '../sectionVisibility';
import { settingEntries, type SettingEntry } from '../settingsSearch';
import type { FieldDef } from '../types';
import { extraReadOnly, recordTitle } from '../views';
import AutosaveGroup, { AutosaveRow, type RowContext } from './autosave/AutosaveGroup';
import ConfirmChangeDialog from './autosave/ConfirmChangeDialog';
import SettingsSearchBox from './autosave/SettingsSearchBox';
import useGuardedChange from './autosave/useGuardedChange';

const STATE_TEXT: Record<SaveState, string> = { idle: '', saving: 'Salvando…', saved: 'Salvo', error: 'Não salvo' };
const RESTART = 'Reinicie o app para aplicar esta mudança.';

/**
 * Configuração que vale na hora (`views.form.autosave` em entidade `singleton`, #160): abre editável, sem Editar
 * nem Salvar. Booleano vira a linha de ajuste (rótulo à esquerda, switch à direita); o resto usa o campo normal,
 * que grava ao mudar (select, data) ou ao sair (texto). Seções com `tab` viram abas (a aberta fica em `?tab=`), com
 * a busca (`search`) que leva ao ajuste, a confirmação do `confirmChange` e o aviso do `restart` (#110).
 */
export default function AutosaveForm({ entity, id }: { entity: string; id: string }) {
  const { client, entities } = useEngine();
  const text = useText();
  const platform = useClientPlatform();
  const [params, setParams] = useSearchParams();
  const [highlight, setHighlight] = useState<string>();
  const [restart, setRestart] = useState<FieldDef[]>([]);
  const { capabilities } = entities[entity];
  const { data: loaded, error } = useSWR(['c3-record', entity, id], () => client.get(entity, id));
  const saved = (f: FieldDef) => f.restart && setRestart((r) => (r.includes(f) ? r : [...r, f]));
  const auto = useAutosave(entity, id, loaded, saved);
  const { def, record, errors, state, formError } = auto;
  const types = useMemo(() => fieldTypes(def), [def]);
  const gates = useMemo(() => sectionGates(def), [def]);
  const guarded = useGuardedChange(auto, types);
  const declared = def.views?.form?.sections ?? [{ rows: def.fields.filter((f) => !f.readOnly).map((f) => [f.name]) }];
  const sections = declared.filter((s) => onPlatform(s, platform));
  const { head, tabs } = groupSections(sections);
  const current = tabs.find((t) => t.key === params.get('tab')) ?? tabs[0];
  const entries = settingEntries(def, sections, text);

  // a linha achada pela busca: rola até ela e o destaque some depois de um tempo
  useEffect(() => {
    if (!highlight) return;
    document.querySelector(`[data-setting="${highlight}"]`)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    const t = setTimeout(() => setHighlight(undefined), 2500);
    return () => clearTimeout(t);
  }, [highlight]);

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!loaded) return <FormSkeleton />;

  const openTab = (key: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', key);
    setParams(next, { replace: true });
  };
  const pick = (e: SettingEntry) => {
    if (e.tab && tabs.length > 1) openTab(e.tab);
    setHighlight(e.field);
  };
  const canUpdate = capabilities.update && (loaded._can?.update ?? true);
  const ctx: RowContext = {
    entity,
    def,
    record,
    errors,
    types,
    gates,
    highlight,
    required: (f) => Boolean(f.required) || Boolean(f.requiredWhen && evaluate(f.requiredWhen, record, types)),
    locked: (f) =>
      !canUpdate ||
      f.readOnly ||
      f.denied === 'readOnly' ||
      Boolean(f.createOnly || (f.readOnlyWhen && evaluate(f.readOnlyWhen, loaded, types))),
    change: guarded.change,
    commit: guarded.commit
  };
  const shown = tabs.length > 1 ? [...head, ...current.sections] : sections;
  const extra = extraReadOnly(def, declared);
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h4">{recordTitle(def, loaded) || text(def.label.singular)}</Typography>
        <Typography variant="body2" role="status" aria-live="polite" color={state === 'error' ? 'error' : 'text.secondary'}>
          {STATE_TEXT[state]}
        </Typography>
      </Stack>
      {def.views?.form?.search && <SettingsSearchBox entries={entries} onPick={pick} />}
      {restart.length > 0 && (
        <Alert severity="warning" role="status">
          {restart
            .map((f) => (f.restart === true ? RESTART : text(f.restart, RESTART)))
            .filter((m, i, all) => all.indexOf(m) === i)
            .join(' ')}
        </Alert>
      )}
      {formError && <Alert severity="error">{formError}</Alert>}
      {tabs.length > 1 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={current.key}
            onChange={(_, v: string) => openTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Abas das configurações"
          >
            {tabs.map((t) => (
              <Tab key={t.key} value={t.key} label={text(t.label)} />
            ))}
          </Tabs>
        </Box>
      )}
      <Stack spacing={2.5} role={tabs.length > 1 ? 'tabpanel' : undefined} aria-label={tabs.length > 1 ? text(current.label) : undefined}>
        {shown.map((s, i) => (
          <AutosaveGroup key={`${current?.key ?? ''}-${i}`} section={s} ctx={ctx} />
        ))}
      </Stack>
      {extra.length > 0 && (
        <SettingsGroup>
          {extra.map((f) => (
            <AutosaveRow key={f.name} f={f} ctx={ctx} />
          ))}
        </SettingsGroup>
      )}
      <ConfirmChangeDialog pending={guarded.pending} onConfirm={guarded.confirm} onCancel={guarded.cancel} />
    </Stack>
  );
}
