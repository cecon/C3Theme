import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, type Theme } from '@mui/material/styles';
import { More } from 'iconsax-reactjs';

import {
  SERVER_RAIL_DEFAULT_LABELS,
  SERVER_STATE_LABEL,
  type ServerAction,
  type ServerRailItem,
  type ServerRailProps
} from '../rails/types';

/** Estado visual do selo; o texto do tooltip é que diz o estado, não a cor. */
/** Cor do selo por estado; o texto do tooltip é que diz o estado, não a cor. */
function estadoTone(t: Theme, estado: ServerRailItem['state']): string {
  switch (estado) {
    case 'online':
      return t.palette.success.main;
    case 'connecting':
    case 'sleeping':
      return t.palette.warning.main;
    case 'error':
    case 'incompatible':
      return t.palette.error.main;
    case 'offline':
      return t.palette.text.disabled;
  }
}

function nomeAcessivel(server: ServerRailItem): string {
  return `${server.name} (${SERVER_STATE_LABEL[server.state]})`;
}

/**
 * Rail de servidores (#116): coluna estreita na borda esquerda com os servidores da conta, o botão de
 * adicionar, menus de ação por servidor, reordenação e atalhos de 1 a 9. A declaração vem da spec; os
 * dados e as ações chegam por porta. Nenhum texto ou desenho foi copiado da referência.
 */
export const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap'
} as const;

export function ItemDoServidor({
  server,
  ativo,
  destacado,
  labels,
  registerButton,
  onSelect,
  onOpenActions,
  onDragStart,
  onDragEnd,
  draggable
}: {
  server: ServerRailItem;
  ativo: boolean;
  destacado: boolean;
  labels: typeof SERVER_RAIL_DEFAULT_LABELS;
  registerButton: (elemento: HTMLElement | null) => void;
  onSelect: () => void;
  onOpenActions: (elemento: HTMLElement) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  draggable: boolean;
}) {
  const Icon = server.icon;
  return (
    <Box
      sx={(t) => ({
        position: 'relative',
        width: '100%',
        borderRadius: 2,
        outline: destacado ? `2px solid ${t.palette.primary.main}` : undefined,
        outlineOffset: -2,
        bgcolor: ativo ? alpha(t.palette.primary.main, t.palette.action.selectedOpacity) : undefined
      })}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <Tooltip
        title={`${server.name} — ${SERVER_STATE_LABEL[server.state]}${server.detail === undefined ? '' : ` · ${server.detail}`}`}
        enterDelay={400}
      >
        <ButtonBase
          ref={registerButton}
          onClick={onSelect}
          onContextMenu={(evento) => {
            evento.preventDefault();
            onOpenActions(evento.currentTarget);
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'ContextMenu' || (evento.shiftKey && evento.key === 'F10')) {
              evento.preventDefault();
              onOpenActions(evento.currentTarget);
            }
          }}
          aria-current={ativo ? 'true' : undefined}
          aria-label={nomeAcessivel(server)}
          sx={(t) => ({
            width: '100%',
            flexDirection: 'column',
            py: 1,
            gap: 0.5,
            borderRadius: 2,
            '&.Mui-focusVisible': { outline: `2px solid ${t.palette.primary.main}`, outlineOffset: -2 }
          })}
        >
          <Badge
            overlap="circular"
            variant="dot"
            sx={(t) => ({
              '& .MuiBadge-badge': { backgroundColor: estadoTone(t, server.state), boxShadow: `0 0 0 2px ${t.palette.background.default}` }
            })}
          >
            {server.imageUrl !== undefined ? (
              <Avatar src={server.imageUrl} alt="" sx={{ width: 32, height: 32 }} />
            ) : Icon !== undefined ? (
              <Icon size={24} variant={ativo ? 'Bulk' : 'Linear'} />
            ) : (
              <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>{server.name.trim().charAt(0).toUpperCase()}</Avatar>
            )}
          </Badge>
          <Typography component="span" sx={{ ...srOnly, fontSize: 10 }}>
            {SERVER_STATE_LABEL[server.state]}
          </Typography>
          {ativo && (
            <Box aria-hidden sx={{ width: 3, height: 16, borderRadius: 2, bgcolor: 'primary.main', position: 'absolute', left: 2 }} />
          )}
        </ButtonBase>
      </Tooltip>
      <IconButton
        aria-label={`${labels.actions}: ${server.name}`}
        size="small"
        onClick={(evento) => onOpenActions(evento.currentTarget)}
        sx={{ position: 'absolute', top: 0, right: 0, p: 0.25, opacity: ativo ? 1 : 0.001, '&:focus-visible': { opacity: 1 } }}
      >
        <More size={14} />
      </IconButton>
    </Box>
  );
}

export function AcoesDoServidor({
  server,
  actions,
  labels,
  local,
  onMover,
  onOcultar,
  onAction
}: {
  server: ServerRailItem | undefined;
  actions: ServerRailProps['actions'];
  labels: typeof SERVER_RAIL_DEFAULT_LABELS;
  local: boolean;
  onMover: (direcao: -1 | 1) => void;
  onOcultar: () => void;
  onAction: (id: string) => void;
}) {
  if (server === undefined) {
    return null;
  }
  const declaradas: readonly ServerAction[] = actions?.(server) ?? [];
  return (
    <>
      {declaradas.map((acao) => (
        <MenuItem
          key={acao.id}
          disabled={acao.disabled ?? false}
          title={acao.instruction}
          onClick={() => !(acao.disabled ?? false) && onAction(acao.id)}
        >
          {acao.label}
        </MenuItem>
      ))}
      {!local && (
        <>
          <Divider />
          <MenuItem onClick={() => onMover(-1)}>{labels.moveUp}</MenuItem>
          <MenuItem onClick={() => onMover(1)}>{labels.moveDown}</MenuItem>
        </>
      )}
      {local && (
        <>
          <Divider />
          <MenuItem onClick={onOcultar}>{labels.showLocal(server.name).replace('Reexibir', 'Ocultar')}</MenuItem>
        </>
      )}
    </>
  );
}

export function Carregando({ label }: { label: string }) {
  return (
    <Stack spacing={1} sx={{ py: 1, px: 0.5 }} aria-busy="true" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rounded" width={36} height={36} sx={{ mx: 'auto', borderRadius: 2 }} />
      ))}
    </Stack>
  );
}

export function Erro({ mensagem, retry, onRetry }: { mensagem: string; retry: string; onRetry?: () => void }) {
  return (
    <Stack spacing={1} sx={{ px: 0.5, py: 1, textAlign: 'center' }} role="alert">
      <Typography variant="caption">{mensagem}</Typography>
      {onRetry !== undefined && (
        <Typography
          component="button"
          variant="caption"
          onClick={onRetry}
          sx={{ background: 'none', border: 0, color: 'primary.main', cursor: 'pointer' }}
        >
          {retry}
        </Typography>
      )}
    </Stack>
  );
}

export function Vazio({ titulo, descricao, addLabel, onAdd }: { titulo: string; descricao: string; addLabel: string; onAdd?: () => void }) {
  return (
    <Stack spacing={0.5} sx={{ px: 0.5, py: 1, textAlign: 'center' }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {titulo}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
        {descricao}
      </Typography>
      {onAdd !== undefined && (
        <Typography
          component="button"
          variant="caption"
          onClick={onAdd}
          sx={{ background: 'none', border: 0, color: 'primary.main', cursor: 'pointer' }}
        >
          {addLabel}
        </Typography>
      )}
    </Stack>
  );
}
