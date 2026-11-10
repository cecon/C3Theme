// Bloco de JSON da página `apiDocs`: monoespaçado, com rolagem, nas cores do tema (claro e escuro).
import Box from '@mui/material/Box';

export function JsonBlock({ value, text }: { value?: unknown; text?: string }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1.5,
        maxHeight: 320,
        overflow: 'auto',
        borderRadius: 1,
        fontSize: 12,
        fontFamily: 'monospace',
        bgcolor: 'action.hover',
        color: 'text.primary'
      }}
    >
      {text ?? JSON.stringify(value, null, 2)}
    </Box>
  );
}
