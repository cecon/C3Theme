// Comportamento do diálogo: arrastar, rolar e transição.
import { PointerEvent as ReactPointerEvent, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper, { PaperProps } from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Row } from '../../Example';
import { TERMS } from './BasicDemos';
import { SlideUp } from './LayoutDemos';

// papel do diálogo que pode ser arrastado pelo título
function DraggablePaper(props: PaperProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('#arrastar-titulo')) return;
    start.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (s) setOffset({ x: s.ox + e.clientX - s.x, y: s.oy + e.clientY - s.y });
  };
  const onPointerUp = () => {
    start.current = null;
  };

  return (
    <Paper
      {...props}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ ...props.style, transform: `translate(${offset.x}px, ${offset.y}px)` }}
    />
  );
}

export function DraggableDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Abrir diálogo arrastável
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} slots={{ paper: DraggablePaper }} aria-labelledby="arrastar-titulo">
        <DialogTitle id="arrastar-titulo" sx={{ cursor: 'move', userSelect: 'none', touchAction: 'none' }}>
          Arraste pelo título
        </DialogTitle>
        <DialogContent>
          <DialogContentText>Útil quando o diálogo cobre uma informação que a pessoa precisa consultar.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function ScrollDemo() {
  const [scroll, setScroll] = useState<'paper' | 'body' | null>(null);
  return (
    <>
      <Row>
        <Button variant="outlined" onClick={() => setScroll('paper')}>
          Rolagem no conteúdo
        </Button>
        <Button variant="outlined" onClick={() => setScroll('body')}>
          Rolagem na página
        </Button>
      </Row>
      <Dialog open={scroll !== null} onClose={() => setScroll(null)} scroll={scroll ?? 'paper'} aria-labelledby="termos-titulo">
        <DialogTitle id="termos-titulo">Termos de serviço</DialogTitle>
        <DialogContent dividers={scroll === 'paper'}>
          {TERMS.map((t) => (
            <Typography key={t} variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t}
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScroll(null)}>Recusar</Button>
          <Button variant="contained" onClick={() => setScroll(null)}>
            Aceitar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function TransitionDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Abrir deslizando
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} slots={{ transition: SlideUp }} keepMounted aria-describedby="transicao-texto">
        <DialogTitle>Usar o assistente de importação?</DialogTitle>
        <DialogContent>
          <DialogContentText id="transicao-texto">O assistente lê sua planilha e cadastra os produtos automaticamente.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Não</Button>
          <Button variant="contained" onClick={() => setOpen(false)}>
            Sim
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
