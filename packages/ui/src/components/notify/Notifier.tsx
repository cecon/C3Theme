import { useEffect, useRef, useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grow from '@mui/material/Grow';
import Stack from '@mui/material/Stack';

import { durationOf, type Notice } from './queue';
import { dismissNotice, useNotices } from './store';

/** Ponto onde os avisos de `notify` aparecem; vai uma vez na raiz do app. */
export default function Notifier() {
  const notices = useNotices();
  if (notices.length === 0) return null;
  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        zIndex: (t) => t.zIndex.snackbar,
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        left: { xs: 16, sm: 'auto' },
        alignItems: { xs: 'stretch', sm: 'flex-end' },
        pointerEvents: 'none'
      }}
    >
      {notices.map((n) => (
        <NoticeItem key={n.id} notice={n} />
      ))}
    </Stack>
  );
}

/** Um aviso: fecha sozinho no tempo dele, mas pausa com o mouse em cima ou o foco dentro (dá tempo de ler). */
function NoticeItem({ notice }: { notice: Notice }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(durationOf(notice));

  // repetiu: o tempo recomeça do zero
  useEffect(() => {
    left.current = durationOf(notice);
  }, [notice]);

  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = setTimeout(() => dismissNotice(notice.id), left.current);
    return () => {
      clearTimeout(timer);
      left.current = Math.max(1000, left.current - (Date.now() - started));
    };
  }, [paused, notice.id, notice.version]);

  const close = () => dismissNotice(notice.id);
  const urgent = notice.severity === 'error' || notice.severity === 'warning';
  return (
    <Grow in>
      <Alert
        role={urgent ? 'alert' : 'status'}
        severity={notice.severity}
        variant="filled"
        onClose={close}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        sx={{ minWidth: { sm: 280 }, maxWidth: { sm: 420 }, pointerEvents: 'auto', boxShadow: 6 }}
        action={
          notice.action && (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                notice.action!.onClick();
                close();
              }}
            >
              {notice.action.label}
            </Button>
          )
        }
      >
        {notice.message}
        {notice.count > 1 && ` (${notice.count}×)`}
      </Alert>
    </Grow>
  );
}
