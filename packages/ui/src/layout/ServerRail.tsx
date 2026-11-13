import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Add } from 'iconsax-reactjs';

import {
  moverNaOrdem,
  ordenarServidores,
  posicaoDoAtalho,
  railStorageKey,
  readRailPreferences,
  writeRailPreferences
} from './rails/preferences';
import { SERVER_RAIL_DEFAULT_LABELS, type ServerRailProps } from './rails/types';
import { AcoesDoServidor, Carregando, Erro, ItemDoServidor, Vazio, srOnly } from './server-rail/ServerRailParts';

export const SERVER_RAIL_WIDTH = 64;

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
