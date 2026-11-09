// Demonstrações de aviso: básico, desfazer, cores, posição, transição e duração.
import { ReactElement, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';
import IconButton from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';
import Slider from '@mui/material/Slider';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { TransitionProps } from '@mui/material/transitions';
import { CloseCircle } from 'iconsax-reactjs';
import { type NotifySeverity } from '@c3theme/ui';
import { Row } from '../../Example';

export const SEVERITIES: { severity: NotifySeverity; label: string; text: string }[] = [
  { severity: 'success', label: 'Sucesso', text: 'Cliente salvo com sucesso.' },
  { severity: 'info', label: 'Informação', text: 'Relatório em processamento.' },
  { severity: 'warning', label: 'Atenção', text: 'Estoque baixo em 3 produtos.' },
  { severity: 'error', label: 'Erro', text: 'Não foi possível salvar.' }
];

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton size="small" aria-label="Fechar" color="inherit" onClick={onClick}>
      <CloseCircle size={18} />
    </IconButton>
  );
}

export function BasicDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Abrir aviso simples
      </Button>
      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} message="Rascunho salvo automaticamente." />
    </>
  );
}

export function UndoDemo() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(5);
  const close = () => setOpen(false);
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="body2" color="text.secondary">
        {items} e-mails na caixa de entrada
      </Typography>
      <Row>
        <Button
          variant="outlined"
          color="error"
          disabled={items === 0}
          onClick={() => {
            setItems((n) => n - 1);
            setOpen(true);
          }}
        >
          Excluir um e-mail
        </Button>
      </Row>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={(_, reason) => reason !== 'clickaway' && close()}
        message="E-mail movido para a lixeira."
        action={
          <>
            <Button
              color="primary"
              size="small"
              onClick={() => {
                setItems((n) => n + 1);
                close();
              }}
            >
              Desfazer
            </Button>
            <CloseButton onClick={close} />
          </>
        }
      />
    </Stack>
  );
}

export function ColoredDemo() {
  const [state, setState] = useState<{ severity: NotifySeverity; variant: 'filled' | 'outlined' | 'standard' } | null>(null);
  return (
    <Stack spacing={1.5}>
      {(['filled', 'standard', 'outlined'] as const).map((variant) => (
        <Row key={variant} gap={1}>
          <Typography variant="body2" color="text.secondary" sx={{ width: 90 }}>
            {{ filled: 'Preenchido', standard: 'Suave', outlined: 'Contornado' }[variant]}
          </Typography>
          {SEVERITIES.map((s) => (
            <Button
              key={s.severity}
              size="small"
              color={s.severity}
              variant="outlined"
              onClick={() => setState({ severity: s.severity, variant })}
            >
              {s.label}
            </Button>
          ))}
        </Row>
      ))}
      <Snackbar
        open={state !== null}
        autoHideDuration={4000}
        onClose={() => setState(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {state ? (
          <Alert
            severity={state.severity}
            variant={state.variant}
            onClose={() => setState(null)}
            sx={{ minWidth: 280, bgcolor: state.variant === 'filled' ? undefined : 'background.paper', boxShadow: 6 }}
          >
            {SEVERITIES.find((s) => s.severity === state.severity)!.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  );
}

const POSITIONS: { origin: SnackbarOrigin; label: string }[] = [
  { origin: { vertical: 'top', horizontal: 'left' }, label: 'Cima à esquerda' },
  { origin: { vertical: 'top', horizontal: 'center' }, label: 'Cima ao centro' },
  { origin: { vertical: 'top', horizontal: 'right' }, label: 'Cima à direita' },
  { origin: { vertical: 'bottom', horizontal: 'left' }, label: 'Baixo à esquerda' },
  { origin: { vertical: 'bottom', horizontal: 'center' }, label: 'Baixo ao centro' },
  { origin: { vertical: 'bottom', horizontal: 'right' }, label: 'Baixo à direita' }
];

export function PositionDemo() {
  const [pos, setPos] = useState<(typeof POSITIONS)[number] | null>(null);
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {POSITIONS.map((p) => (
          <Button key={p.label} variant="outlined" size="small" onClick={() => setPos(p)}>
            {p.label}
          </Button>
        ))}
      </Box>
      <Snackbar
        key={pos?.label}
        open={pos !== null}
        anchorOrigin={pos?.origin ?? POSITIONS[0]!.origin}
        autoHideDuration={3000}
        onClose={() => setPos(null)}
        message={pos ? `Aviso em: ${pos.label.toLowerCase()}` : ''}
      />
    </>
  );
}

function SlideUp(props: TransitionProps & { children: ReactElement }) {
  return <Slide {...props} direction="up" />;
}
function SlideLeft(props: TransitionProps & { children: ReactElement }) {
  return <Slide {...props} direction="left" />;
}

const TRANSITIONS = [
  { label: 'Crescer', component: Grow },
  { label: 'Esmaecer', component: Fade },
  { label: 'Deslizar para cima', component: SlideUp },
  { label: 'Deslizar da direita', component: SlideLeft }
];

export function TransitionDemo() {
  const [current, setCurrent] = useState<(typeof TRANSITIONS)[number] | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Row gap={1}>
        {TRANSITIONS.map((t) => (
          <Button
            key={t.label}
            variant="outlined"
            onClick={() => {
              setCurrent(t);
              setOpen(true);
            }}
          >
            {t.label}
          </Button>
        ))}
      </Row>
      <Snackbar
        key={current?.label}
        open={open}
        onClose={() => setOpen(false)}
        autoHideDuration={3000}
        slots={{ transition: current?.component ?? Grow }}
        message={`Transição: ${current?.label.toLowerCase() ?? ''}`}
      />
    </>
  );
}

export function DurationDemo() {
  const [seconds, setSeconds] = useState(3);
  const [open, setOpen] = useState(false);
  return (
    <Stack spacing={2}>
      <Box sx={{ px: 1 }}>
        <Typography variant="body2" gutterBottom>
          Fecha em {seconds} s
        </Typography>
        <Slider aria-label="Duração" min={1} max={10} value={seconds} onChange={(_, v) => setSeconds(v)} marks valueLabelDisplay="auto" />
      </Box>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ alignSelf: 'flex-start' }}>
        Mostrar
      </Button>
      <Snackbar
        open={open}
        autoHideDuration={seconds * 1000}
        onClose={() => setOpen(false)}
        message={`Este aviso some em ${seconds} segundo${seconds > 1 ? 's' : ''}.`}
      />
    </Stack>
  );
}
