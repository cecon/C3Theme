import type { Text, WireRecord } from '../types';

export interface RecordActionsProps {
  entity: string;
  only?: string[];
  ifMatch?: string;
  labels?: Record<string, Text>;
  /** Um registro: as ações dele, no cabeçalho do detalhe. */
  id?: string;
  record?: WireRecord;
  /** Em lote: as linhas marcadas na lista. Aparecem as ações com `bulk` que valem para ao menos uma delas. */
  rows?: WireRecord[];
  /** Depois de rodar em lote, com os ids que falharam (a lista os deixa marcados). */
  onBulkDone?: (failed: string[]) => void;
}
