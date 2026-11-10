// Faixa das colunas `edit: "batch"`: quantas linhas mudaram, Descartar e "Salvar alterações" (um PATCH por linha).
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { InlineEdit } from './useInlineEdit';

export default function EditBar({ edit }: { edit: InlineEdit }) {
  const n = edit.pending;
  if (!n) return null;
  return (
    <Stack
      direction="row"
      role="status"
      sx={(theme) => ({
        px: 2.5,
        py: 1,
        gap: 1,
        alignItems: 'center',
        bgcolor: `rgb(${theme.vars.palette.warning.mainChannel} / 0.1)`
      })}
    >
      <Typography variant="subtitle2" sx={{ flex: 1 }}>
        {n === 1 ? '1 linha alterada' : `${n} linhas alteradas`}
      </Typography>
      <Button size="small" color="secondary" onClick={edit.discard} disabled={edit.saving}>
        Descartar
      </Button>
      <Button size="small" variant="contained" onClick={() => void edit.saveAll()} loading={edit.saving}>
        Salvar alterações
      </Button>
    </Stack>
  );
}
