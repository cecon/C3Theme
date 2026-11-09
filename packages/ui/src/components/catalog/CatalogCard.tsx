// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

import { actionsFor, type CatalogActionsProp, type CatalogItem } from './catalog';
import { CatalogIcon, CatalogPrimaryButton, CatalogProgress, CatalogStatusChip, useByline } from './CatalogParts';
import { useCatalogText } from './catalogText';

export interface CatalogCardProps {
  item: CatalogItem;
  /** Callbacks para todos os tipos, ou um objeto por tipo (`{ agent: {...}, skill: {...}, app: {...} }`). */
  actions?: CatalogActionsProp;
  /** Abre o detalhe (o app mostra o `CatalogDetail`). Sem ele, não há botão "Detalhes". */
  onSelect?: (item: CatalogItem) => void;
  /** Nível do título do cartão; na grade agrupada desce um nível por causa do título da categoria. */
  headingLevel?: 'h2' | 'h3' | 'h4';
  sx?: SxProps<Theme>;
}

/** Cartão de um item do catálogo: ícone, nome, autor e versão, resumo, estado e a ação que o estado pede. */
export default function CatalogCard({ item, actions, onSelect, headingLevel = 'h3', sx }: CatalogCardProps) {
  const t = useCatalogText();
  const byline = useByline(item);
  const { status } = item;
  return (
    <Paper
      component="article"
      variant="outlined"
      aria-label={item.name}
      sx={[
        (theme) => ({
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          borderRadius: `${Number(theme.shape.borderRadius) * 2}px`
        }),
        status.state === 'error' && { borderColor: 'error.main' },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
        <CatalogIcon item={item} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" component={headingLevel} noWrap title={item.name}>
            {item.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p" noWrap>
            {byline}
          </Typography>
        </Box>
      </Stack>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2lh' }}
      >
        {item.summary}
      </Typography>
      {/* estado anunciado quando muda (instalou, falhou); a barra só aparece instalando */}
      <Box role="status" sx={{ minHeight: 24, display: 'flex', flexDirection: 'column', gap: 0.75, justifyContent: 'center' }}>
        <Box>
          <CatalogStatusChip item={item} />
        </Box>
        {status.state === 'error' && status.message && (
          <Typography variant="caption" color="error" component="p">
            {status.message}
          </Typography>
        )}
      </Box>
      <CatalogProgress item={item} />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 'auto' }}>
        {onSelect && (
          <Button size="small" color="inherit" onClick={() => onSelect(item)} aria-label={t('c3.catalog.detailsOf', { name: item.name })}>
            {t('c3.catalog.details')}
          </Button>
        )}
        <CatalogPrimaryButton item={item} actions={actionsFor(actions, item.kind)} />
      </Stack>
    </Paper>
  );
}
