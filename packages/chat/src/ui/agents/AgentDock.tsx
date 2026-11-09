import { useId, useRef, useState, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';

import type { AgentState } from '../../core/agents';
import type { Message } from '../../core/types';
import { useChatText } from '../text';
import AgentPresence from './AgentPresence';
import DockBalloon from './DockBalloon';
import useScrollFade from './useScrollFade';

const HIDDEN = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

export interface DockAgent {
  id: string;
  name: string;
  state: AgentState;
  /** Desenho do agente (SoftAvatar, imagem, SVG). Preenche o círculo. */
  avatar: ReactNode;
  /** Pedidos esperando a pessoa (selo "1"). */
  pending?: number;
}

export interface AgentDockProps {
  agents: DockAgent[];
  /** Borda da tela onde a doca fica; o balão abre para o lado de dentro. Padrão: `right`. */
  side?: 'left' | 'right';
  /** Movimento dos estados. O app desliga quando a pessoa está em outro app. Padrão: ligado. */
  animate?: boolean;
  /** Fundo e borda da coluna. Desligue em janela transparente. Padrão: ligado. */
  background?: boolean;
  /** Diâmetro de cada item, em px. Padrão: 44. */
  size?: number;
  /** Altura máxima antes de rolar. Padrão: a altura disponível. */
  maxHeight?: number | string;
  /** Agente com o balão aberto. Sem isso, a doca controla sozinha. */
  openId?: string | null;
  onOpenChange?: (id: string | null) => void;
  /** Últimas mensagens da conversa com o agente, para o balão. */
  messagesOf?: (agentId: string) => Message[];
  onReply?: (agentId: string, text: string) => void;
  onOpenConversation?: (agentId: string) => void;
}

/**
 * Doca de agentes: coluna estreita de avatares presa à borda da tela, com o estado de cada um e o selo do que espera
 * a pessoa. Clicar num item abre o balão de conversa ao lado. A janela (sempre por cima, posição, borda) é do app.
 */
export default function AgentDock({
  agents,
  side = 'right',
  animate = true,
  background = true,
  size = 44,
  maxHeight = '100%',
  openId,
  onOpenChange,
  messagesOf,
  onReply,
  onOpenConversation
}: AgentDockProps) {
  const t = useChatText();
  const baseId = useId();
  const [ownOpen, setOwnOpen] = useState<string | null>(null);
  const open = openId === undefined ? ownOpen : openId;
  const setOpen = (id: string | null) => {
    if (openId === undefined) setOwnOpen(id);
    onOpenChange?.(id);
  };
  const dock = useRef<HTMLElement>(null);
  const { ref: scroller, maskSx } = useScrollFade<HTMLDivElement>();
  const current = agents.find((a) => a.id === open);
  const balloonId = `${baseId}-balloon`;
  // o Popper procura o item só quando abre (função), sem ler ref durante o render
  const itemId = (agentId: string) => `${baseId}-agent-${agentId}`;
  const item = (agentId: string) => document.getElementById(itemId(agentId));
  const inward = side === 'right' ? 'left' : 'right';

  return (
    <Box
      component="nav"
      ref={dock}
      aria-label={t('c3.chat.agents')}
      sx={{
        display: 'inline-flex',
        maxHeight,
        p: 0.75,
        borderRadius: 999,
        ...(background && { bgcolor: 'background.paper', border: 1, borderColor: 'divider', boxShadow: 3 })
      }}
    >
      <Box ref={scroller} sx={{ overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, ...maskSx }}>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1, py: 0.5 }}>
          {agents.map((a) => {
            const state = t(`c3.chat.agent.${a.state}`);
            const pending = a.pending ? `, ${t('c3.chat.pending', { count: a.pending })}` : '';
            const isOpen = a.id === open;
            return (
              <Box component="li" key={a.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Tooltip title={isOpen ? '' : `${a.name} · ${state}`} placement={inward} disableInteractive describeChild>
                  <ButtonBase
                    id={itemId(a.id)}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? balloonId : undefined}
                    onClick={() => setOpen(isOpen ? null : a.id)}
                    sx={{ borderRadius: '50%', '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main', outlineOffset: 2 } }}
                  >
                    <AgentPresence avatar={a.avatar} state={a.state} pending={a.pending} size={size} animate={animate} />
                    {/* nome por texto oculto, não aria-label: as iniciais do avatar (aria-hidden) não entram no nome */}
                    <Box component="span" sx={HIDDEN}>{`${a.name}: ${state}${pending}`}</Box>
                  </ButtonBase>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Popper
        open={Boolean(current)}
        anchorEl={current ? () => item(current.id)! : null}
        placement={side === 'right' ? 'left-start' : 'right-start'}
        modifiers={[{ name: 'offset', options: { offset: [0, 12] } }]}
        sx={{ zIndex: 'modal' }}
      >
        <ClickAwayListener onClickAway={(e) => !dock.current?.contains(e.target as Node) && setOpen(null)}>
          <div>
            {current && (
              <DockBalloon
                id={balloonId}
                name={current.name}
                state={current.state}
                avatar={current.avatar}
                messages={messagesOf?.(current.id) ?? []}
                onReply={(text) => onReply?.(current.id, text)}
                onOpen={() => onOpenConversation?.(current.id)}
                onClose={() => {
                  setOpen(null);
                  item(current.id)?.focus();
                }}
              />
            )}
          </div>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
