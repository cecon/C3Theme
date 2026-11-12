import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { TickCircle, Warning2 } from 'iconsax-reactjs';

import type { MessageDelivery } from '../core/delivery';
import { useChatText } from './text';

/** Marca de entrega externa com texto acessível; a falha expõe o motivo sem exigir hover. */
export default function DeliveryMark({ delivery }: { delivery: MessageDelivery }) {
  const t = useChatText();
  const failed = delivery.situacao === 'falhou';
  const label = t(`c3.chat.delivery.${delivery.situacao}`);
  return (
    <Stack
      direction="row"
      spacing={0.5}
      role="status"
      sx={{ alignItems: 'center', color: failed ? 'error.main' : 'text.secondary', minWidth: 0, maxWidth: '100%', px: 0.5 }}
    >
      <Box aria-hidden sx={{ display: 'inline-flex', flexShrink: 0, '& svg + svg': { ml: '-5px' } }}>
        {failed ? (
          <Warning2 size={14} variant="Bold" />
        ) : (
          <>
            <TickCircle size={14} variant={delivery.situacao === 'lida' ? 'Bold' : 'Linear'} />
            {delivery.situacao !== 'enviada' && <TickCircle size={14} variant={delivery.situacao === 'lida' ? 'Bold' : 'Linear'} />}
          </>
        )}
      </Box>
      <Typography variant="caption" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        {failed && delivery.motivo ? `${label}: ${delivery.motivo}` : label}
      </Typography>
    </Stack>
  );
}
