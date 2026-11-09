// material-ui
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

// third-party
import { SearchNormal1 } from 'iconsax-reactjs';

import { OrgState, useText } from '../../context';
import type { ReactNode } from 'react';

import type { EntityDef } from '../../types';
import BranchesFilter from './BranchesFilter';
import DateRangeFilter from './DateRangeFilter';
import type { ListQuery } from './useListQuery';

/**
 * Barra da lista numa linha só: à esquerda busca livre, filiais e filtros de enum/booleano; à direita os botões
 * (`actions`). Os presets ficam numa linha embaixo.
 */
export default function ListToolbar({
  def,
  query,
  scoped,
  total,
  actions
}: {
  def: EntityDef;
  query: ListQuery;
  scoped?: OrgState;
  /** Registros da lista sem a busca, para o placeholder ("Em 42 clientes"). */
  total?: number;
  actions?: ReactNode;
}) {
  const text = useText();
  const list = def.views?.list ?? {};
  const { params, set, presetId, search, setSearch, shownBranches, branchesParam } = query;
  const fromWidget = params.has('w');
  const filterable = (list.filters ?? [])
    .map((x) => (typeof x === 'string' ? { field: x } : x))
    .map((x) => ({ ...def.fields.find((f) => f.name === x.field)!, all: x.all }))
    .filter((f) => f.name && (f.type === 'enum' || f.type === 'boolean'));

  // o placeholder diz onde a busca procura: "Em 42 clientes"
  const searchHint = list.searchHint
    ? text(list.searchHint)
    : total === undefined
      ? undefined
      : `Em ${total} ${text(total === 1 ? def.label.singular : def.label.plural).toLowerCase()}`;
  // com abas, os presets estão nelas: a linha de chips fica só para o recorte do painel
  const chips = list.presetTabs ? [] : (list.presets ?? []);
  const presetRow = chips.length > 0 || fromWidget;

  return (
    <Stack sx={{ gap: 1.5, p: 2.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, flex: 1, flexWrap: 'wrap' }}>
          {list.search && list.search.length > 0 && (
            <TextField
              size="small"
              label="Buscar"
              placeholder={searchHint}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              // sem filtro de seleção ao lado, a busca ocupa a sobra da linha
              sx={filterable.length ? { minWidth: { sm: 280 } } : { flex: 1, minWidth: { md: 240 } }}
              slotProps={{
                htmlInput: { 'aria-label': `Buscar ${text(def.label.plural).toLowerCase()}` },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchNormal1 size={18} />
                    </InputAdornment>
                  )
                }
              }}
            />
          )}
          {scoped && (
            <BranchesFilter
              org={scoped}
              selected={shownBranches}
              explicit={Boolean(branchesParam)}
              onChange={(ids) => set({ branches: ids ? ids.join(',') : undefined })}
            />
          )}
          {filterable.map((f) => (
            <TextField
              key={f.name}
              select
              size="small"
              label={text(f.label, f.name)}
              value={params.get(`f.${f.name}`) ?? ''}
              onChange={(e) => set({ [`f.${f.name}`]: e.target.value || undefined })}
              sx={{ minWidth: 160 }}
              // com o rótulo fixo na borda, o filtro vazio mostra "Todos" em vez de ficar em branco
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">{text(f.all ?? 'Todos')}</MenuItem>
              {f.type === 'boolean'
                ? [
                    <MenuItem key="true" value="true">
                      Sim
                    </MenuItem>,
                    <MenuItem key="false" value="false">
                      Não
                    </MenuItem>
                  ]
                : f.options?.map((o) => (
                    <MenuItem key={o.value} value={String(o.value)}>
                      {text(o.label, String(o.value))}
                    </MenuItem>
                  ))}
            </TextField>
          ))}
          <DateRangeFilter def={def} query={query} />
        </Stack>
        {actions && (
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {actions}
          </Stack>
        )}
      </Stack>
      {presetRow && (
        // linha própria: os chips (32px) não ficam ao lado dos campos (40px) quando a barra quebra
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {fromWidget && (
            // recorte que veio de um widget do painel: fica até o usuário tirar
            <Chip label="Recorte do painel" color="primary" onDelete={() => set({ w: undefined })} />
          )}
          {chips.map((p) => (
            <Chip
              key={p.id}
              label={text(p.label)}
              color={p.id === presetId ? 'primary' : 'default'}
              variant={p.id === presetId ? 'filled' : 'outlined'}
              onClick={() => set({ preset: p.id === presetId ? '' : p.id })}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
