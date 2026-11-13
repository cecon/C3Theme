import { useEffect, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Add, ArrowLeft2, ArrowRight2, MessageQuestion, Setting2, Shop } from 'iconsax-reactjs';

import ItemDaPagina from './rails/PageRailItemView';
import { railStorageKey } from './rails/preferences';
import { useRailPreferences } from './rails/useRailPreferences';
import PageRailMenus from './rails/PageRailMenus';
import { pageRailActive } from './rails/pageRailActive';
import type { PageRailItem, PageRailPort } from './rails/types';

export const PAGE_RAIL_WIDTH = 64;
export const PAGE_RAIL_COLLAPSED_WIDTH = 48;

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
  const [prefs, salvar] = useRailPreferences(chave);
  const [maisAncora, setMaisAncora] = useState<HTMLElement | null>(null);
  const [ajudaAncora, setAjudaAncora] = useState<HTMLElement | null>(null);

  useEffect(() => {
    onCollapsedChange?.(prefs.pagesCollapsed);
  }, [prefs.pagesCollapsed, onCollapsedChange]);

  if (hidden) {
    return null;
  }

  const fixadas = new Set([
    ...(pinned ?? prefs.pinnedPages ?? defaultPinned),
    ...pages.filter((page, i) => i === 0 || page.fixed).map((page) => page.id)
  ]);
  const activeId = pageRailActive(pages, activePath);
  const noRail = pages.filter((page) => fixadas.has(page.id));
  const recolhido = prefs.pagesCollapsed;
  const ativaNoMais = activeId !== undefined && !noRail.some((page) => page.id === activeId);

  const alternarFixacao = (page: PageRailItem) => {
    if (page.id === pages[0]?.id || page.fixed === true) {
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
        width: recolhido ? PAGE_RAIL_COLLAPSED_WIDTH : PAGE_RAIL_WIDTH,
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
          <ItemDaPagina key={page.id} page={page} ativa={activeId === page.id} />
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
            aria-label={ativaNoMais ? `Mais páginas (página atual: ${pages.find((p) => p.id === activeId)?.title ?? ''})` : 'Mais páginas'}
            aria-current={ativaNoMais ? 'page' : undefined}
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
      <PageRailMenus
        pages={pages}
        activeId={activeId}
        pinned={fixadas}
        pageAnchor={maisAncora}
        helpAnchor={ajudaAncora}
        help={help}
        onPageClose={() => setMaisAncora(null)}
        onHelpClose={() => setAjudaAncora(null)}
        onToggle={alternarFixacao}
      />
    </Box>
  );
}
