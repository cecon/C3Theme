import { MouseEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { Add, LanguageSquare } from 'iconsax-reactjs';

import { notify, SoftAvatar } from '@c3theme/ui';
import { LANGUAGE_DOWNLOADS, LANGUAGES, MORE_LANGUAGES } from '../data';
import { formatCompact } from '../kit/format';
import Tile from '../kit/Tile';
import { useChartColors } from '../kit/useChartColors';

/** Idiomas do aplicativo: downloads recentes, idiomas ativos e inclusão de novos. */
export default function LanguagesCard() {
  const colors = useChartColors();
  const [active, setActive] = useState(LANGUAGES);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const available = MORE_LANGUAGES.filter((l) => !active.some((a) => a.code === l.code));

  function remove(code: string) {
    setActive((list) => list.filter((l) => l.code !== code));
    notify('Idioma desativado.', 'info');
  }

  return (
    <Tile
      footer={
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" color="inherit" onClick={() => notify('Arquivo de traduções exportado.', 'success')}>
            Exportar textos
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Add size={16} />}
            disabled={available.length === 0}
            onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
          >
            Idioma
          </Button>
        </Stack>
      }
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <SoftAvatar tone="info" variant="rounded">
          <LanguageSquare size={20} />
        </SoftAvatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">Idiomas do aplicativo</Typography>
          <Typography variant="caption" color="text.secondary">
            Downloads nos últimos 18 dias
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ mx: -2.5, my: 1.5, '& .MuiLineChart-area': { fillOpacity: 0.2 } }}>
        <SparkLineChart data={LANGUAGE_DOWNLOADS} height={110} area curve="natural" color={colors.info} showTooltip showHighlight />
      </Box>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        {active.map((l) => (
          <Chip
            key={l.code}
            label={`${l.label} · ${formatCompact(l.users)}`}
            onDelete={active.length > 1 ? () => remove(l.code) : undefined}
            variant="outlined"
          />
        ))}
      </Stack>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {available.map((l) => (
          <MenuItem
            key={l.code}
            onClick={() => {
              setActive((list) => [...list, l]);
              setAnchor(null);
              notify(`${l.label} adicionado.`, 'success');
            }}
          >
            {l.label}
          </MenuItem>
        ))}
      </Menu>
    </Tile>
  );
}
