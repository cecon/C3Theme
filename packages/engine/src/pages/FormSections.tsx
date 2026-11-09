import { useEffect, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { useEngine, useText } from '../context';
import { errorCount, groupSections } from '../formTabs';
import useLookups from '../hooks/useLookups';
import FormSection, { sectionShown, type SectionContext } from './FormSection';
import type { FormSection as Section } from '../types';

/** Junta seções seguidas com `width` que somam até 12 numa linha; as outras ficam sozinhas. */
export function sideBySide(list: Section[]): Section[][] {
  const lines: Section[][] = [];
  for (const s of list) {
    const last = lines[lines.length - 1];
    const used = last?.reduce((n, x) => n + (x.width ?? 12), 0) ?? 12;
    if (last && s.width && last.every((x) => x.width) && used + s.width <= 12) last.push(s);
    else lines.push([s]);
  }
  return lines;
}

/**
 * Seções do formulário. As sem `tab` ficam em cima, sempre visíveis; as com `tab` viram abas, cada uma com a
 * contagem de erros. No celular a barra de abas rola na horizontal.
 */
export default function FormSections({ sections, ctx: form }: { sections: Section[]; ctx: SectionContext }) {
  const { components } = useEngine();
  const ctx = {
    ...form,
    lookup: useLookups(form.def, form.record, form.editing, (values) => Object.entries(values).forEach(([k, v]) => form.change(k, v)))
  };
  const text = useText();
  const { head, tabs: all } = groupSections(sections);
  // aba sem nada para mostrar (ex.: filhos com CRUD próprio no registro novo) não aparece
  const tabs = all.filter((t) => t.sections.some((s) => sectionShown(s, ctx, components)));
  const counts = tabs.map((t) => errorCount(t, ctx.errors));
  const [active, setActive] = useState<string>();
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  // erro novo (ao salvar) numa aba fechada: abre a primeira aba com erro, se a atual não tem nenhum
  const total = counts.reduce((a, b) => a + b, 0);
  const lastTotal = useRef(total);
  useEffect(() => {
    const grew = total > lastTotal.current;
    lastTotal.current = total;
    if (!grew || !current || counts[tabs.indexOf(current)] > 0) return;
    const first = counts.findIndex((n) => n > 0);
    if (first >= 0) setActive(tabs[first].key);
  }, [total]); // eslint-disable-line react-hooks/exhaustive-deps

  const render = (list: Section[]) =>
    sideBySide(list.filter((s) => sectionShown(s, ctx, components))).map((line, i) =>
      line.length === 1 ? (
        <FormSection key={i} section={line[0]} ctx={ctx} />
      ) : (
        <Grid key={i} container spacing={2.5}>
          {line.map((s, j) => (
            <Grid key={j} size={{ xs: 12, md: s.width }}>
              <FormSection section={s} ctx={ctx} fill />
            </Grid>
          ))}
        </Grid>
      )
    );
  if (tabs.length <= 1) return <>{render([...head, ...(tabs[0]?.sections ?? [])])}</>;

  return (
    <>
      {render(head)}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={current.key}
          onChange={(_, v: string) => setActive(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Abas do formulário"
        >
          {tabs.map((t, i) => {
            const label = text(t.label);
            const n = counts[i];
            return (
              <Tab
                key={t.key}
                value={t.key}
                aria-label={n ? `${label}, ${n} ${n === 1 ? 'erro' : 'erros'}` : label}
                label={
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <span>{label}</span>
                    {n > 0 && <Chip size="small" color="error" label={n} sx={{ height: 20, minWidth: 20 }} />}
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
      </Box>
      <Stack spacing={2.5} role="tabpanel" aria-label={text(current.label)}>
        {render(current.sections)}
      </Stack>
    </>
  );
}
