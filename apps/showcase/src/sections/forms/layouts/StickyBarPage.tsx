import { FormEvent, useEffect, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Personalcard } from 'iconsax-reactjs';

import { HEADER_HEIGHT, notify, Panel, SoftAvatar } from '@c3theme/ui';
import { IDIOMAS, INTERESSES } from '../data';

/** Diz se a barra já grudou no topo, observando um marcador invisível logo acima dela. */
function useStuck() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: `-${HEADER_HEIGHT + 1}px 0px 0px 0px`
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { sentinel, stuck };
}

export default function StickyBarPage() {
  const { sentinel, stuck } = useStuck();
  const [saving, setSaving] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      notify('Currículo salvo.');
    }, 700);
  };

  return (
    <Box component="form" onSubmit={onSubmit}>
      <div ref={sentinel} />
      <Paper
        variant="outlined"
        sx={{
          position: 'sticky',
          top: HEADER_HEIGHT + 8,
          zIndex: 2,
          mb: 3,
          px: 2.5,
          py: 1.5,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          transition: 'box-shadow .2s',
          boxShadow: stuck ? 6 : 0
        }}
      >
        <SoftAvatar size="sm">
          <Personalcard size={18} />
        </SoftAvatar>
        <Box sx={{ flex: 1, minWidth: 160 }}>
          <Typography variant="subtitle1">Currículo</Typography>
          <Typography variant="caption" color="text.secondary">
            {stuck ? 'A barra acompanha a rolagem: salve de qualquer ponto.' : 'Role a página: esta barra fica presa no topo.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button color="secondary" type="reset">
            Descartar
          </Button>
          <Button variant="contained" type="submit" loading={saving}>
            Salvar
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={3}>
        <Panel title="Dados pessoais">
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Nome completo" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="E-mail" type="email" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Senha" type="password" autoComplete="new-password" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Cidade" fullWidth />
            </Grid>
            <Grid size={12}>
              <TextField label="Resumo profissional" multiline minRows={4} fullWidth />
            </Grid>
          </Grid>
        </Panel>
        <Panel title="Formação">
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Curso" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Instituição" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Ano de conclusão" type="number" fullWidth />
            </Grid>
          </Grid>
        </Panel>
        <Panel title="Experiência">
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Empresa atual" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Anos de experiência" type="number" fullWidth />
            </Grid>
            <Grid size={12}>
              <TextField label="Principais entregas" multiline minRows={4} fullWidth />
            </Grid>
          </Grid>
        </Panel>
        <Panel title="Idiomas e interesses">
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Idiomas
              </Typography>
              <FormGroup>
                {IDIOMAS.map((i) => (
                  <FormControlLabel key={i} control={<Checkbox />} label={i} />
                ))}
              </FormGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Interesses
              </Typography>
              <FormGroup>
                {INTERESSES.map((i) => (
                  <FormControlLabel key={i} control={<Checkbox />} label={i} />
                ))}
              </FormGroup>
            </Grid>
          </Grid>
        </Panel>
      </Stack>
    </Box>
  );
}
