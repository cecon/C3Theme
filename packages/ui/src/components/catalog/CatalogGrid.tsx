import { useMemo, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

// third-party
import { SearchNormal1 } from 'iconsax-reactjs';

import EmptyState from '../EmptyState';
import { countByKind, filterCatalog, groupByCategory, type CatalogActionsProp, type CatalogItem, type CatalogKind } from './catalog';
import CatalogCard from './CatalogCard';
import { useCatalogText } from './catalogText';

const KINDS = ['all', 'agent', 'skill', 'app'] as const;
type KindFilter = (typeof KINDS)[number];

export interface CatalogGridProps {
  items: CatalogItem[];
  /** Callbacks para todos os tipos, ou um objeto por tipo (`{ agent: {...}, skill: {...}, app: {...} }`). */
  actions?: CatalogActionsProp;
  /** Abre o detalhe do item. */
  onSelect?: (item: CatalogItem) => void;
  /** Tipo marcado ao abrir. Padrão: tudo. */
  defaultKind?: CatalogKind | 'all';
  /** Esconde o filtro de tipos que não existem na lista (ex.: loja só de habilidades). Padrão: true. */
  hideEmptyKinds?: boolean;
  /** Título por categoria (`item.category`); sem categoria vai para "Outros", no fim. */
  groupByCategory?: boolean;
  /** Largura mínima de cada cartão; a grade põe quantas colunas couberem. */
  minCardWidth?: number;
  sx?: SxProps<Theme>;
}

/** Loja de itens instaláveis: filtro por tipo, busca e cartões, com agrupamento opcional por categoria. */
export default function CatalogGrid({
  items,
  actions,
  onSelect,
  defaultKind = 'all',
  hideEmptyKinds = true,
  groupByCategory: grouped = false,
  minCardWidth = 260,
  sx
}: CatalogGridProps) {
  const t = useCatalogText();
  const [kind, setKind] = useState<KindFilter>(defaultKind);
  const [query, setQuery] = useState('');
  const counts = useMemo(() => countByKind(items), [items]);
  const visible = useMemo(() => filterCatalog(items, { kind, query }), [items, kind, query]);
  const groups = useMemo(() => (grouped ? groupByCategory(visible) : []), [grouped, visible]);
  const kinds = KINDS.filter((k) => k === 'all' || !hideEmptyKinds || counts[k] > 0);

  const grid = (list: CatalogItem[], headingLevel: 'h3' | 'h4') => (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: `repeat(auto-fill, minmax(min(${minCardWidth}px, 100%), 1fr))` }}>
      {list.map((item) => (
        <CatalogCard key={item.id} item={item} actions={actions} onSelect={onSelect} headingLevel={headingLevel} />
      ))}
    </Box>
  );

  return (
    <Stack spacing={2.5} sx={sx}>
      <Stack direction="row" useFlexGap spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {kinds.length > 2 && (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={kind}
            onChange={(_, next: KindFilter | null) => next && setKind(next)}
            aria-label={t('c3.catalog.filter')}
          >
            {kinds.map((k) => (
              <ToggleButton key={k} value={k} sx={{ px: 1.5, gap: 0.75 }}>
                {t(`c3.catalog.kind.${k}`)}
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                  {counts[k]}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
        <TextField
          size="small"
          type="search"
          label={t('c3.catalog.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: '1 1 220px', maxWidth: 360, ml: { sm: 'auto' } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={18} aria-hidden />
                </InputAdornment>
              )
            }
          }}
        />
      </Stack>
      {visible.length === 0 ? (
        <EmptyState icon={<SearchNormal1 size={28} />} title={t('c3.catalog.empty')} description={t('c3.catalog.emptyHint')} />
      ) : grouped ? (
        groups.map((g) => (
          <Stack key={g.category ?? ''} component="section" spacing={1.5} aria-label={g.category ?? t('c3.catalog.noCategory')}>
            <Typography variant="subtitle2" component="h3" color="text.secondary">
              {g.category ?? t('c3.catalog.noCategory')}
            </Typography>
            {grid(g.items, 'h4')}
          </Stack>
        ))
      ) : (
        grid(visible, 'h3')
      )}
    </Stack>
  );
}
