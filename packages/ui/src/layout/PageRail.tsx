import { useCallback, useEffect, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Add, ArrowLeft2, ArrowRight2, Bookmark, Bookmark2, MessageQuestion, Setting2, Shop } from 'iconsax-reactjs';
import { Link as RouterLink } from 'react-router';

import ItemDaPagina from './rails/PageRailItemView';
import { railStorageKey, readRailPreferences, writeRailPreferences } from './rails/preferences';
import type { PageRailItem, PageRailPort } from './rails/types';

export const PAGE_RAIL_WIDTH = 64;
export const PAGE_RAIL_COLLAPSED_WIDTH = 0;

export interface PageRailProps extends PageRailPort {
  /** Páginas fixadas pela declaração, quando a pessoa ainda não escolheu. */
  readonly defaultPinned?: readonly string[];
  /** Ajuda aberta pelo botão; sem versão, o botão não aparece. */
  readonly storageKey?: string;
  readonly onTogglePin?: (pageId: string, pinned: boolean) => void;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
  readonly onHelpOpen?: () => void;
  readonly onUsageClick?: () => void;
  readonly onMarketplaceClick?: () => void;
  readonly onSettingsClick?: () => void;
  readonly settingsBadge?: boolean;
  readonly usage?: readonly { readonly id: string; readonly label: string; readonly value: string }[];
}

/**
 * Rail de páginas (#117): coluna de ícones com a marca no topo, as páginas fixadas, o menu do botão
 * de mais (com fixar/desafixar), os blocos opcionais e a ajuda com versão e links. Fixação e
 * recolhimento ficam guardados localmente. Comportamento próprio desta casa; nada copiado da
 * referência.
 */
