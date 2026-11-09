import type { StatusTone } from '@c3theme/ui';

import { KanbanData } from '../data';

/** Tom da situação: concluído verde, primeira coluna neutra, as demais azuis. */
export function columnTone(data: KanbanData, columnId: string): StatusTone {
  if (columnId === data.doneColumnId) return 'success';
  return data.columnOrder.indexOf(columnId) <= 0 ? 'neutral' : 'info';
}
