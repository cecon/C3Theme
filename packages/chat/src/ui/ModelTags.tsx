// material-ui
import Box from '@mui/material/Box';

import { softColors } from '@c3theme/ui';

import { FLAG_TONE, type ModelFlag, type ModelTag } from '../core/models';
import { useChatText } from './text';

export interface ModelTagsProps {
  flags?: ModelFlag[];
  tags?: ModelTag[];
}

/** Etiquetas do modelo ("Grátis", "Local", "Precisa entrar" e as livres), com fundo suave no tom. */
export default function ModelTags({ flags, tags }: ModelTagsProps) {
  const t = useChatText();
  const all: ModelTag[] = [...(flags ?? []).map((f) => ({ label: t(`c3.chat.flag.${f}`), tone: FLAG_TONE[f] })), ...(tags ?? [])];
  if (!all.length) return null;
  return (
    <Box component="span" sx={{ display: 'inline-flex', flexWrap: 'wrap', gap: 0.5 }}>
      {all.map((tag) => (
        <Box
          component="span"
          key={tag.label}
          sx={(theme) => ({
            ...softColors(theme, tag.tone ?? 'neutral'),
            px: 0.75,
            borderRadius: 1,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: '18px',
            whiteSpace: 'nowrap'
          })}
        >
          {tag.label}
        </Box>
      ))}
    </Box>
  );
}
