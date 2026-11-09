import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Rating from '@mui/material/Rating';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { TickCircle } from 'iconsax-reactjs';

import { brl, CATEGORIES, CategoryId, COLORS, ColorId } from './data';

export interface Filters {
  categorias: CategoryId[];
  preco: [number, number];
  nota: number;
  cores: ColorId[];
  emEstoque: boolean;
}

export const emptyFilters = (maxPrice: number): Filters => ({ categorias: [], preco: [0, maxPrice], nota: 0, cores: [], emEstoque: false });

export function activeFilterCount(f: Filters, maxPrice: number) {
  return (
    f.categorias.length + f.cores.length + (f.nota ? 1 : 0) + (f.emEstoque ? 1 : 0) + (f.preco[0] > 0 || f.preco[1] < maxPrice ? 1 : 0)
  );
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

interface Props {
  value: Filters;
  maxPrice: number;
  counts: Record<CategoryId, number>;
  onChange: (f: Filters) => void;
}

/** Corpo da gaveta de filtros (o mesmo no desktop e no celular). */
export default function ProductFilters({ value, maxPrice, counts, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  return (
    <Box sx={{ px: 2.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', pt: 2 }}>
        <Typography variant="h5">Filtros</Typography>
        <Button
          size="small"
          color="error"
          onClick={() => onChange(emptyFilters(maxPrice))}
          disabled={activeFilterCount(value, maxPrice) === 0}
        >
          Limpar
        </Button>
      </Stack>

      <Section title="Categoria">
        <FormGroup>
          {(Object.keys(CATEGORIES) as CategoryId[]).map((id) => (
            <FormControlLabel
              key={id}
              control={
                <Checkbox
                  size="small"
                  checked={value.categorias.includes(id)}
                  onChange={() => set({ categorias: toggle(value.categorias, id) })}
                />
              }
              label={
                <Stack direction="row" sx={{ gap: 1 }}>
                  {CATEGORIES[id]}
                  <Typography component="span" color="text.secondary">
                    ({counts[id] ?? 0})
                  </Typography>
                </Stack>
              }
            />
          ))}
        </FormGroup>
      </Section>
      <Divider />

      <Section title="Faixa de preço">
        <Box sx={{ px: 1 }}>
          <Slider
            value={value.preco}
            min={0}
            max={maxPrice}
            step={10}
            onChange={(_, v) => set({ preco: v as [number, number] })}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => brl.format(v)}
            getAriaLabel={(i) => (i === 0 ? 'Preço mínimo' : 'Preço máximo')}
          />
        </Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {brl.format(value.preco[0])}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {brl.format(value.preco[1])}
          </Typography>
        </Stack>
      </Section>
      <Divider />

      <Section title="Avaliação">
        <RadioGroup value={String(value.nota)} onChange={(e) => set({ nota: Number(e.target.value) })}>
          {[4, 3, 2].map((n) => (
            <FormControlLabel
              key={n}
              value={String(n)}
              control={<Radio size="small" />}
              label={
                <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
                  <Rating value={n} readOnly size="small" />
                  <Typography variant="body2">ou mais</Typography>
                </Stack>
              }
            />
          ))}
          <FormControlLabel value="0" control={<Radio size="small" />} label="Qualquer nota" />
        </RadioGroup>
      </Section>
      <Divider />

      <Section title="Cor">
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {(Object.keys(COLORS) as ColorId[]).map((c) => {
            const on = value.cores.includes(c);
            return (
              <Tooltip key={c} title={COLORS[c].nome}>
                <Box
                  component="button"
                  type="button"
                  aria-label={COLORS[c].nome}
                  aria-pressed={on}
                  onClick={() => set({ cores: toggle(value.cores, c) })}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    bgcolor: COLORS[c].hex,
                    border: 2,
                    borderColor: on ? 'primary.main' : 'divider',
                    outline: on ? 2 : 0,
                    outlineColor: 'background.paper',
                    outlineOffset: -4,
                    display: 'grid',
                    placeItems: 'center',
                    color: c === 'branco' || c === 'amarelo' ? 'grey.900' : 'common.white'
                  }}
                >
                  {on && <TickCircle size={16} variant="Bold" />}
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      </Section>
      <Divider />

      <Section title="Disponibilidade">
        <FormControlLabel
          control={<Switch checked={value.emEstoque} onChange={(e) => set({ emEstoque: e.target.checked })} />}
          label="Somente em estoque"
        />
      </Section>
    </Box>
  );
}
