// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LinearWithLabel, SoftAvatar } from '@c3theme/ui';
import { Pessoa } from '../data';
import { formatarDataLonga, formatarMoeda, iniciais } from '../format';

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {rotulo}
      </Typography>
      <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
        {valor}
      </Typography>
    </Box>
  );
}

/** Painel de detalhe de uma pessoa, mostrado abaixo da linha expandida. */
export default function DetalhePessoa({ pessoa }: { pessoa: Pessoa }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{ px: 2.5, py: 2.5, gap: { xs: 2, md: 4 }, alignItems: { md: 'center' }, flexWrap: 'wrap', bgcolor: 'background.default' }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <SoftAvatar size="lg">{iniciais(pessoa.nome)}</SoftAvatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1">{pessoa.nome}</Typography>
          <Typography variant="body2" color="text.secondary">
            {pessoa.cargo}
          </Typography>
        </Box>
      </Stack>
      <Info rotulo="E-mail" valor={pessoa.email} />
      <Info rotulo="Telefone" valor={pessoa.telefone} />
      <Info rotulo="CPF" valor={pessoa.cpf} />
      <Info rotulo="Admitido(a) em" valor={formatarDataLonga(pessoa.admissao)} />
      <Info rotulo="Salário" valor={formatarMoeda(pessoa.salario)} />
      <Box sx={{ minWidth: 160 }}>
        <Typography variant="caption" color="text.secondary">
          Meta do trimestre
        </Typography>
        <LinearWithLabel value={pessoa.progresso} />
      </Box>
    </Stack>
  );
}
