import { useId, useState } from 'react';
import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { MessageQuestion } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';

/**
 * Interrogação do campo: abre a ajuda longa num balão. Abre no clique (toque não tem hover) e fecha no clique fora,
 * no Esc ou num segundo clique; o leitor de tela lê o texto pelo `aria-describedby` enquanto está aberto.
 */
export function HintButton({ hint }: { hint: ReactNode }) {
  const t = useUiText();
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <span>
        <Tooltip
          title={<span id={id}>{hint}</span>}
          open={open}
          onClose={() => setOpen(false)}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          arrow
        >
          <IconButton
            size="small"
            aria-label={t('c3.field.hint')}
            aria-expanded={open}
            aria-describedby={open ? id : undefined}
            onClick={(e) => {
              // dentro de um <label>, o clique não deve ir para o campo
              e.preventDefault();
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            sx={{ color: 'text.secondary', p: 0.75, my: -1 }}
          >
            <MessageQuestion size={16} />
          </IconButton>
        </Tooltip>
      </span>
    </ClickAwayListener>
  );
}

/**
 * Rótulo com a interrogação ao lado. Fica no rótulo, e não dentro da caixa, para não disputar o fim do campo com
 * sufixo, seta do select, olho da senha ou outros botões; o clique nela não leva o foco para o campo.
 */
export function withHint(label: ReactNode, hint: ReactNode | undefined) {
  if (!hint) return label;
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, pointerEvents: 'auto' }}>
      {label}
      <HintButton hint={hint} />
    </Box>
  );
}
