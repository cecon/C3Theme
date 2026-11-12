import { useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { declineTool } from '../../core/hitl';
import { browserDecision, decideBrowser, isBrowserCheckpoint, type BrowserCheckpoint } from '../../core/hitlBrowser';
import type { UiPartProps } from '../UiParts';
import { useChatText } from '../text';
import BrowserView from './BrowserView';
import ClosedLine from './ClosedLine';
import DeclineBox from './DeclineBox';
import useDecision from './useDecision';
import { actionsSx, headerSx, spacerSx } from './sx';

/**
 * `c3.browser`: o agente parou numa página antes de um passo que pede o humano (enviar um pedido, entrar num site
 * novo). O card mostra a página como o agente vê, onde ele vai clicar e o que quer fazer; o humano permite, recusa
 * com o porquê ou assume o controle (o agente espera ele devolver).
 */
export default function BrowserPart(props: UiPartProps) {
  const t = useChatText();
  if (!isBrowserCheckpoint(props.part.payload)) return <Alert severity="warning">{t('c3.chat.hitl.invalid')}</Alert>;
  return <BrowserBody {...props} checkpoint={props.part.payload} />;
}

function BrowserBody({ part, open, onAnswer, checkpoint: c }: UiPartProps & { checkpoint: BrowserCheckpoint }) {
  const t = useChatText();
  const { disabled, decide } = useDecision({ open, onAnswer });
  const [declining, setDeclining] = useState(false);
  const title = c.title ?? c.url;

  if (!open) {
    const decision = browserDecision(part);
    if (part.state === 'submitted')
      return (
        <ClosedLine
          tone="success"
          title={c.intent}
          label={t(decision === 'takeover' ? 'c3.chat.browser.tookOver' : 'c3.chat.browser.allowed')}
        />
      );
    if (part.state === 'declined')
      return (
        <ClosedLine
          tone="error"
          title={c.intent}
          label={t('c3.chat.browser.declined')}
          reason={(part.result as { reason?: string } | undefined)?.reason}
        />
      );
    return <ClosedLine title={c.intent} />;
  }

  const footer = declining ? (
    <DeclineBox disabled={disabled} onBack={() => setDeclining(false)} onDecline={(r) => void decide(declineTool(r))} />
  ) : (
    <Stack direction="row" sx={actionsSx}>
      <Button
        variant="contained"
        color={c.risk === 'high' ? 'error' : 'primary'}
        disabled={disabled}
        onClick={() => void decide(decideBrowser('allow'))}
      >
        {t('c3.chat.browser.allow')}
      </Button>
      {c.allowTakeover !== false && (
        <Button color="secondary" disabled={disabled} onClick={() => void decide(decideBrowser('takeover'))}>
          {t('c3.chat.browser.takeOver')}
        </Button>
      )}
      <Box sx={spacerSx} />
      <Button color="error" disabled={disabled} onClick={() => setDeclining(true)}>
        {t('c3.chat.tool.decline')}
      </Button>
    </Stack>
  );

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1} sx={headerSx}>
        <Typography variant="subtitle2" component="p">
          {t('c3.chat.browser.wants', { intent: c.intent })}
        </Typography>
        {c.risk === 'high' && <Chip size="small" color="error" variant="outlined" label={t('c3.chat.tool.risk.high')} />}
      </Stack>
      <BrowserView url={c.url} title={title} frame={c.frame} target={c.target} control="agent" footer={footer} />
    </Stack>
  );
}
