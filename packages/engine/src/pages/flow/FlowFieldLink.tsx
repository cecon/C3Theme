// O campo do grafo (`views.flow.field`) no formulário: no lugar do JSON, quantos passos o fluxo tem e o botão que
// abre o editor. Cadastro novo ainda não tem rota: pede para gravar antes.
import { Link as RouterLink } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { flowPath, parseFlow } from '../../flow';

export interface FlowFieldLinkProps {
  label: string;
  value: unknown;
  entity: string;
  /** Registro gravado; sem ele, o botão fica desligado. */
  id?: string;
}

const ROW_SX = { alignItems: 'center', justifyContent: 'space-between' };
const PAPER_SX = { p: 2 };
const HINT_SX = { color: 'text.secondary' };

export function flowStepsText(value: unknown): string {
  const graph = parseFlow(value);
  if (!graph) return 'O fluxo gravado não é válido.';
  const steps = graph.nodes.length;
  if (steps === 0) return 'Nenhum passo ainda.';
  return steps === 1 ? '1 passo' : `${steps} passos`;
}

export default function FlowFieldLink({ label, value, entity, id }: FlowFieldLinkProps) {
  return (
    <Paper variant="outlined" sx={PAPER_SX}>
      <Stack direction="row" spacing={2} sx={ROW_SX}>
        <div>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" sx={HINT_SX}>
            {id ? flowStepsText(value) : 'Salve o cadastro para montar o fluxo.'}
          </Typography>
        </div>
        {id ? (
          <Button variant="outlined" component={RouterLink} to={flowPath(entity, id)}>
            Abrir o fluxo
          </Button>
        ) : (
          <Button variant="outlined" disabled>
            Abrir o fluxo
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
