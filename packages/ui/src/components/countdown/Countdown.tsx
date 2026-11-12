import { useEffect, useRef, useState } from 'react';

// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useUiText } from '../../i18n';
import { countdownParts, twoDigits } from './parts';

export interface CountdownProps {
  /** Até quando conta: data, ISO 8601 ou instante em ms. */
  until: Date | string | number;
  /** Chamado uma vez quando a contagem chega a zero (não chama se já tinha passado ao montar). */
  onDone?: () => void;
}

const CELL = {
  alignItems: 'center',
  minWidth: 64,
  py: 1.5,
  borderRadius: 2,
  border: 1,
  borderColor: 'divider',
  bgcolor: 'background.paper'
} as const;

/** Dias, horas, minutos e segundos até `until`, um bloco por unidade, atualizado a cada segundo. */
export default function Countdown({ until, onDone }: CountdownProps) {
  const t = useUiText();
  const target = new Date(until).getTime();
  const [now, setNow] = useState(() => Date.now());
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (target <= Date.now()) return;
    const timer = setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (at < target) return;
      clearInterval(timer);
      done.current?.();
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <Stack direction="row" spacing={1.5} role="timer" aria-label={t('c3.countdown.label')}>
      {countdownParts(target, now).map((p) => (
        <Stack key={p.unit} sx={CELL}>
          <Typography variant="h3">{twoDigits(p.value)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t(`c3.countdown.${p.unit}`)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
