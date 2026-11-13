import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// material-ui
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, type Theme } from '@mui/material/styles';
import { Add, More } from 'iconsax-reactjs';

import {
  moverNaOrdem,
  ordenarServidores,
  posicaoDoAtalho,
  railStorageKey,
  readRailPreferences,
  writeRailPreferences
} from './rails/preferences';
import {
  SERVER_RAIL_DEFAULT_LABELS,
  SERVER_STATE_LABEL,
  type ServerAction,
  type ServerRailItem,
  type ServerRailProps
} from './rails/types';

export const SERVER_RAIL_WIDTH = 64;

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
export default function ServerRail({
  servers,
  activeId,
  state = 'ready',
  errorMessage,
  addOptions = [],
  actions,
  hiddenLocal,
  shortcut = true,
  localServerId,
  storageKey,
  onSelect,
  onAdd,
  onShowLocal,
  onAction,
  onRetry,
  onReorder,
  onAnnounce,
  labels: labelsParciais,
  className
}: ServerRailProps & { readonly localServerId?: string }) {
  const labels = { ...SERVER_RAIL_DEFAULT_LABELS, ...labelsParciais };
  const chave = storageKey ?? railStorageKey('app');
  const [prefs, setPrefs] = useState(() => readRailPreferences(globalThis.localStorage, chave));
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [destino, setDestino] = useState<number | null>(null);
  const [menuDe, setMenuDe] = useState<string | null>(null);
  const [menuDeAcoes, setMenuDeAcoes] = useState<HTMLElement | null>(null);
  const [menuAdicionar, setMenuAdicionar] = useState<HTMLElement | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const botoes = useRef(new Map<string, HTMLElement>());
  const anuncio = useRef<HTMLDivElement>(null);

  const visiveis = useMemo(() => {
    const semOculto = prefs.localHidden && localServerId !== undefined ? servers.filter((s) => s.id !== localServerId) : servers;
    return ordenarServidores(semOculto, prefs.serverOrder);
  }, [servers, prefs.localHidden, prefs.serverOrder, localServerId]);

  const anunciar = useCallback(
    (mensagem: string) => {
      onAnnounce?.(mensagem);
      if (anuncio.current !== null) {
        anuncio.current.textContent = mensagem;
      }
    },
    [onAnnounce]
  );

  const salvar = useCallback(
    (mudanca: Partial<typeof prefs>) => {
      const proximo = { ...prefs, ...mudanca };
      setPrefs(proximo);
      writeRailPreferences(globalThis.localStorage, chave, proximo);
    },
    [chave, prefs]
  );

  // atalhos de 1 a 9 na ordem exibida
  useEffect(() => {
    if (!shortcut || state !== 'ready') {
      return undefined;
    }
    const plataforma = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? 'mac' : 'other';
    const ouvir = (evento: KeyboardEvent) => {
      const posicao = posicaoDoAtalho(evento, plataforma);
      if (posicao === undefined) {
        return;
      }
      const alvo = visiveis[posicao];
      if (alvo === undefined || alvo.id === activeId) {
        return;
      }
      evento.preventDefault();
      onSelect(alvo.id);
    };
    window.addEventListener('keydown', ouvir);
    return () => window.removeEventListener('keydown', ouvir);
  }, [shortcut, state, visiveis, activeId, onSelect]);

  const reordenar = useCallback(
    (ids: readonly string[]) => {
      if (ids.join('|') === visiveis.map((s) => s.id).join('|')) {
        return;
      }
      salvar({ serverOrder: [...ids] });
      onReorder?.(ids);
    },
    [salvar, onReorder, visiveis]
  );

  const mover = useCallback(
    (id: string, direcao: -1 | 1) => {
      const ids = visiveis.map((s) => s.id);
      const nova = moverNaOrdem(ids, id, direcao);
      if (nova === ids) {
        return;
      }
      reordenar(nova);
      anunciar(`Servidor movido para a posição ${nova.indexOf(id) + 1} de ${nova.length}.`);
    },
    [visiveis, reordenar, anunciar]
  );

  const abrirMenuDe = (id: string, elemento: HTMLElement) => {
    setMenuDe(id);
    const botao = botoes.current.get(id);
    if (botao !== undefined) {
      setMenuDeAcoes(elemento);
    }
  };

  return (
    <Box
      component="nav"
      aria-label={labels.navigation}
      className={className}
      sx={{
        width: SERVER_RAIL_WIDTH,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}
    >
      <Stack ref={listaRef} component="div" spacing={0.5} sx={{ flex: 1, overflowY: 'auto', py: 1, px: 0.5, width: '100%' }}>
        {state === 'loading' && <Carregando label={labels.loading} />}
        {state === 'error' && <Erro mensagem={errorMessage ?? labels.errorTitle} retry={labels.retry} onRetry={onRetry} />}
        {state === 'ready' && visiveis.length === 0 && (
          <Vazio
            titulo={labels.emptyTitle}
            descricao={labels.emptyDescription}
            onAdd={onAdd === undefined ? undefined : () => onAdd()}
            addLabel={labels.add}
          />
        )}
        {state === 'ready' &&
          visiveis.map((server, indice) => (
            <div
              key={server.id}
              onDragOver={(evento) => {
                evento.preventDefault();
                setDestino(indice);
              }}
              onDrop={() => {
                if (arrastando !== null) {
                  const ids = visiveis.map((s) => s.id).filter((id) => id !== arrastando);
                  ids.splice(indice, 0, arrastando);
                  reordenar(ids);
                  anunciar(`Servidor movido para a posição ${indice + 1} de ${ids.length}.`);
                }
                setArrastando(null);
                setDestino(null);
              }}
            >
              <ItemDoServidor
                server={server}
                ativo={server.id === activeId}
                destacado={destino === indice && arrastando !== null && arrastando !== server.id}
                labels={labels}
                registerButton={(elemento) =>
                  elemento === null ? botoes.current.delete(server.id) : botoes.current.set(server.id, elemento)
                }
                onSelect={() => (server.id === activeId ? undefined : onSelect(server.id))}
                onOpenActions={(elemento) => abrirMenuDe(server.id, elemento)}
                onDragStart={() => setArrastando(server.id)}
                onDragEnd={() => {
                  setArrastando(null);
                  setDestino(null);
                }}
                draggable
              />
            </div>
          ))}
      </Stack>
      <Divider sx={{ width: '60%' }} />
      <Box sx={{ py: 1 }}>
        <Tooltip title={labels.add} enterDelay={400}>
          <IconButton
            aria-label={labels.add}
            onClick={(evento) =>
              addOptions.length > 1 || (hiddenLocal !== undefined && prefs.localHidden) ? setMenuAdicionar(evento.currentTarget) : onAdd?.()
            }
            sx={(t) => ({
              width: 40,
              height: 40,
              border: 1,
              borderColor: 'divider',
              borderStyle: 'dashed',
              color: 'text.secondary',
              '&:hover': { color: t.palette.primary.main, borderColor: t.palette.primary.main }
            })}
          >
            <Add size={20} />
          </IconButton>
        </Tooltip>
      </Box>
      <Menu anchorEl={menuAdicionar} open={menuAdicionar !== null} onClose={() => setMenuAdicionar(null)}>
        {prefs.localHidden && hiddenLocal !== undefined && (
          <MenuItem
            onClick={() => {
              setMenuAdicionar(null);
              onShowLocal?.();
              salvar({ localHidden: false });
            }}
          >
            {labels.showLocal(hiddenLocal.name)}
          </MenuItem>
        )}
        {addOptions.map((opcao) => (
          <MenuItem
            key={opcao.id}
            onClick={() => {
              setMenuAdicionar(null);
              onAdd?.(opcao.id);
            }}
          >
            {opcao.label}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={menuDeAcoes}
        open={menuDe !== null && menuDeAcoes !== null}
        onClose={() => {
          setMenuDe(null);
          setMenuDeAcoes(null);
        }}
        transitionDuration={0}
      >
        <AcoesDoServidor
          server={visiveis.find((s) => s.id === menuDe)}
          actions={actions}
          labels={labels}
          local={menuDe === localServerId}
          onMover={(direcao) => {
            if (menuDe !== null) {
              mover(menuDe, direcao);
            }
            setMenuDe(null);
            setMenuDeAcoes(null);
          }}
          onOcultar={() => {
            salvar({ localHidden: true });
            anunciar(`Servidor ${hiddenLocal?.name ?? ''} oculto.`);
            setMenuDe(null);
            setMenuDeAcoes(null);
          }}
          onAction={(id) => {
            if (menuDe !== null) {
              onAction?.(menuDe, id);
            }
            setMenuDe(null);
            setMenuDeAcoes(null);
          }}
        />
      </Menu>
      <Box ref={anuncio} aria-live="polite" sx={srOnly} />
      <Typography component="span" sx={srOnly}>
        {labels.shortcuts}
      </Typography>
    </Box>
  );
}

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

function ItemDoServidor({
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

function AcoesDoServidor({
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

function Carregando({ label }: { label: string }) {
  return (
    <Stack spacing={1} sx={{ py: 1, px: 0.5 }} aria-busy="true" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rounded" width={36} height={36} sx={{ mx: 'auto', borderRadius: 2 }} />
      ))}
    </Stack>
  );
}

function Erro({ mensagem, retry, onRetry }: { mensagem: string; retry: string; onRetry?: () => void }) {
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

function Vazio({ titulo, descricao, addLabel, onAdd }: { titulo: string; descricao: string; addLabel: string; onAdd?: () => void }) {
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
