// Pilha de avisos: vários ao mesmo tempo.
import { useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grow from '@mui/material/Grow';
import Portal from '@mui/material/Portal';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { type NotifySeverity } from '@c3theme/ui';
import { Row } from '../../Example';
import { SEVERITIES } from './demos';

// ---------- pilha de avisos (vários ao mesmo tempo) ----------

interface Queued {
  id: number;
  severity: NotifySeverity;
  text: string;
}

export function StackDemo() {
  const [items, setItems] = useState<Queued[]>([]);
  const [max, setMax] = useState(3);
  const [noDuplicates, setNoDuplicates] = useState(true);
  const seq = useRef(0);
  const timers = useRef(new Map<number, number>());

  const remove = (id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((list) => list.filter((i) => i.id !== id));
  };

  const push = (severity: NotifySeverity, text: string) => {
    if (noDuplicates && items.some((i) => i.text === text)) return;
    const id = ++seq.current;
    setItems((list) => [...list, { id, severity, text }].slice(-max));
    timers.current.set(
      id,
      window.setTimeout(() => remove(id), 5000)
    );
  };

  // limpa os timers ao sair da página
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <Stack spacing={2}>
      <Row gap={1}>
        {SEVERITIES.map((s) => (
          <Button key={s.severity} color={s.severity} variant="outlined" size="small" onClick={() => push(s.severity, s.text)}>
            {s.label}
          </Button>
        ))}
        <Button size="small" onClick={() => items.forEach((i) => remove(i.id))} disabled={items.length === 0}>
          Fechar todos
        </Button>
      </Row>
      <Row gap={3}>
        <FormControlLabel
          control={<Switch checked={noDuplicates} onChange={(e) => setNoDuplicates(e.target.checked)} />}
          label="Evitar repetidos"
        />
        <Box sx={{ width: 200 }}>
          <Typography variant="body2">Máximo na tela: {max}</Typography>
          <Slider aria-label="Máximo na tela" size="small" min={1} max={5} value={max} onChange={(_, v) => setMax(v)} marks />
        </Box>
      </Row>
      <Portal>
        <Stack
          spacing={1}
          aria-live="polite"
          sx={{
            position: 'fixed',
            zIndex: (t) => t.zIndex.snackbar,
            top: { xs: 72, sm: 80 },
            right: 16,
            left: { xs: 16, sm: 'auto' },
            width: { sm: 340 }
          }}
        >
          {items.map((i) => (
            <Grow in key={i.id}>
              <Alert severity={i.severity} variant="filled" onClose={() => remove(i.id)} sx={{ boxShadow: 6 }}>
                {i.text}
              </Alert>
            </Grow>
          ))}
        </Stack>
      </Portal>
    </Stack>
  );
}