export default function PageRail({
  pages,
  activePath,
  pinned,
  defaultPinned = [],
  blocks = [],
  help,
  brand,
  hideBrand = false,
  hidden = false,
  storageKey,
  onTogglePin,
  onCollapsedChange,
  onHelpOpen,
  onUsageClick,
  onMarketplaceClick,
  onSettingsClick,
  settingsBadge = false,
  usage = []
}: PageRailProps) {
  const chave = storageKey ?? railStorageKey('app');
  const [prefs, setPrefs] = useState(() => readRailPreferences(globalThis.localStorage, chave));
  const [maisAncora, setMaisAncora] = useState<HTMLElement | null>(null);
  const [ajudaAncora, setAjudaAncora] = useState<HTMLElement | null>(null);

  const salvar = useCallback(
    (mudanca: Partial<typeof prefs>) => {
      const proximo = { ...prefs, ...mudanca };
      setPrefs(proximo);
      writeRailPreferences(globalThis.localStorage, chave, proximo);
    },
    [chave, prefs]
  );

  useEffect(() => {
    onCollapsedChange?.(prefs.pagesCollapsed);
  }, [prefs.pagesCollapsed, onCollapsedChange]);

  if (hidden) {
    return null;
  }

  const fixadas = new Set([...(prefs.pinnedPages ?? pinned ?? defaultPinned), ...(pages[0]?.fixed === true ? [pages[0].id] : [])]);
  const noRail = pages.filter((page) => fixadas.has(page.id));
  const recolhido = prefs.pagesCollapsed;
  const ativaNoMais = activePath !== undefined && !noRail.some((page) => page.url === activePath);

  const alternarFixacao = (page: PageRailItem) => {
    if (page.fixed === true) {
      return;
    }
    const proximas = new Set(fixadas);
    if (proximas.has(page.id)) {
      proximas.delete(page.id);
    } else {
      proximas.add(page.id);
    }
    salvar({ pinnedPages: [...proximas] });
    onTogglePin?.(page.id, proximas.has(page.id));
  };

  return (
    <Box
      component="nav"
      aria-label="Páginas"
      sx={{
        width: recolhido ? 16 : PAGE_RAIL_WIDTH,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: recolhido ? 0 : 1,
        borderColor: 'divider',
        transition: 'width .18s ease',
        overflow: 'hidden'
      }}
    >
      {!hideBrand && brand !== undefined && (
        <Box sx={{ py: 1 }}>
          <Tooltip title={brand.label} enterDelay={400} placement="right">
            {brand.href === undefined ? (
              <Box
                aria-label={brand.label}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800
                }}
              >
                {brand.label.trim().charAt(0).toUpperCase()}
              </Box>
            ) : (
              <IconButton component="a" href={brand.href} target="_blank" rel="noreferrer" aria-label={brand.label}>
                <Box sx={{ width: 24, height: 24, borderRadius: 1.5, bgcolor: 'primary.main' }} />
              </IconButton>
            )}
          </Tooltip>
        </Box>
      )}
      <Stack component="div" spacing={0.5} sx={{ flex: 1, py: 1, overflowY: 'auto', width: '100%', alignItems: 'center' }}>
        {noRail.map((page) => (
          <ItemDaPagina key={page.id} page={page} ativa={activePath === page.url} />
        ))}
        {blocks.map((block) => (
          <Tooltip key={block.id} title={block.label} enterDelay={400} placement="right">
            <IconButton aria-label={block.label} onClick={block.onClick} size="small">
              {block.icon !== undefined ? <block.icon size={20} /> : <Setting2 size={20} />}
              {block.badge}
            </IconButton>
          </Tooltip>
        ))}
        {usage.length > 0 && (
          <Stack spacing={0.5} sx={{ px: 1, width: '100%' }} aria-label="Uso dos provedores">
            {usage.map((item) => (
              <Tooltip key={item.id} title={`${item.label}: ${item.value}`} enterDelay={400} placement="right">
                <Typography
                  component="button"
                  onClick={onUsageClick}
                  variant="caption"
                  sx={{ background: 'none', border: 0, cursor: 'pointer', color: 'text.secondary', fontSize: 9 }}
                >
                  {item.value}
                </Typography>
              </Tooltip>
            ))}
          </Stack>
        )}
        {onMarketplaceClick !== undefined && (
          <Tooltip title="Marketplace" enterDelay={400} placement="right">
            <IconButton aria-label="Marketplace" onClick={onMarketplaceClick} size="small">
              <Shop size={20} />
            </IconButton>
          </Tooltip>
        )}
        {onSettingsClick !== undefined && (
          <Tooltip title="Configurações" enterDelay={400} placement="right">
            <IconButton aria-label="Configurações" onClick={onSettingsClick} size="small" sx={{ position: 'relative' }}>
              <Setting2 size={20} />
              {settingsBadge && (
                <Box
                  aria-hidden
                  sx={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', bgcolor: 'info.main' }}
                />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Divider sx={{ width: '55%' }} />
      <Stack spacing={0.5} sx={{ py: 1, alignItems: 'center' }}>
        <Tooltip title="Mais páginas" enterDelay={400} placement="right">
          <IconButton
            aria-label={
              ativaNoMais ? `Mais páginas (página atual: ${pages.find((p) => p.url === activePath)?.title ?? ''})` : 'Mais páginas'
            }
            onClick={(evento) => setMaisAncora(evento.currentTarget)}
            size="small"
            sx={{ position: 'relative' }}
          >
            {ativaNoMais ? <Add size={20} variant="Bulk" /> : <Add size={20} />}
            {ativaNoMais && (
              <Box
                aria-hidden
                sx={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }}
              />
            )}
          </IconButton>
        </Tooltip>
        {help !== undefined && (
          <Tooltip title="Ajuda e versão" enterDelay={400} placement="right">
            <IconButton
              aria-label={`Ajuda e versão ${help.version}`}
              onClick={(evento) => {
                setAjudaAncora(evento.currentTarget);
                onHelpOpen?.();
              }}
              size="small"
            >
              <MessageQuestion size={20} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={recolhido ? 'Expandir o rail' : 'Recolher o rail'} enterDelay={400} placement="right">
          <IconButton
            aria-label={recolhido ? 'Expandir o rail' : 'Recolher o rail'}
            onClick={() => salvar({ pagesCollapsed: !recolhido })}
            size="small"
          >
            {recolhido ? <ArrowRight2 size={18} /> : <ArrowLeft2 size={18} />}
          </IconButton>
        </Tooltip>
      </Stack>
      <Menu anchorEl={maisAncora} open={maisAncora !== null} onClose={() => setMaisAncora(null)} transitionDuration={0}>
        {pages.map((page) => (
          <MenuItem
            key={page.id}
            selected={activePath === page.url}
            onClick={() => setMaisAncora(null)}
            component={RouterLink}
            to={page.url}
            sx={{ gap: 1 }}
          >
            {page.icon !== undefined ? <page.icon size={18} /> : <Box sx={{ width: 18 }} />}
            <Typography variant="inherit" sx={{ flex: 1 }}>
              {page.title}
            </Typography>
            {page.fixed !== true && (
              <IconButton
                component="span"
                size="small"
                aria-label={fixadas.has(page.id) ? `Desafixar ${page.title}` : `Fixar ${page.title} no rail`}
                onClick={(evento) => {
                  evento.preventDefault();
                  evento.stopPropagation();
                  alternarFixacao(page);
                }}
              >
                {fixadas.has(page.id) ? <Bookmark2 size={16} /> : <Bookmark size={16} />}
              </IconButton>
            )}
          </MenuItem>
        ))}
      </Menu>
      <Menu anchorEl={ajudaAncora} open={ajudaAncora !== null} onClose={() => setAjudaAncora(null)} transitionDuration={0}>
        <Box sx={{ px: 2, py: 1, minWidth: 260 }}>
          <Typography variant="subtitle2">{`Versão ${help?.version ?? ''}`}</Typography>
          {help?.loadingNotes === true ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Carregando notas…
            </Typography>
          ) : help?.releaseNotes !== undefined && help.releaseNotes !== null ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
              {help.releaseNotes}
            </Typography>
          ) : null}
        </Box>
        <Divider />
        {(help?.links ?? []).map((link) => (
          <MenuItem key={link.href} component="a" href={link.href} target="_blank" rel="noreferrer" onClick={() => setAjudaAncora(null)}>
            {link.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
