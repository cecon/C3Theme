import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { Add } from 'iconsax-reactjs';
import { ItemDoServidor, Carregando, Erro, Vazio, srOnly } from './rails/ServerRailParts';
import ServerRailMenus from './rails/ServerRailMenus';
import Typography from '@mui/material/Typography';
import useRailScroll from './rails/useRailScroll';
import { useRailPreferences } from './rails/useRailPreferences';

import { moverNaOrdem, ordenarServidores, posicaoDoAtalho, railStorageKey } from './rails/preferences';
import { SERVER_RAIL_DEFAULT_LABELS, type ServerRailProps } from './rails/types';

export const SERVER_RAIL_WIDTH = 64;

/**
 * Rail de servidores (#116): coluna estreita na borda esquerda com os servidores da conta, o botão de
 * adicionar, menus de ação por servidor, reordenação e atalhos de 1 a 9. A declaração vem da spec; os
 * dados e as ações chegam por porta. Nenhum texto ou desenho foi copiado da referência.
 */
export default function ServerRail(props: ServerRailProps) {
  return <ServerRailScope key={props.storageKey ?? railStorageKey('app')} {...props} />;
}
function ServerRailScope({
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
}: ServerRailProps) {
  const labels = { ...SERVER_RAIL_DEFAULT_LABELS, ...labelsParciais };
  const chave = storageKey ?? railStorageKey('app');
  const [prefs, salvar] = useRailPreferences(chave);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [destino, setDestino] = useState<number | null>(null);
  const [menuDe, setMenuDe] = useState<string | null>(null);
  const [menuDeAcoes, setMenuDeAcoes] = useState<HTMLElement | null>(null);
  const [menuAdicionar, setMenuAdicionar] = useState<HTMLElement | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const scroll = useRailScroll(listaRef, servers.length);
  const local = hiddenLocal ?? servers.find((server) => server.id === localServerId);
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
      const remotos = visiveis.filter((s) => s.id !== localServerId).map((s) => s.id);
      const novaRemota = moverNaOrdem(remotos, id, direcao);
      let index = 0;
      const nova = visiveis.map((s) => (s.id === localServerId ? s.id : novaRemota[index++]));
      if (novaRemota === remotos) {
        return;
      }
      reordenar(nova);
      anunciar(`Servidor movido para a posição ${nova.indexOf(id) + 1} de ${nova.length}.`);
    },
    [visiveis, reordenar, anunciar, localServerId]
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
      <Stack
        ref={listaRef}
        component="div"
        spacing={0.5}
        onScroll={scroll.measure}
        onDragOver={scroll.dragOver}
        onDragLeave={scroll.stop}
        onDrop={scroll.stop}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', py: 1, px: 0.5, width: '100%', boxShadow: scroll.shadow }}
      >
        {state === 'loading' && <Carregando label={labels.loading} />}
        {state === 'error' && <Erro mensagem={errorMessage ?? labels.errorTitle} retry={labels.retry} onRetry={onRetry} />}
        {state === 'ready' && visiveis.length === 0 && (
          <Vazio
            titulo={labels.emptyTitle}
            descricao={labels.emptyDescription}
            onAdd={
              onAdd === undefined
                ? undefined
                : () => (addOptions.length > 1 ? setMenuAdicionar(listaRef.current) : onAdd(addOptions[0]?.id))
            }
            addLabel={labels.add}
          />
        )}
        {state === 'ready' &&
          visiveis.map((server, indice) => (
            <div
              key={server.id}
              onDragOver={(evento) => {
                if (arrastando === null || server.id === localServerId) return;
                evento.preventDefault();
                setDestino(indice);
              }}
              onDrop={() => {
                if (arrastando !== null && arrastando !== server.id && server.id !== localServerId) {
                  const remotos = visiveis.filter((s) => s.id !== localServerId).map((s) => s.id);
                  const from = remotos.indexOf(arrastando),
                    to = remotos.indexOf(server.id);
                  remotos.splice(from, 1);
                  remotos.splice(to, 0, arrastando);
                  let index = 0;
                  const ids = visiveis.map((s) => (s.id === localServerId ? s.id : remotos[index++]));
                  reordenar(ids);
                  anunciar(`Servidor movido para a posi??o ${ids.indexOf(arrastando) + 1} de ${ids.length}.`);
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
                  scroll.stop();
                  setArrastando(null);
                  setDestino(null);
                }}
                draggable={server.id !== localServerId}
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
              addOptions.length > 1 || (local !== undefined && prefs.localHidden)
                ? setMenuAdicionar(evento.currentTarget)
                : onAdd?.(addOptions[0]?.id)
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
      <ServerRailMenus
        menuAdicionar={menuAdicionar}
        setMenuAdicionar={setMenuAdicionar}
        local={local}
        prefs={prefs}
        onShowLocal={onShowLocal}
        salvar={salvar}
        labels={labels}
        addOptions={addOptions}
        onAdd={onAdd}
        menuDeAcoes={menuDeAcoes}
        menuDe={menuDe}
        setMenuDe={setMenuDe}
        setMenuDeAcoes={setMenuDeAcoes}
        visiveis={visiveis}
        actions={actions}
        localServerId={localServerId}
        mover={mover}
        anunciar={anunciar}
        onAction={onAction}
      />
      <Box ref={anuncio} aria-live="polite" sx={srOnly} />
      <Typography component="span" sx={srOnly}>
        {labels.shortcuts}
      </Typography>
    </Box>
  );
}
