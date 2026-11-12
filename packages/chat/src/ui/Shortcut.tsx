// material-ui
import Box from '@mui/material/Box';

const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Atalho "Ctrl ⏎" (no Mac, "⌘ ⏎") desenhado como teclas, para ir dentro de um botão. */
export default function Shortcut() {
  const key = {
    px: 0.5,
    minWidth: 18,
    borderRadius: 0.75,
    border: 1,
    // só a borda esmaece; o texto da tecla fica com o contraste do botão
    borderColor: 'color-mix(in srgb, currentColor 55%, transparent)',
    lineHeight: 1.4
  };
  return (
    <Box component="span" aria-hidden sx={{ display: 'inline-flex', gap: 0.25, ml: 1, fontSize: 11, fontWeight: 500 }}>
      <Box component="kbd" sx={{ ...key, fontFamily: 'inherit' }}>
        {mac ? '⌘' : 'Ctrl'}
      </Box>
      <Box component="kbd" sx={{ ...key, fontFamily: 'inherit' }}>
        ⏎
      </Box>
    </Box>
  );
}

/** Ctrl+Enter (ou ⌘+Enter no Mac). */
export const isSubmitShortcut = (e: { key: string; ctrlKey: boolean; metaKey: boolean }) => e.key === 'Enter' && (e.ctrlKey || e.metaKey);

/** Nome do atalho para o leitor de tela (`aria-keyshortcuts`). */
export const SUBMIT_KEYS = mac ? 'Meta+Enter' : 'Control+Enter';

/** Nome do atalho escrito para gente ("Ctrl+Enter", no Mac "⌘+Enter"). */
export const SUBMIT_LABEL = mac ? '⌘+Enter' : 'Ctrl+Enter';
