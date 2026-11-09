// Título de seção da página pública.
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function SectionTitle({ overline, title, text }: { overline: string; title: string; text?: string }) {
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: { xs: 4, md: 6 } }}>
      <Typography variant="overline" color="primary.main">
        {overline}
      </Typography>
      <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
        {title}
      </Typography>
      {text && (
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          {text}
        </Typography>
      )}
    </Box>
  );
}
