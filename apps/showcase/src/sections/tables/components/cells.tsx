// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party

import { LinearWithLabel, SoftAvatar, StatusChip } from '@c3theme/ui';
import type { Tone } from '@c3theme/ui';
import { Situacao, TONS_SITUACAO } from '../data';
import { iniciais } from '../format';

const TONS_AVATAR: Tone[] = ['primary', 'info', 'success', 'warning', 'danger', 'secondary'];

/** Avatar com iniciais, nome e e-mail. */
export function PessoaCell({ nome, email, id }: { nome: string; email?: string; id: number }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <SoftAvatar size="sm" tone={TONS_AVATAR[id % TONS_AVATAR.length]}>
        {iniciais(nome)}
      </SoftAvatar>
      <Stack sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {nome}
        </Typography>
        {email && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {email}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

export function SituacaoChip({ situacao }: { situacao: Situacao }) {
  return <StatusChip label={situacao} tone={TONS_SITUACAO[situacao]} />;
}

export function ProgressoCell({ valor }: { valor: number }) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <LinearWithLabel value={valor} />
    </Box>
  );
}
