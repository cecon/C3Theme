import { useEffect, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { DocumentUpload, TickCircle } from 'iconsax-reactjs';

import { CircularWithLabel, LinearWithLabel, notify } from '@c3theme/ui';
import Example, { ExamplePage, Row } from '../Example';

const COLORS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;

/** Valor que avança sozinho de 0 a 100 e recomeça. */
function useTicker(step = 10, ms = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setValue((v) => (v >= 100 ? 0 : Math.min(100, v + step))), ms);
    return () => window.clearInterval(t);
  }, [step, ms]);
  return value;
}

function useBuffer() {
  const [state, setState] = useState({ value: 0, buffer: 10 });
  useEffect(() => {
    const t = window.setInterval(() => {
      setState(({ value }) => {
        if (value >= 100) return { value: 0, buffer: 10 };
        const next = value + 7;
        return { value: next, buffer: Math.min(100, next + 15) };
      });
    }, 600);
    return () => window.clearInterval(t);
  }, []);
  return state;
}

// componentes pequenos para que só eles re-renderizem a cada passo
function AnimatedCircular() {
  return <CircularProgress variant="determinate" value={useTicker()} color="secondary" aria-label="Progresso animado" />;
}
function AnimatedCircularLabel() {
  return <CircularWithLabel value={useTicker()} />;
}
function AnimatedLinear() {
  return <LinearProgress variant="determinate" value={useTicker()} aria-label="Determinado" />;
}
function BufferLinear() {
  const { value, buffer } = useBuffer();
  return <LinearProgress variant="buffer" value={value} valueBuffer={buffer} color="secondary" aria-label="Com buffer" />;
}

function UploadDemo() {
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (progress === null || progress >= 100) return;
    const t = window.setTimeout(() => setProgress((p) => Math.min(100, (p ?? 0) + 12)), 300);
    return () => window.clearTimeout(t);
  }, [progress]);

  useEffect(() => {
    if (progress === 100) notify('Arquivo enviado.');
  }, [progress]);

  const done = progress === 100;
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box sx={{ color: done ? 'success.main' : 'primary.main', display: 'flex' }}>
          {done ? <TickCircle size={28} /> : <DocumentUpload size={28} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            relatorio-vendas-outubro.pdf
          </Typography>
          <LinearWithLabel value={progress ?? 0} color={done ? 'success' : 'primary'} />
        </Box>
      </Stack>
      <Button variant="contained" onClick={() => setProgress(0)} disabled={progress !== null && !done} sx={{ alignSelf: 'flex-start' }}>
        {done ? 'Enviar de novo' : 'Simular envio'}
      </Button>
    </Stack>
  );
}

export default function ProgressPage() {
  return (
    <ExamplePage intro="Indicadores de progresso mostram que algo está acontecendo. Use determinado quando souber o percentual, indeterminado quando não souber.">
      <Example
        title="Circular indeterminado"
        code={`<CircularProgress />
<CircularProgress color="success" />`}
      >
        <Row gap={2.5}>
          {COLORS.map((c) => (
            <CircularProgress key={c} color={c} aria-label={`Carregando (${c})`} />
          ))}
        </Row>
      </Example>

      <Example
        title="Circular com trilha"
        description="Trilha de fundo para dar noção de círculo completo."
        code={`<Box sx={{ position: 'relative' }}>
  <CircularProgress variant="determinate" value={100} sx={{ color: 'action.hover' }} />
  <CircularProgress sx={{ position: 'absolute', left: 0 }} />
</Box>`}
      >
        <Row gap={2.5}>
          {COLORS.slice(0, 4).map((c) => (
            <Box key={c} sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress variant="determinate" value={100} sx={{ color: 'action.hover' }} aria-hidden />
              <CircularProgress color={c} sx={{ position: 'absolute', left: 0 }} aria-label="Carregando" />
            </Box>
          ))}
        </Row>
      </Example>

      <Example title="Circular determinado" code={`<CircularProgress variant="determinate" value={75} />`}>
        <Row gap={2.5}>
          {[25, 50, 75, 100].map((v) => (
            <CircularProgress key={v} variant="determinate" value={v} aria-label={`${v}%`} />
          ))}
          <AnimatedCircular />
        </Row>
      </Example>

      <Example
        title="Circular com rótulo (CircularWithLabel)"
        description="Do @c3theme/ui, já com trilha e percentual."
        code={`<CircularWithLabel value={68} />
<CircularWithLabel value={68} size={80} color="success" />`}
      >
        <Row gap={2.5}>
          <AnimatedCircularLabel />
          <CircularWithLabel value={68} size={72} color="success" />
          <CircularWithLabel value={42} size={88} color="warning" />
          <CircularWithLabel value={12} size={56} color="error" />
        </Row>
      </Example>

      <Example title="Tamanhos e espessura" code={`<CircularProgress size={24} thickness={5} />`}>
        <Row gap={2.5}>
          <CircularProgress size={20} aria-label="Pequeno" />
          <CircularProgress size={32} aria-label="Médio" />
          <CircularProgress size={48} thickness={2.5} aria-label="Grande fino" />
          <CircularProgress size={64} thickness={6} color="secondary" aria-label="Grande grosso" />
          <Button variant="contained" disabled startIcon={<CircularProgress size={16} color="inherit" />}>
            Processando
          </Button>
        </Row>
      </Example>

      <Example
        title="Linear indeterminado"
        code={`<LinearProgress />
<LinearProgress color="success" />`}
      >
        <Stack spacing={2.5}>
          {COLORS.map((c) => (
            <LinearProgress key={c} color={c} aria-label={`Carregando (${c})`} />
          ))}
        </Stack>
      </Example>

      <Example
        title="Linear determinado e com buffer"
        code={`<LinearProgress variant="determinate" value={60} />
<LinearProgress variant="buffer" value={valor} valueBuffer={buffer} />
<LinearProgress variant="query" />`}
      >
        <Stack spacing={3}>
          <AnimatedLinear />
          <BufferLinear />
          <LinearProgress variant="query" color="info" aria-label="Consulta" />
        </Stack>
      </Example>

      <Example
        title="Linear com rótulo (LinearWithLabel)"
        description="Do @c3theme/ui."
        code={`<LinearWithLabel value={72} label="Meta do mês" color="success" />`}
      >
        <Stack spacing={2.5}>
          <LinearWithLabel value={72} label="Meta de vendas do mês" color="success" />
          <LinearWithLabel value={45} label="Cadastro do perfil" />
          <LinearWithLabel value={88} label="Uso do armazenamento" color="warning" />
          <LinearWithLabel value={97} label="Limite do plano" color="error" />
        </Stack>
      </Example>

      <Example title="Cores e altura" code={`<LinearProgress variant="determinate" value={60} sx={{ height: 10, borderRadius: 5 }} />`}>
        <Stack spacing={2.5}>
          {COLORS.map((c, i) => (
            <LinearProgress
              key={c}
              variant="determinate"
              color={c}
              value={30 + i * 12}
              aria-label={`Barra ${c}`}
              sx={{ height: 4 + i * 2, borderRadius: 8 }}
            />
          ))}
        </Stack>
      </Example>

      <Example
        title="Envio de arquivo"
        description="Uso real: barra com ícone e aviso ao terminar."
        code={`<LinearWithLabel value={progresso} color={pronto ? 'success' : 'primary'} />`}
      >
        <UploadDemo />
      </Example>
    </ExamplePage>
  );
}
