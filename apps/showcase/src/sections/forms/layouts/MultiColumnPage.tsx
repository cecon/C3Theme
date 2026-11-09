import { FormEvent } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

// third-party
import { Global, Lock1, Sms } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';
import { IDIOMAS, UFS } from '../data';
import { HorizontalField } from '../shared';

function onSubmit(e: FormEvent) {
  e.preventDefault();
  notify('Cadastro enviado.');
}

function Actions() {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 3 }}>
      <Button type="reset" color="secondary">
        Limpar
      </Button>
      <Button type="submit" variant="contained">
        Enviar
      </Button>
    </Stack>
  );
}

const icon = (Icon: typeof Sms) => ({ input: { startAdornment: <InputAdornment position="start">{<Icon size={18} />}</InputAdornment> } });

function TwoColumns() {
  return (
    <Panel title="Duas colunas">
      <form onSubmit={onSubmit}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Nome completo" fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="E-mail" type="email" fullWidth slotProps={icon(Sms)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Senha" type="password" fullWidth autoComplete="new-password" slotProps={icon(Lock1)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Site ou perfil" placeholder="https://" fullWidth slotProps={icon(Global)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl>
              <FormLabel>Perfil de acesso</FormLabel>
              <RadioGroup row defaultValue="editor" name="perfil-2c">
                <FormControlLabel value="admin" control={<Radio />} label="Administrador" />
                <FormControlLabel value="editor" control={<Radio />} label="Editor" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormLabel>Idiomas</FormLabel>
            <FormGroup row>
              {IDIOMAS.map((i) => (
                <FormControlLabel key={i} control={<Checkbox />} label={i} />
              ))}
            </FormGroup>
          </Grid>
        </Grid>
        <Actions />
      </form>
    </Panel>
  );
}

function ThreeColumns() {
  return (
    <Panel title="Três colunas">
      <form onSubmit={onSubmit}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Nome" fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="E-mail" type="email" fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Telefone" fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="CEP" fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Cidade" fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="UF" select defaultValue="SP" fullWidth>
              {UFS.map((uf) => (
                <MenuItem key={uf} value={uf}>
                  {uf}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField label="Endereço" placeholder="Rua, número e complemento" fullWidth />
          </Grid>
        </Grid>
        <Actions />
      </form>
    </Panel>
  );
}

function TwoColumnsHorizontal() {
  return (
    <Panel title="Duas colunas, rótulos à esquerda">
      <form onSubmit={onSubmit}>
        <Grid container spacing={2.5}>
          {[
            ['Nome', 'mh2-nome'],
            ['E-mail', 'mh2-email'],
            ['Telefone', 'mh2-tel'],
            ['Empresa', 'mh2-emp']
          ].map(([label, id]) => (
            <Grid key={id} size={{ xs: 12, md: 6 }}>
              <HorizontalField label={label} htmlFor={id} labelSize={4}>
                <TextField id={id} size="small" fullWidth />
              </HorizontalField>
            </Grid>
          ))}
        </Grid>
        <Actions />
      </form>
    </Panel>
  );
}

function ThreeColumnsHorizontal() {
  return (
    <Panel title="Três colunas, rótulos à esquerda">
      <form onSubmit={onSubmit}>
        <Grid container spacing={2.5}>
          {[
            ['Nome', 'mh3-nome'],
            ['Sobrenome', 'mh3-sob'],
            ['Apelido', 'mh3-ap'],
            ['CEP', 'mh3-cep'],
            ['Cidade', 'mh3-cid'],
            ['Bairro', 'mh3-bai']
          ].map(([label, id]) => (
            <Grid key={id} size={{ xs: 12, md: 4 }}>
              <HorizontalField label={label} htmlFor={id} labelSize={4}>
                <TextField id={id} size="small" fullWidth />
              </HorizontalField>
            </Grid>
          ))}
        </Grid>
        <Actions />
      </form>
    </Panel>
  );
}

export default function MultiColumnPage() {
  return (
    <Stack spacing={3}>
      <TwoColumns />
      <ThreeColumns />
      <TwoColumnsHorizontal />
      <ThreeColumnsHorizontal />
    </Stack>
  );
}
