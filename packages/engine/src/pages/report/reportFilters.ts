// O que filtra o relatório, em texto, para o cabeçalho impresso: preset, filtros da barra, busca, parâmetros da
// consulta e filiais. Quem lê o papel precisa saber de onde vieram os números.

import { displayValue, findOption } from '../../format';
import type { EntityDef, Text } from '../../types';

export function reportFilters(
  def: EntityDef,
  params: URLSearchParams,
  presetId: string | undefined,
  sourceParams: Record<string, string> | undefined,
  branches: string[],
  locale: string,
  text: (t: Text | undefined, fallback?: string) => string
): string[] {
  const out: string[] = [];
  const preset = def.views?.list?.presets?.find((p) => p.id === presetId);
  if (preset) out.push(text(preset.label));
  const show = (name: string, raw: string, fields = def.fields) => {
    const f = fields.find((x) => x.name === name);
    if (!f || raw === '') return;
    // reference na URL é só o id: o título não está à mão sem ler o registro
    const value = f.type === 'reference' ? `nº ${raw}` : displayValue(f, raw, locale, (v) => text(findOption(f, v)?.label, v));
    out.push(`${text(f.label, f.name)}: ${value}`);
  };
  for (const [k, v] of params) {
    if (k.startsWith('f.')) show(k.slice(2), v);
  }
  // parâmetros aplicados, inclusive os defaults que não estão na URL
  for (const [k, v] of Object.entries(sourceParams ?? {})) show(k, v, def.params?.fields ?? []);
  const q = params.get('q');
  if (q) out.push(`Busca: “${q}”`);
  if (params.has('w')) out.push('Recorte do painel');
  if (branches.length) out.push(`${branches.length === 1 ? 'Filial' : 'Filiais'}: ${branches.join(', ')}`);
  return out;
}
