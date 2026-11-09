// Cartão salvo com ações de principal e remover.
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Card } from 'iconsax-reactjs';
import { StatusChip } from '@c3theme/ui';
import { SavedCard } from '../data';

export function CardTile({ card, onPrimary, onRemove }: { card: SavedCard; onPrimary: () => void; onRemove: () => void }) {
  return (
    <Box
      sx={(theme) => ({
        border: 1,
        borderColor: card.primary ? 'primary.main' : 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: card.primary ? `0 0 0 1px ${theme.vars.palette.primary.main}` : 'none'
      })}
    >
      {/* frente do cartão, nas cores do tema */}
      <Box
        sx={(theme) => ({
          p: 2.5,
          color: 'primary.contrastText',
          background: `linear-gradient(135deg, ${theme.vars.palette.primary.main}, ${theme.vars.palette.primary.dark})`,
          ...(card.brand === 'Elo' && {
            background: `linear-gradient(135deg, ${theme.vars.palette.secondary.main}, ${theme.vars.palette.secondary.dark})`,
            color: theme.vars.palette.secondary.contrastText
          })
        })}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Card size={24} variant="Bulk" />
          <Typography variant="subtitle1" sx={{ fontStyle: 'italic', fontWeight: 700 }}>
            {card.brand}
          </Typography>
        </Stack>
        <Typography sx={{ mt: 3, fontSize: '1.125rem', letterSpacing: '0.18em', fontWeight: 500 }}>•••• •••• •••• {card.last4}</Typography>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1.5 }}>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {card.holder}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {card.expiry}
          </Typography>
        </Stack>
      </Box>
      <Stack direction="row" sx={{ px: 1.5, py: 1, alignItems: 'center', gap: 1, mt: 'auto' }}>
        {card.primary ? (
          <StatusChip label="Principal" tone="primary" />
        ) : (
          <Button size="small" onClick={onPrimary}>
            Tornar principal
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button size="small" color="error" onClick={onRemove} aria-label={`Remover cartão final ${card.last4}`}>
          Remover
        </Button>
      </Stack>
    </Box>
  );
}
