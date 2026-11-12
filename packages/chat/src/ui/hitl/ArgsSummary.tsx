// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { ArgField } from '../../core/hitl';
import { monoFont, secondarySx } from './sx';

export interface ArgsSummaryProps {
  fields: ArgField[];
  args: Record<string, unknown>;
  /** Argumentos que o humano mudou: ganham a marca. */
  edited?: string[];
}

const gridSx = { m: 0, display: 'grid', gridTemplateColumns: 'minmax(80px, max-content) 1fr', columnGap: 1.5, rowGap: 0.5 };
const rowSx = { display: 'contents' };

const shown = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

/** Os argumentos em rótulo e valor, sem editar. Valor ausente não aparece. */
export default function ArgsSummary({ fields, args, edited = [] }: ArgsSummaryProps) {
  const rows = fields.filter((f) => args[f.name] !== undefined);
  if (!rows.length) return null;
  return (
    <Box component="dl" sx={gridSx}>
      {rows.map((f) => (
        <Box key={f.name} sx={rowSx}>
          <Typography component="dt" variant="body2" sx={secondarySx}>
            {f.label ?? f.name}
          </Typography>
          <Typography
            component="dd"
            variant="body2"
            data-edited={edited.includes(f.name) || undefined}
            sx={{
              m: 0,
              overflowWrap: 'anywhere',
              whiteSpace: 'pre-wrap',
              fontFamily: f.type === 'json' ? monoFont : undefined,
              fontSize: f.type === 'json' ? 13 : undefined,
              '&[data-edited]': { fontWeight: 600, color: 'primary.main' }
            }}
          >
            {shown(args[f.name])}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
