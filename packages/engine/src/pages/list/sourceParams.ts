import type { EntityDef, WireRecord } from '../../types';

/** Prefixo dos parâmetros da consulta na URL da tela e da API. */
export const PARAM_PREFIX = 'p.';

/** Valor trafegado como texto de URL: reference lido (`{ id, title }`) vira o id; vazio vira ''. */
export function paramText(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'id' in v) return String((v as { id: unknown }).id ?? '');
  return String(v);
}

/**
 * Parâmetros aplicados de uma consulta do sistema: os da URL (`p.<nome>`), ou, sem nenhum na URL, os defaults
 * que o `/_meta` mandou já resolvidos. `undefined` para entidade comum.
 */
export function readSourceParams(def: EntityDef, params: URLSearchParams): Record<string, string> | undefined {
  if (def.source !== 'system') return undefined;
  const names = (def.params?.fields ?? []).map((f) => f.name);
  const fromUrl = names.filter((n) => params.has(PARAM_PREFIX + n));
  if (fromUrl.length > 0) return Object.fromEntries(fromUrl.map((n) => [n, params.get(PARAM_PREFIX + n) ?? '']));
  const defaults: WireRecord = def.paramDefaults ?? {};
  return Object.fromEntries(names.filter((n) => defaults[n] != null).map((n) => [n, paramText(defaults[n])]));
}

/** Mudanças de URL para aplicar `draft`: todos os parâmetros vão, vazios também (para não voltar ao default). */
export function paramChanges(def: EntityDef, draft: WireRecord): Record<string, string> {
  return Object.fromEntries((def.params?.fields ?? []).map((f) => [PARAM_PREFIX + f.name, paramText(draft[f.name])]));
}
