import type { PageDataState } from './types';

export function emptyData(data: unknown): boolean {
  if (data === null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (data && typeof data === 'object' && 'rows' in data) return emptyData(data.rows);
  if (data && typeof data === 'object' && 'data' in data) return emptyData(data.data);
  return false;
}
/** Zero é dado válido. Só o conjunto inteiro concluído e vazio é um vazio da página. */
export function pageDataState(resources: PageDataState[]): PageDataState {
  return {
    loading: resources.some((r) => r.loading),
    empty: resources.length > 0 && resources.every((r) => !r.loading && !r.error && r.empty),
    error: resources.find((r) => r.error)?.error,
    hasData: resources.some((r) => r.hasData)
  };
}
