import { FormEvent, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';

import { notify, Panel } from '@c3theme/ui';
import { CARGOS, IDIOMAS } from '../data';
import { HorizontalField, SectionTitle } from '../shared';

const submit = (msg: string) => (e: FormEvent) => {
  e.preventDefault();
  notify(msg);
};

function SimpleForm() {
  return (
    <Panel title="Formulário simples" subtitle="Rótulos dentro dos campos, um embaixo do outro">
      <Stack component="form" spacing={2.5} onSubmit={submit('Dados enviados.')}>
        <TextField label="Nome completo" placeholder="Ex.: Ana Souza" fullWidth />
        <TextField
          label="E-mail"
          type="email"
          placeholder="voce@empresa.com.br"
          fullWidth
          helperText="Nunca compartilhamos o seu e-mail."
        />
        <TextField label="Senha" type="password" fullWidth autoComplete="new-password" />
        <FormControlLabel control={<Checkbox defaultChecked />} label="Manter conectado neste dispositivo" />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained">
            Enviar
          </Button>
          <Button type="reset" color="secondary">
            Limpar
          </Button>
        </Stack>
      </Stack>
    </Panel>
  );
}

function HorizontalForm() {
  return (
    <Panel title="Rótulos à esquerda" subtitle="Formulário horizontal; no celular o rótulo vai para cima">
      <Stack component="form" spacing={2.5} onSubmit={submit('Contato salvo.')}>
        <HorizontalField label="Nome" htmlFor="h-nome">
          <TextField id="h-nome" size="small" placeholder="Nome e sobrenome" fullWidth />
        </HorizontalField>
        <HorizontalField label="E-mail" htmlFor="h-email">
          <TextField id="h-email" size="small" type="email" placeholder="voce@empresa.com.br" fullWidth />
        </HorizontalField>
        <HorizontalField label="Telefone" htmlFor="h-tel">
          <TextField id="h-tel" size="small" placeholder="(11) 90000-0000" fullWidth />
        </HorizontalField>
        <HorizontalField label="Cargo" htmlFor="h-cargo">
          <TextField id="h-cargo" size="small" select defaultValue="Analista" fullWidth>
            {CARGOS.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </HorizontalField>
        <HorizontalField label="">
          <Button type="submit" variant="contained">
            Salvar contato
          </Button>
        </HorizontalField>
      </Stack>
    </Panel>
  );
}

function DividedForm() {
  return (
    <Panel title="Grupos com divisores" subtitle="Seções do mesmo formulário separadas por linhas">
      <form onSubmit={submit('Currículo atualizado.')}>
        <SectionTitle hint="Como você aparece para os recrutadores">Dados pessoais</SectionTitle>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Nome" fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="E-mail" type="email" fullWidth />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <SectionTitle>Formação</SectionTitle>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField label="Curso" placeholder="Ex.: Administração" fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Ano de conclusão" type="number" placeholder="2020" fullWidth />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <SectionTitle>Idiomas</SectionTitle>
        <FormGroup row>
          {IDIOMAS.map((i, idx) => (
            <FormControlLabel key={i} control={<Checkbox defaultChecked={idx === 0} />} label={i} />
          ))}
        </FormGroup>
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button color="secondary">Cancelar</Button>
          <Button type="submit" variant="contained">
            Salvar
          </Button>
        </Stack>
      </form>
    </Panel>
  );
}

function OptionsForm() {
  const [news, setNews] = useState(true);
  return (
    <Panel title="Opções e preferências" subtitle="Grupos de caixas na vertical e interruptores">
      <Stack component="form" spacing={2.5} onSubmit={submit('Preferências salvas.')}>
        <TextField label="Apelido" fullWidth />
        <div>
          <FormLabel component="legend" sx={{ mb: 0.5 }}>
            Receber avisos por
          </FormLabel>
          <FormGroup>
            <FormControlLabel control={<Checkbox defaultChecked />} label="E-mail" />
            <FormControlLabel control={<Checkbox />} label="SMS" />
            <FormControlLabel control={<Checkbox />} label="Notificação no aplicativo" />
          </FormGroup>
        </div>
        <FormControlLabel
          control={<Switch checked={news} onChange={(e) => setNews(e.target.checked)} />}
          label={news ? 'Quero receber a newsletter mensal' : 'Não quero a newsletter'}
        />
        <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
          Salvar preferências
        </Button>
      </Stack>
    </Panel>
  );
}

export default function BasicLayoutsPage() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <SimpleForm />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <HorizontalForm />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <DividedForm />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <OptionsForm />
      </Grid>
    </Grid>
  );
}
