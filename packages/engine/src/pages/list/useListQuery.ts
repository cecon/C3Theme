import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import type { OrgState } from '../../context';
import type { Condition, EntityDef } from '../../types';
import { readDateRange, readFilters, readWidgetWhere } from './readFilters';
import { readSourceParams } from './sourceParams';
import { withPreset } from '../../presetTabs';

/**
 * Estado da lista na URL (página, tamanho, ordem, busca, preset, filtros, filiais e parâmetros da consulta): voltar e compartilhar
 * funcionam. `scoped` é a organização quando a entidade tem escopo; sem ela, não há filtro de filiais.
 */
export function useListQuery(def: EntityDef, scoped: OrgState | undefined) {
  const [params, setParams] = useSearchParams();
  const list = def.views?.list ?? {};

  const defaultPreset = list.presets?.find((p) => p.default)?.id;
  const presetId = params.has('preset') ? params.get('preset') || undefined : defaultPreset;
  const preset = list.presets?.find((p) => p.id === presetId);
  const page = Number(params.get('page') ?? 1);
  const pageSize = Number(params.get('pageSize') ?? list.pageSize ?? 25);
  const defaultSort = (list.defaultSort ?? []).map((s) => (s.direction === 'desc' ? '-' : '') + s.field).join(',');
  const sort = params.get('sort') ?? defaultSort;
  const q = params.get('q') ?? '';
  const branchesParam = scoped ? (params.get('branches') ?? '') : '';
  const shownBranches = scoped ? (branchesParam ? branchesParam.split(',') : [scoped.active]) : [];
  const filters = useMemo(() => readFilters(params, def.fields), [params, def.fields]);
  const widgetWhere = useMemo(() => readWidgetWhere(params), [params]);
  const range = useMemo(() => readDateRange(params, list.dateRange?.field), [params, list.dateRange?.field]);
  const sourceParams = useMemo(() => readSourceParams(def, params), [def, params]);

  const set = (changes: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === undefined) next.delete(k);
      else next.set(k, v);
    }
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  // busca com atraso: não dispara uma requisição por tecla
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    const t = setTimeout(() => search !== q && set({ q: search || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // sem o preset: as abas de preset contam cada uma sobre os mesmos filtros
  const baseParts = useMemo(() => [...filters, ...range, ...(widgetWhere ? [widgetWhere] : [])], [filters, range, widgetWhere]);
  const where = useMemo(() => joinAnd(withPreset(preset, baseParts)), [preset, baseParts]);

  const refreshSeconds = list.refreshSeconds;
  return {
    params,
    set,
    presetId,
    page,
    pageSize,
    sort,
    q,
    search,
    setSearch,
    branchesParam,
    shownBranches,
    where,
    baseParts,
    sourceParams,
    refreshSeconds
  };
}

export type ListQuery = ReturnType<typeof useListQuery>;

/** Uma condição, várias com `and`, ou nenhuma. */
export const joinAnd = (parts: Condition[]): Condition | undefined =>
  parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : { and: parts };
