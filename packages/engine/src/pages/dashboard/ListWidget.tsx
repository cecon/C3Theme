import { useState } from 'react';

// material-ui
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';

import { fieldLabel, useEngine, useText } from '../../context';
import { bothWhere, ListWidget as List } from '../../dashboard';
import { listTabs, localWhere } from '../../dashboardList';
import { findOption } from '../../format';
import ListWidgetTable from './ListWidgetTable';

/**
 * Lista do painel: com `tabs`, uma aba por entidade e filtro ("A receber" / "A pagar"); com `filter`, um seletor do
 * campo enum ou boolean filtra sem sair do painel. A tabela em si é a `ListWidgetTable`.
 */
export default function ListWidget({ widget }: { widget: List }) {
  const { entities } = useEngine();
  const text = useText();
  // aba de entidade que o usuário não lista não aparece
  const tabs = listTabs(widget).filter((t) => entities[t.entity]?.capabilities.list);
  const [tab, setTab] = useState(0);
  const [value, setValue] = useState('');
  const current = tabs[Math.min(tab, tabs.length - 1)];
  if (!current) return null;
  const def = entities[current.entity].def;
  const field = widget.filter ? def.fields.find((f) => f.name === widget.filter) : undefined;
  const shown = { ...current, where: bothWhere(current.where, localWhere(def, field?.name, value)) };
  const options = field?.type === 'boolean' ? [true, false] : (field?.options ?? []).map((o) => o.value);
  const optionText = (v: (typeof options)[number]) =>
    typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : text(findOption(field!, v)?.label, String(v));

  return (
    <>
      {(tabs.length > 1 || field) && (
        <Stack direction="row" sx={{ px: 1.5, gap: 1, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          {tabs.length > 1 && (
            <Tabs value={tab} onChange={(_, i: number) => setTab(i)} variant="scrollable" sx={{ flex: 1, minHeight: 44 }}>
              {tabs.map((t, i) => (
                <Tab key={i} value={i} label={text(t.label ?? '')} sx={{ minHeight: 44 }} />
              ))}
            </Tabs>
          )}
          {field && (
            <TextField
              select
              size="small"
              label={fieldLabel(field, text)}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              sx={{ my: 1, ml: 'auto', minWidth: 160 }}
              // "Todos" é o valor vazio: aparece escrito, com o rótulo na borda
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {options.map((o) => (
                <MenuItem key={String(o)} value={String(o)}>
                  {optionText(o)}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
      )}
      <ListWidgetTable key={`${tab}:${value}`} widget={shown} />
    </>
  );
}
