import { useId, useState, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

// third-party
import { CloseCircle } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import { actionsFor, isInstalled, type CatalogActionsProp, type CatalogItem } from './catalog';
import { CatalogDescription, CatalogInstalls, CatalogNotices, CatalogVersions } from './CatalogDetailSections';
import { CatalogIcon, CatalogPrimaryButton, CatalogProgress, CatalogStatusChip, useByline } from './CatalogParts';
import { useCatalogText } from './catalogText';

export interface CatalogDetailProps {
  /** Item aberto; `null` fecha o diálogo. */
  item: CatalogItem | null;
  onClose: () => void;
  /** Callbacks para todos os tipos, ou um objeto por tipo (`{ agent: {...}, skill: {...}, app: {...} }`). */
  actions?: CatalogActionsProp;
  /**
   * Desenha a descrição em Markdown. O @c3theme/ui não traz parser; o `Markdown` do @c3theme/chat serve:
   * `renderMarkdown={(md) => <Markdown text={md} />}`. Sem ele, a descrição sai em parágrafos de texto.
   */
  renderMarkdown?: (markdown: string) => ReactNode;
}

function Body({ item, actions, onClose, renderMarkdown, titleId }: CatalogDetailProps & { item: CatalogItem; titleId: string }) {
  const t = useCatalogText();
  const ui = useUiText();
  const byline = useByline(item);
  const own = actionsFor(actions, item.kind);
  const onRemove = isInstalled(item.status) ? own.onRemove : undefined;
  return (
    <>
      <DialogTitle id={`${titleId}-head`} component="div" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pr: 1.5 }}>
        <CatalogIcon item={item} size="lg" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id={titleId} variant="h5" component="h2">
            {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {byline}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
            <Chip size="small" variant="outlined" label={t(`c3.catalog.kind.one.${item.kind}`)} />
            {item.category && <Chip size="small" variant="outlined" label={item.category} />}
            <Box role="status">
              <CatalogStatusChip item={item} />
            </Box>
          </Stack>
        </Box>
        <IconButton onClick={onClose} aria-label={ui('c3.close')} size="small">
          <CloseCircle size={20} />
        </IconButton>
      </DialogTitle>
      {/* foco no corpo: quem usa teclado consegue rolar a descrição longa */}
      <DialogContent dividers tabIndex={0}>
        <Stack spacing={2.5}>
          <CatalogProgress item={item} />
          <CatalogNotices item={item} />
          <Typography variant="body1">{item.summary}</Typography>
          <CatalogDescription text={item.description} renderMarkdown={renderMarkdown} />
          <CatalogInstalls item={item} />
          <CatalogVersions item={item} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {onRemove && (
          <Button color="error" onClick={() => onRemove(item)} sx={{ mr: 'auto' }}>
            {t('c3.catalog.remove')}
          </Button>
        )}
        <CatalogPrimaryButton item={item} actions={own} size="medium" />
      </DialogActions>
    </>
  );
}

/**
 * Detalhe de um item do catálogo em diálogo: descrição em Markdown, o que instala (arquivos e permissões), histórico
 * de versões e o aviso dos arquivos editados à mão. No celular ocupa a tela toda.
 */
export default function CatalogDetail(props: CatalogDetailProps) {
  const { item, onClose } = props;
  const titleId = useId();
  // guarda o último item para o conteúdo não sumir durante a animação de fechar
  const [shown, setShown] = useState(item);
  if (item && item !== shown) setShown(item);
  const small = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  return (
    <Dialog open={item !== null} onClose={onClose} fullWidth maxWidth="md" fullScreen={small} scroll="paper" aria-labelledby={titleId}>
      {shown && <Body {...props} item={shown} titleId={titleId} />}
    </Dialog>
  );
}
