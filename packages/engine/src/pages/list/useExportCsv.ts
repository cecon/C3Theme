import { useState } from 'react';
import { useIntl } from 'react-intl';

import { notify } from '@c3theme/ui';
import { useEngine, useText } from '../../context';
import { download, EXPORT_LIMIT, fetchAll, toCsv } from '../../export';
import type { FieldDef } from '../../types';
import type { ListQuery } from './useListQuery';
import type { ListTotals } from './useListTotals';

/**
 * Exporta o que a tela mostra: mesmas colunas (inclusive a da filial dona), filtros, busca e ordem, todas as
 * páginas, até `EXPORT_LIMIT` linhas. Os totais da tela (sobre todo o filtro) saem na última linha.
 */
export function useExportCsv(
  entity: string,
  query: ListQuery,
  fields: FieldDef[],
  optionLabel: (f: FieldDef) => (v: string) => string,
  totals?: ListTotals
) {
  const { client } = useEngine();
  const text = useText();
  const intl = useIntl();
  const [exporting, setExporting] = useState(false);
  const { sort, q, where, branchesParam, shownBranches, sourceParams } = query;

  async function exportCsv() {
    setExporting(true);
    try {
      const { rows, total } = await fetchAll(client, entity, {
        sort: sort || undefined,
        q: q || undefined,
        where,
        branches: branchesParam ? shownBranches : undefined,
        params: sourceParams
      });
      const csv = toCsv(
        fields,
        rows,
        intl.locale,
        (f) => text(f.label, f.name),
        (f, v) => optionLabel(f)(v),
        totals
      );
      download(`${entity}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      if (total > rows.length) {
        const message = `Exportadas as primeiras ${EXPORT_LIMIT.toLocaleString(intl.locale)} de ${total.toLocaleString(intl.locale)} linhas. Filtre para exportar o resto.`;
        notify(message, 'warning');
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Erro ao exportar.', 'error');
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportCsv };
}
