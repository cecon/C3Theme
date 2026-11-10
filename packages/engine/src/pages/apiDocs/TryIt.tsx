// "Experimentar" de uma rota da página `apiDocs`: os parâmetros de rota e de query, o corpo em JSON (com o exemplo
// do documento) e a chamada pelo cliente do motor, que leva o token da sessão. Mostra o status e a resposta.
import { useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { RawReply } from '../../api';
import { useEngine } from '../../context';
import { buildUrl, type ApiOperation } from './openapi';
import { JsonBlock } from './JsonBlock';

const pretty = (r: RawReply) => {
  if (!r.contentType.includes('json')) return r.body;
  try {
    return JSON.stringify(JSON.parse(r.body), null, 2);
  } catch {
    return r.body;
  }
};

export default function TryIt({ op }: { op: ApiOperation }) {
  const { client } = useEngine();
  const params = op.params.filter((p) => p.in === 'path' || p.in === 'query');
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((p) => [p.name, p.example === undefined ? '' : String(p.example)]))
  );
  const [body, setBody] = useState(op.body?.example === undefined ? '' : JSON.stringify(op.body.example, null, 2));
  const [reply, setReply] = useState<RawReply | { error: string }>();
  const [busy, setBusy] = useState(false);
  const missing = params.some((p) => p.required && !values[p.name]);

  const send = async () => {
    setBusy(true);
    try {
      const sent = op.body && body.trim() ? body : undefined;
      if (sent) JSON.parse(sent);
      setReply(await client.raw!(op.method.toUpperCase(), buildUrl(op, values), sent));
    } catch (e) {
      setReply({ error: e instanceof SyntaxError ? 'O corpo não é um JSON válido.' : String((e as Error).message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  if (!client.raw) return <Alert severity="info">Este cliente do motor não faz pedido livre à API.</Alert>;
  return (
    <Stack spacing={1.5}>
      {params.map((p) => (
        <TextField
          key={`${p.in}-${p.name}`}
          size="small"
          label={`${p.name} (${p.in === 'path' ? 'rota' : 'query'})`}
          required={p.required}
          value={values[p.name] ?? ''}
          onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
          helperText={p.description}
        />
      ))}
      {op.body && (
        <TextField
          label="Corpo (JSON)"
          multiline
          minRows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 13 } } }}
        />
      )}
      <Box>
        <Button variant="contained" onClick={() => void send()} loading={busy} disabled={missing}>
          Enviar
        </Button>
      </Box>
      {reply && 'error' in reply && <Alert severity="error">{reply.error}</Alert>}
      {reply && 'status' in reply && (
        <Box>
          <Typography variant="subtitle2" color={reply.status < 400 ? 'success.main' : 'error.main'} role="status">
            {`Status ${reply.status}`}
          </Typography>
          <JsonBlock text={pretty(reply)} />
        </Box>
      )}
    </Stack>
  );
}
