// Aba de configurações: e-mails que o usuário recebe.
import { useState } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { notify, Panel } from '@c3theme/ui';
import { PreferenceList } from '../forms';

const EMAIL_GROUPS = [
  {
    title: 'Notificações por e-mail',
    items: [
      { id: 'mensagem', title: 'Mensagem direta', description: 'Quando alguém da equipe falar com você.' },
      { id: 'mencao', title: 'Menções', description: 'Quando citarem você em um comentário.' },
      { id: 'copia', title: 'Cópia para o e-mail pessoal', description: 'Envia também para o e-mail cadastrado em "Dados pessoais".' }
    ]
  },
  {
    title: 'Atividade da conta',
    items: [
      { id: 'cadastro', title: 'Novo membro na equipe', description: 'Quando um convite for aceito.' },
      { id: 'fatura', title: 'Faturas vencidas', description: 'Resumo diário das cobranças em atraso.' },
      { id: 'login', title: 'Novos acessos', description: 'Quando a conta for acessada de um lugar diferente.' }
    ]
  },
  {
    title: 'Novidades',
    items: [
      { id: 'produto', title: 'Novidades do produto', description: 'Recursos novos e melhorias.' },
      { id: 'dicas', title: 'Dicas de uso', description: 'Como tirar mais proveito do sistema.' }
    ]
  }
];

export function SettingsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    mensagem: true,
    mencao: true,
    copia: false,
    cadastro: true,
    fatura: true,
    login: true,
    produto: false,
    dicas: true
  });
  const [frequency, setFrequency] = useState('imediato');
  return (
    <Grid container spacing={3}>
      {EMAIL_GROUPS.map((g) => (
        <Grid key={g.title} size={{ xs: 12, md: 6 }}>
          <Panel title={g.title} sx={{ height: '100%' }}>
            <PreferenceList items={g.items} value={prefs} onChange={(id, on) => setPrefs((p) => ({ ...p, [id]: on }))} />
          </Panel>
        </Grid>
      ))}
      <Grid size={{ xs: 12, md: 6 }}>
        <Panel title="Quando enviar" sx={{ height: '100%' }}>
          <TextField select fullWidth label="Frequência dos e-mails" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <MenuItem value="imediato">Assim que acontecer</MenuItem>
            <MenuItem value="diario">Um resumo por dia</MenuItem>
            <MenuItem value="semanal">Um resumo por semana</MenuItem>
            <MenuItem value="nunca">Não enviar</MenuItem>
          </TextField>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Alertas de segurança são enviados sempre, independentemente desta opção.
          </Typography>
        </Panel>
      </Grid>
      <Grid size={12}>
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => notify('Preferências de e-mail salvas.')}>
            Salvar preferências
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
}

// ---------------------------------------------------------------- página
