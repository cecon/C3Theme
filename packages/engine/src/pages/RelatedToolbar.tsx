// Busca e presets da filha numa seção `related` (#38): `search: true` põe a busca de `views.list.search`, e
// `presets: true` os filtros nomeados como abas ("Todos", "Só não contados", "Só com diferença").
import { useEffect, useState } from 'react';

// material-ui
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';

// third-party
import { SearchNormal1 } from 'iconsax-reactjs';

import { useText } from '../context';
import type { EntityDef } from '../types';

export default function RelatedToolbar({
  def,
  search,
  presets,
  q,
  onSearch,
  preset,
  onPreset
}: {
  def: EntityDef;
  search?: boolean;
  presets?: boolean;
  q: string;
  onSearch: (q: string) => void;
  preset: string;
  onPreset: (id: string) => void;
}) {
  const text = useText();
  const [typed, setTyped] = useState(q);
  // a busca espera a pessoa parar de digitar: não é uma requisição por tecla
  useEffect(() => {
    const t = setTimeout(() => typed !== q && onSearch(typed), 350);
    return () => clearTimeout(t);
  }, [typed]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = def.views?.list ?? {};
  const tabs = presets ? [{ id: '', label: text(list.presetTabs?.all ?? 'Todos') }, ...(list.presets ?? [])] : [];
  if (!search && !tabs.length) return null;
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ px: 2, pb: 1, gap: 1, alignItems: { md: 'center' } }}>
      {tabs.length > 0 && (
        <Tabs value={preset} onChange={(_, id: string) => onPreset(id)} variant="scrollable" allowScrollButtonsMobile sx={{ flex: 1 }}>
          {tabs.map((t) => (
            <Tab key={t.id} value={t.id} label={text(t.label)} sx={{ minHeight: 44 }} />
          ))}
        </Tabs>
      )}
      {search && (
        <TextField
          size="small"
          placeholder="Buscar"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          sx={{ width: { xs: '100%', md: 260 }, ml: { md: 'auto' } }}
          slotProps={{
            htmlInput: { 'aria-label': `Buscar ${text(def.label.plural).toLowerCase()}` },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={16} />
                </InputAdornment>
              )
            }
          }}
        />
      )}
    </Stack>
  );
}
