import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Checkbox from '@mui/material/Checkbox';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { StatusChip } from '@c3theme/ui';
import { useEngine, useText } from '../../context';
import { displayValue, findOption } from '../../format';
import type { WireRecord } from '../../types';
import { recordTitle } from '../../views';
import RecordImage from '../../widgets/RecordImage';
import RowActionButton from '../../widgets/RowActionButton';
import ImageViewer from './ImageViewer';

interface Selection {
  selected: Set<string>;
  toggleRow: (row: WireRecord) => void;
}

interface Props {
  entity: string;
  rows?: WireRecord[];
  skeletonCards: number;
  selection?: Selection;
  /** Ações de registro em botão no cartão (`rowActions` com `{ action }`). */
  actions: string[];
  /** Sem ele, o cartão vai para a página do registro. */
  onOpen?: (row: WireRecord) => void;
}

/**
 * Lista em cartões (`views.gallery`, #13): a mesma página da lista (busca, filtros, presets, paginação e seleção para
 * o lote ficam na tela de fora), cada registro num cartão com imagem ou avatar, título, linhas e chip.
 */
export default function GalleryGrid({ entity, rows, skeletonCards, selection, actions, onOpen }: Props) {
  const { entities } = useEngine();
  const text = useText();
  const { locale } = useIntl();
  const navigate = useNavigate();
  const { def } = entities[entity];
  const g = def.views?.gallery ?? {};
  const large = g.size === 'large';
  const imageH = large ? 220 : 140;
  const [viewing, setViewing] = useState<number | null>(null);
  const field = (name?: string) => (name ? def.fields.find((f) => f.name === name) : undefined);
  const show = (name: string, row: WireRecord) => {
    const f = field(name);
    return f ? displayValue(f, row[name], locale, (v) => text(findOption(f, v)?.label, v)) : '';
  };
  const open = (row: WireRecord) => (onOpen ? onOpen(row) : navigate(`/${entity}/${row.id}`));
  const cols = large
    ? { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }
    : { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' };
  const images = (rows ?? []).filter((r) => typeof g.image === 'string' && r[g.image]);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: cols, gap: 2, p: 2 }}>
      {!rows && Array.from({ length: skeletonCards }, (_, i) => <Skeleton key={i} variant="rounded" height={imageH + 72} />)}
      {rows?.map((row) => {
        const title = g.title ? show(g.title, row) : recordTitle(def, row);
        const chipField = field(g.chip);
        const chip = g.chip ? show(g.chip, row) : '';
        const tone = chipField?.type === 'enum' ? findOption(chipField, String(row[chipField.name]))?.color : undefined;
        const caption = (g.caption ?? [])
          .map((c) => show(c, row))
          .filter(Boolean)
          .join(' · ');
        const hasImage = g.viewer && typeof g.image === 'string' && Boolean(row[g.image]);
        return (
          <Card key={row.id} variant="outlined" sx={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {selection && (
              <Checkbox
                size="small"
                checked={selection.selected.has(row.id!)}
                onChange={() => selection.toggleRow(row)}
                slotProps={{ input: { 'aria-label': `Marcar ${title}` } }}
                sx={{ position: 'absolute', top: 4, left: 4, zIndex: 1, bgcolor: 'background.paper', borderRadius: 1, p: 0.25 }}
              />
            )}
            {hasImage && (
              <CardActionArea onClick={() => setViewing(images.indexOf(row))} aria-label={`Ver imagem de ${title}`}>
                <RecordImage def={def} record={row} image={g.image} size={imageH} square />
              </CardActionArea>
            )}
            <CardActionArea onClick={() => open(row)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
              {!hasImage && <RecordImage def={def} record={row} image={g.image} size={imageH} square />}
              <Stack spacing={0.5} sx={{ p: 1.5, pb: chip || actions.length ? 0.5 : 1.5, flex: 1 }}>
                <Typography variant={large ? 'subtitle1' : 'subtitle2'} sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {title}
                </Typography>
                {g.subtitle && show(g.subtitle, row) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {show(g.subtitle, row)}
                  </Typography>
                )}
                {caption && (
                  <Typography variant="caption" color="text.secondary">
                    {caption}
                  </Typography>
                )}
              </Stack>
            </CardActionArea>
            {(chip || actions.length > 0) && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 1.5, pb: 1.5, flexWrap: 'wrap' }}>
                {chip && <StatusChip tone={tone} label={chip} />}
                <Box sx={{ flex: 1 }} />
                {actions.map((a) => (
                  <RowActionButton key={a} entity={entity} row={row} action={a} />
                ))}
              </Stack>
            )}
          </Card>
        );
      })}
      {viewing !== null && typeof g.image === 'string' && (
        <ImageViewer
          items={images.map((r) => ({ src: String(r[g.image as string]), title: recordTitle(def, r) }))}
          index={viewing}
          onIndex={setViewing}
          onClose={() => setViewing(null)}
          onOpen={(i) => open(images[i])}
        />
      )}
    </Box>
  );
}
