import { ElementType } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Refresh2 } from 'iconsax-reactjs';

import { SoftAvatar, softColors, toneMain } from '@c3theme/ui';
import Tile from '../kit/Tile';
import { toTone } from '../kit/tone';
import Trend from '../kit/Trend';
import type { ChartTone } from '../kit/useChartColors';

interface BaseStat {
  label: string;
  value: string;
  icon: ElementType;
  tone?: ChartTone;
}

/** Número grande com ícone e uma faixa colorida no rodapé dizendo quando foi atualizado. */
export function StatTile({ label, value, icon: Icon, tone = 'primary', updated }: BaseStat & { updated: string }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" sx={{ p: 2.5, alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
        <Box>
          <Typography variant="h3" component="p" sx={{ color: `${tone}.main` }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
        <Box sx={{ color: `${tone}.main`, opacity: 0.85 }}>
          <Icon size={44} variant="Bulk" />
        </Box>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        sx={(theme) => ({
          px: 2.5,
          py: 1.25,
          alignItems: 'center',
          bgcolor: toneMain(theme, toTone(tone)),
          color: theme.vars.palette.background.paper
        })}
      >
        <Refresh2 size={16} />
        <Typography variant="caption" sx={{ color: 'inherit' }}>
          {updated}
        </Typography>
      </Stack>
    </Paper>
  );
}

/** Cartão de rede social: fundo suave que se enche com a cor ao passar o mouse. */
export function SocialStatCard({ label, value, icon: Icon, tone = 'primary' }: BaseStat) {
  return (
    <Paper
      variant="outlined"
      tabIndex={0}
      sx={(theme) => {
        const soft = softColors(theme, toTone(tone));
        return {
          ...soft,
          borderRadius: 3,
          p: 2.5,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderColor: 'transparent',
          transition: theme.transitions.create(['background-color', 'color']),
          '& .social-icon': { transition: theme.transitions.create('transform') },
          '&:hover, &:focus-visible': {
            bgcolor: toneMain(theme, toTone(tone)),
            color: theme.vars.palette.background.paper,
            outline: 'none',
            '& .social-icon': { transform: 'scale(1.15) rotate(-8deg)' }
          }
        };
      }}
    >
      <Box className="social-icon" sx={{ position: 'absolute', top: 16, insetInlineEnd: 16, opacity: 0.9 }}>
        <Icon size={40} variant="Bold" />
      </Box>
      <Typography variant="h3" component="p" sx={{ color: 'inherit' }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'inherit', mt: 0.5 }}>
        {label}
      </Typography>
    </Paper>
  );
}

/** Indicador com selo de variação e uma frase de contexto embaixo. */
export function GrowthStatCard({ label, value, change, extra }: { label: string; value: string; change: number; extra: string }) {
  return (
    <Tile>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
        <Typography variant="h3" component="p">
          {value}
        </Typography>
        <Trend value={change} look="chip" />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        {change >= 0 ? 'Foram ' : 'Faltaram '}
        <Box component="span" sx={{ color: change >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
          {extra}
        </Box>
        {change >= 0 ? ' a mais que no ano passado' : ' para igualar o ano passado'}
      </Typography>
    </Tile>
  );
}

/** Cartão de cor cheia com ícone grande ao fundo, para destacar um número. */
export function HighlightStatCard({ label, value, icon: Icon, tone = 'primary', note }: BaseStat & { note: string }) {
  return (
    <Paper
      sx={(theme) => ({
        borderRadius: 3,
        p: 2.5,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: toneMain(theme, toTone(tone)),
        color: theme.vars.palette.background.paper
      })}
    >
      <Box sx={{ position: 'absolute', insetInlineEnd: -12, bottom: -16, opacity: 0.22 }} aria-hidden>
        <Icon size={110} variant="Bulk" />
      </Box>
      <Typography variant="subtitle1" sx={{ color: 'inherit' }}>
        {label}
      </Typography>
      <Typography variant="h2" component="p" sx={{ color: 'inherit', my: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.85 }}>
        {note}
      </Typography>
    </Paper>
  );
}

/** Número com ícone redondo ao lado e o intervalo de datas a que se refere. */
export function RoundIconStatCard({ label, value, icon: Icon, tone = 'primary', range }: BaseStat & { range: string }) {
  return (
    <Tile>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h3" component="p" sx={{ my: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {range}
          </Typography>
        </Box>
        <SoftAvatar tone={toTone(tone)} size="lg">
          <Icon size={28} />
        </SoftAvatar>
      </Stack>
    </Tile>
  );
}

/** Contador centralizado em cartão colorido (ex.: usuários de um grupo). */
export function UserCountCard({ label, value, icon: Icon, tone = 'primary' }: BaseStat) {
  return (
    <Paper
      sx={(theme) => ({
        ...softColors(theme, toTone(tone)),
        borderRadius: 3,
        p: 3,
        height: '100%',
        textAlign: 'center'
      })}
    >
      <Icon size={36} variant="Bulk" />
      <Typography variant="h2" component="p" sx={{ color: 'inherit', mt: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'inherit' }}>
        {label}
      </Typography>
    </Paper>
  );
}
