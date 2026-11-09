// material-ui
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Calendar1 } from 'iconsax-reactjs';

import { softColors } from '@c3theme/ui';
import type { Tone } from '../../types';

const DAY = 86_400_000;

/** Dias de hoje até o prazo (`YYYY-MM-DD`), pelo calendário local: negativo é atraso. */
export function daysUntil(due: string, today = new Date()): number {
  const [y, m, d] = due.split('-').map(Number);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(y, m - 1, d).getTime() - start.getTime()) / DAY);
}

/** Cor e dica do prazo: concluído em verde, vencido em vermelho, nos próximos 2 dias em amarelo. */
export function dueLook(days: number, done: boolean): { tone: Tone; hint: string } {
  if (done) return { tone: 'success', hint: 'Concluído' };
  if (days < 0) return { tone: 'danger', hint: 'Atrasado' };
  if (days === 0) return { tone: 'warning', hint: 'Vence hoje' };
  return { tone: days <= 2 ? 'warning' : 'neutral', hint: `Vence em ${days} dia${days > 1 ? 's' : ''}` };
}

/** Prazo no cartão do quadro: "14 nov", com ícone e a cor da `dueLook`. */
export default function DueChip({ due, done, locale }: { due: string; done: boolean; locale: string }) {
  const { tone, hint } = dueLook(daysUntil(due), done);
  const [y, m, d] = due.split('-').map(Number);
  const label = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d)).replace('.', '');
  return (
    <Tooltip title={hint}>
      <Chip
        size="small"
        icon={<Calendar1 size={14} />}
        label={label.replace(/ de /, ' ')}
        sx={(theme) => ({ ...softColors(theme, tone), '& .MuiChip-icon': { color: 'inherit' } })}
      />
    </Tooltip>
  );
}
