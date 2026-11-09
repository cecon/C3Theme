// Demonstrações com estado: carregando e alternância.
import { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {
  Refresh,
  Send2,
  TextalignCenter,
  TextalignJustifycenter,
  TextalignLeft,
  TextalignRight,
  TextBold,
  TextItalic,
  TextUnderline
} from 'iconsax-reactjs';
import { notify, type Tone } from '@c3theme/ui';
import { Row } from '../../Example';

export const COLORS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;
export const COLOR_LABEL: Record<(typeof COLORS)[number], string> = {
  primary: 'Primária',
  secondary: 'Secundária',
  success: 'Sucesso',
  warning: 'Atenção',
  error: 'Erro',
  info: 'Informação'
};
export const TONES: Tone[] = ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'neutral'];

export function LoadingDemo() {
  const [loading, setLoading] = useState(false);
  const run = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      notify('Dados salvos.');
    }, 1500);
  };
  return (
    <Row>
      <Button variant="contained" loading={loading} onClick={run}>
        Salvar
      </Button>
      <Button variant="outlined" loading={loading} loadingPosition="start" startIcon={<Send2 size={18} />} onClick={run}>
        Enviar
      </Button>
      <Button variant="text" loading={loading} loadingPosition="end" endIcon={<Refresh size={18} />} onClick={run}>
        Atualizar
      </Button>
      <Button variant="contained" color="secondary" loading loadingPosition="start" startIcon={<Refresh size={18} />}>
        Sempre carregando
      </Button>
    </Row>
  );
}

export function ToggleDemos() {
  const [align, setAlign] = useState<string | null>('left');
  const [formats, setFormats] = useState<string[]>(['bold']);
  const [view, setView] = useState('lista');
  const [period, setPeriod] = useState('mes');

  return (
    <Stack spacing={2.5}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Exclusivo (um por vez)</Typography>
        <ToggleButtonGroup value={align} exclusive onChange={(_, v: string | null) => setAlign(v)} aria-label="Alinhamento do texto">
          <ToggleButton value="left" aria-label="Alinhar à esquerda">
            <TextalignLeft size={18} />
          </ToggleButton>
          <ToggleButton value="center" aria-label="Centralizar">
            <TextalignCenter size={18} />
          </ToggleButton>
          <ToggleButton value="right" aria-label="Alinhar à direita">
            <TextalignRight size={18} />
          </ToggleButton>
          <ToggleButton value="justify" aria-label="Justificar" disabled>
            <TextalignJustifycenter size={18} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Múltiplo</Typography>
        <ToggleButtonGroup value={formats} onChange={(_, v: string[]) => setFormats(v)} aria-label="Formatação" color="primary">
          <ToggleButton value="bold" aria-label="Negrito">
            <TextBold size={18} />
          </ToggleButton>
          <ToggleButton value="italic" aria-label="Itálico">
            <TextItalic size={18} />
          </ToggleButton>
          <ToggleButton value="underline" aria-label="Sublinhado">
            <TextUnderline size={18} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Com texto, cor e tamanhos</Typography>
        <Row>
          <ToggleButtonGroup size="small" color="success" value={view} exclusive onChange={(_, v: string | null) => v && setView(v)}>
            <ToggleButton value="lista">Lista</ToggleButton>
            <ToggleButton value="grade">Grade</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup color="primary" value={period} exclusive onChange={(_, v: string | null) => v && setPeriod(v)}>
            <ToggleButton value="dia">Dia</ToggleButton>
            <ToggleButton value="semana">Semana</ToggleButton>
            <ToggleButton value="mes">Mês</ToggleButton>
          </ToggleButtonGroup>
        </Row>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Vertical</Typography>
        <ToggleButtonGroup
          orientation="vertical"
          value={view}
          exclusive
          onChange={(_, v: string | null) => v && setView(v)}
          sx={{ width: 160 }}
        >
          <ToggleButton value="lista">Lista</ToggleButton>
          <ToggleButton value="grade">Grade</ToggleButton>
          <ToggleButton value="quadro">Quadro</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  );
}
