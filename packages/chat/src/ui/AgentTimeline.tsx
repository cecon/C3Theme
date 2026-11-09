import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

// third-party
import { Danger, MessageText1, People, Send2, Setting2 } from 'iconsax-reactjs';

import { timelineRows, type AgentEvent, type AgentEventKind } from '../core/agentPanel';
import AgentPanelSection, { type PanelHeading } from './AgentPanelSection';
import { useDayFormat, useTimeFormat } from './format';
import { useChatText } from './text';

export interface AgentTimelineProps {
  /** Eventos do mais novo para o mais antigo. */
  events: AgentEvent[];
  /** Clique num item (abrir a mensagem, a ferramenta, a conversa com o outro agente). */
  onOpen?: (eventId: string) => void;
  /** Há eventos mais antigos: mostra "Carregar mais". */
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  /** Rótulo da seção. Padrão: "O que fez". */
  title?: ReactNode;
  /** Nível do título da seção. Padrão: `h3`. */
  headingComponent?: PanelHeading;
}

// só para leitor de tela (o ícone vermelho não basta para dizer que foi erro)
const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

const ICON: Record<AgentEventKind, typeof Send2> = {
  received: MessageText1,
  tool: Setting2,
  delegated: People,
  replied: Send2,
  error: Danger
};

function Row({ event, onOpen }: { event: AgentEvent; onOpen?: (id: string) => void }) {
  const t = useChatText();
  const time = useTimeFormat();
  const Icon = ICON[event.kind];
  const error = event.kind === 'error';
  const content = (
    <Box
      sx={{ display: 'grid', gridTemplateColumns: '44px 16px minmax(0, 1fr)', columnGap: 1, alignItems: 'start', width: '100%', py: 0.75 }}
    >
      <Typography
        component="time"
        dateTime={event.at}
        variant="caption"
        sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', lineHeight: '20px' }}
      >
        {time(event.at)}
      </Typography>
      <Box aria-hidden sx={{ display: 'flex', height: 20, alignItems: 'center', color: error ? 'error.main' : 'text.secondary' }}>
        <Icon size={16} color="currentColor" variant={error ? 'Bold' : 'Linear'} />
      </Box>
      <Typography variant="body2" sx={{ textAlign: 'start', overflowWrap: 'anywhere', lineHeight: '20px' }}>
        {error && <Box component="span" sx={srOnly}>{`${t('c3.chat.eventError')}:`}</Box>}
        {error && ' '}
        {event.text}
      </Typography>
    </Box>
  );
  return (
    <Box component="li" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      {onOpen ? (
        <ButtonBase
          onClick={() => onOpen(event.id)}
          sx={{ width: '100%', borderRadius: 1, px: 0.5, mx: -0.5, '&:hover': { bgcolor: 'action.hover' } }}
        >
          {content}
        </ButtonBase>
      ) : (
        content
      )}
    </Box>
  );
}

/**
 * Linha do tempo "O que fez": eventos com horário, ícone por tipo e texto curto, através de vários turnos. O dia
 * aparece quando muda; clicar abre o evento; "Carregar mais" pede os anteriores ao app.
 */
export default function AgentTimeline({ events, onOpen, hasMore, loadingMore, onLoadMore, title, headingComponent }: AgentTimelineProps) {
  const t = useChatText();
  const day = useDayFormat();
  const rows = timelineRows(events);
  return (
    <AgentPanelSection headingComponent={headingComponent} title={title ?? t('c3.chat.timeline')}>
      {rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 0.75 }}>
          {t('c3.chat.timelineEmpty')}
        </Typography>
      ) : (
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {rows.map((r) => [
            r.day && (
              <Box component="li" key={`d-${r.event.id}`} sx={{ pt: 1, pb: 0.25 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {day.separator(r.day)}
                </Typography>
              </Box>
            ),
            <Row key={r.event.id} event={r.event} onOpen={onOpen} />
          ])}
        </Box>
      )}
      {hasMore && onLoadMore && (
        <Button size="small" onClick={onLoadMore} disabled={loadingMore} sx={{ mt: 0.5 }}>
          {loadingMore ? t('c3.chat.loadingMore') : t('c3.chat.loadMore')}
        </Button>
      )}
    </AgentPanelSection>
  );
}
