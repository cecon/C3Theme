import { useId, useState, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

// third-party
import { ArrowDown2 } from 'iconsax-reactjs';

import { pendingCount, sortRequests, type AgentRequest, type AgentState } from '../../core/agents';
import { useChatText } from '../text';
import AgentPresence from './AgentPresence';
import { notchRowSx, notchSideSx, notchWidth } from './notch';
import RequestCard, { type RequestHandlers } from './RequestCard';
import useScrollFade from './useScrollFade';

/** Agente que aparece na faixa recolhida: o mais recente, com a linha do que está fazendo. */
export interface StripActivity {
  name: string;
  avatar: ReactNode;
  state: AgentState;
  /** "Atendente respondendo a Marina". */
  activity: string;
}

export interface AgentStripProps extends RequestHandlers {
  latest?: StripActivity;
  requests: AgentRequest[];
  /** Avatar de cada agente nos cartões. */
  avatarOf?: (agentId: string) => ReactNode;
  /** Aberta (pilha de cartões) ou recolhida. Sem isso, a faixa controla sozinha. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Largura da faixa. Padrão: 420 px (até a largura da janela). */
  width?: number | string;
  /** Altura máxima da pilha aberta antes de rolar. Padrão: 480 px. */
  height?: number | string;
  /** Fundo e sombra. Desligue em janela transparente. Padrão: ligado. */
  background?: boolean;
  /** Movimento do anel do agente e da abertura. Padrão: ligado. */
  animate?: boolean;
  /**
   * Largura (px) do entalhe do Mac em cima do meio da faixa. Maior que zero, a faixa recolhida abre um vão: avatar e
   * atividade à esquerda, contador e seta à direita, e o vão não recebe clique. Faixa centrada no entalhe; dê largura
   * para os dois lados (entalhe de 200 px pede uns 560 px). 0 ou ausente: sem vão.
   */
  notch?: number;
}

/**
 * Faixa do topo: recolhida mostra o agente mais recente, o que ele está fazendo e quantos pedidos esperam; aberta,
 * a pilha de pedidos (aprovação, pergunta, trabalho, falha). Os botões só chamam os callbacks; rede é com o app.
 */
export default function AgentStrip({
  latest,
  requests,
  avatarOf,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  width = 420,
  height = 480,
  background = true,
  animate = true,
  notch,
  ...handlers
}: AgentStripProps) {
  const t = useChatText();
  const listId = useId();
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [own, setOwn] = useState(defaultExpanded);
  const open = expanded ?? own;
  const toggle = () => {
    if (expanded === undefined) setOwn(!open);
    onExpandedChange?.(!open);
  };
  const { ref, maskSx } = useScrollFade<HTMLDivElement>();
  const pending = pendingCount(requests);
  const sorted = sortRequests(requests);
  const gap = notchWidth(notch);

  return (
    <Box
      component="section"
      aria-label={t('c3.chat.requests')}
      sx={{
        width,
        maxWidth: '100%',
        borderRadius: open ? 3 : 999,
        overflow: 'hidden',
        transition: reduced || !animate ? 'none' : 'border-radius .2s',
        ...(background && { bgcolor: 'background.paper', border: 1, borderColor: 'divider', boxShadow: 4 })
      }}
    >
      <ButtonBase
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggle}
        sx={[
          {
            width: '100%',
            gap: 1.25,
            px: 1,
            py: 0.75,
            justifyContent: 'flex-start',
            textAlign: 'start',
            '&:hover': { bgcolor: 'action.hover' }
          },
          gap > 0 && notchRowSx(gap)
        ]}
      >
        <Box sx={notchSideSx(gap, 'start')}>
          {latest && <AgentPresence avatar={latest.avatar} state={latest.state} size={32} animate={animate} />}
          <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 500 }}>
            {latest ? latest.activity : t('c3.chat.requests')}
          </Typography>
        </Box>
        <Box sx={notchSideSx(gap, 'end')}>
          <Typography
            variant="caption"
            sx={(theme) => ({
              flexShrink: 0,
              px: 1,
              py: 0.25,
              borderRadius: 999,
              fontWeight: 700,
              ...(pending > 0
                ? { bgcolor: 'error.main', color: 'error.contrastText' }
                : { bgcolor: theme.vars.palette.action.hover, color: 'text.secondary' })
            })}
          >
            {t('c3.chat.pending', { count: pending })}
          </Typography>
          <Box
            component={ArrowDown2}
            size={16}
            aria-hidden
            sx={{ flexShrink: 0, color: 'text.secondary', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
          />
        </Box>
      </ButtonBase>

      <Collapse in={open} timeout={reduced || !animate ? 0 : 'auto'} unmountOnExit>
        <Box ref={ref} id={listId} sx={{ maxHeight: height, overflowY: 'auto', px: 1, pb: 1, ...maskSx }}>
          {sorted.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1.5 }}>
              {t('c3.chat.noRequests')}
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ pt: 0.5 }}>
              {sorted.map((r) => (
                <RequestCard key={r.id} request={r} avatar={avatarOf?.(r.agentId)} {...handlers} />
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
