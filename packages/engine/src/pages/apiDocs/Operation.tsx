// Uma rota na página `apiDocs`: método e caminho no título; aberta, o resumo, os parâmetros, o corpo, as respostas
// com esquema e exemplo, e o "experimentar".
import { useState } from 'react';

// material-ui
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import type { ApiOperation, Method } from './openapi';
import { JsonBlock } from './JsonBlock';
import TryIt from './TryIt';

const TONE: Record<Method, 'info' | 'success' | 'warning' | 'secondary' | 'error'> = {
  get: 'info',
  post: 'success',
  put: 'warning',
  patch: 'secondary',
  delete: 'error'
};

const Heading = ({ children }: { children: string }) => (
  <Typography variant="subtitle2" sx={{ mt: 1 }}>
    {children}
  </Typography>
);

function Shape({ schema, example }: { schema?: unknown; example?: unknown }) {
  const [tab, setTab] = useState(example === undefined ? 1 : 0);
  if (schema === undefined && example === undefined) return null;
  return (
    <Box>
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, py: 0 } }}>
        <Tab label="Exemplo" disabled={example === undefined} />
        <Tab label="Esquema" disabled={schema === undefined} />
      </Tabs>
      <JsonBlock value={tab === 0 ? example : schema} />
    </Box>
  );
}

export default function Operation({ op }: { op: ApiOperation }) {
  const [open, setOpen] = useState(false);
  return (
    <Accordion
      expanded={open}
      onChange={(_, v) => setOpen(v)}
      disableGutters
      variant="outlined"
      slotProps={{ heading: { component: 'h4' } }}
    >
      <AccordionSummary>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Chip size="small" color={TONE[op.method]} label={op.method.toUpperCase()} sx={{ minWidth: 64, fontWeight: 700 }} />
          <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{op.path}</Typography>
          {op.summary && (
            <Typography color="text.secondary" noWrap>
              {op.summary}
            </Typography>
          )}
        </Stack>
      </AccordionSummary>
      {open && (
        <AccordionDetails>
          <Stack spacing={1}>
            {op.description && <Typography color="text.secondary">{op.description}</Typography>}
            {op.params.length > 0 && <Heading>Parâmetros</Heading>}
            {op.params.map((p) => (
              <Typography key={`${p.in}-${p.name}`} variant="body2">
                <b style={{ fontFamily: 'monospace' }}>{p.name}</b> ({p.in}
                {p.required ? ', obrigatório' : ''}){p.description ? `: ${p.description}` : ''}
              </Typography>
            ))}
            {op.body && <Heading>{op.body.required ? 'Corpo (obrigatório)' : 'Corpo'}</Heading>}
            {op.body && <Shape schema={op.body.schema} example={op.body.example} />}
            <Heading>Respostas</Heading>
            {op.responses.map((r) => (
              <Box key={r.status}>
                <Typography variant="body2">
                  <b>{r.status}</b> {r.description}
                </Typography>
                <Shape schema={r.schema} example={r.example} />
              </Box>
            ))}
            <Heading>Experimentar</Heading>
            <TryIt op={op} />
          </Stack>
        </AccordionDetails>
      )}
    </Accordion>
  );
}
