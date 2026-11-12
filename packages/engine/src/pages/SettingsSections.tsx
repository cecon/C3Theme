import { useState, type ReactNode } from 'react';
import { useInRouterContext, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import { useEngine, useText } from '../context';
import { groupSections } from '../formTabs';
import type { EntityDef, FormSection } from '../types';

interface Props {
  def: EntityDef;
  sections: FormSection[];
  render: (s: FormSection, i: number) => ReactNode;
}
interface Navigation {
  active?: string;
  select: (key: string) => void;
}
function Routed(props: Props) {
  const [params, setParams] = useSearchParams();
  return (
    <Content
      {...props}
      active={params.get('tab') ?? undefined}
      select={(key) => {
        const next = new URLSearchParams(params);
        next.set('tab', key);
        setParams(next, { replace: true });
      }}
    />
  );
}
function Local(props: Props) {
  const [active, select] = useState<string>();
  return <Content {...props} active={active} select={select} />;
}
function Content({ def, sections, render, active, select }: Props & Navigation) {
  const text = useText();
  const engine = useEngine();
  const platform = engine.platform ?? (engine.desktop ? 'desktop' : 'web');
  const available = sections.filter((s) => (!s.platforms || s.platforms.includes(platform)) && s.rows?.some((r) => r.length > 0));
  const { head, tabs } = groupSections(available);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState<string>();
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase();
  const found = available
    .flatMap((s) => (s.rows ?? []).flat().map((c) => ({ s, name: typeof c === 'string' ? c : c.field })))
    .filter(({ name }) => {
      const f = def.fields.find((f) => f.name === name);
      return (
        f && [text(f.label, f.name), ...(f.keywords ?? []).map((k) => text(k))].some((v) => normalize(v).includes(normalize(query.trim())))
      );
    });
  const show = (list: FormSection[]) =>
    list.map((s, i) => (
      <Box
        key={i}
        sx={{ ['& [data-setting="' + highlight + '"]']: { outline: '2px solid', outlineColor: 'primary.main', borderRadius: 1 } }}
      >
        {render(s, i)}
      </Box>
    ));
  return (
    <>
      <TextField label="Buscar nas configurações" value={query} onChange={(e) => setQuery(e.target.value)} />
      {query.trim() && (
        <Stack aria-label="Resultados da busca">
          {found.length
            ? found.map(({ s, name }, i) => (
                <Button
                  key={i}
                  onClick={() => {
                    if (s.tab) select(typeof s.tab === 'string' ? s.tab : s.tab.id);
                    setHighlight(name);
                    setQuery('');
                    requestAnimationFrame(() => {
                      const row = document.querySelector<HTMLElement>(`[data-setting="${name}"]`);
                      row?.scrollIntoView?.({ block: 'center' });
                      row?.querySelector<HTMLElement>('input,button,select,textarea')?.focus();
                    });
                  }}
                >
                  {text(def.fields.find((f) => f.name === name)?.label, name)}
                </Button>
              ))
            : 'Nenhuma configuração encontrada.'}
        </Stack>
      )}
      {show(head)}
      {tabs.length > 0 && (
        <>
          <Tabs
            value={current.key}
            onChange={(_, key: string) => select(key)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Abas das configurações"
          >
            {tabs.map((t) => (
              <Tab key={t.key} value={t.key} label={text(t.label)} />
            ))}
          </Tabs>
          <Stack spacing={2.5} role="tabpanel" aria-label={text(current.label)}>
            {show(current.sections)}
          </Stack>
        </>
      )}
    </>
  );
}
export default function SettingsSections(props: Props) {
  return useInRouterContext() ? <Routed {...props} /> : <Local {...props} />;
}
