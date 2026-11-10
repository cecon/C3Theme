// Exportação de lista para CSV e download de arquivo. Não sabe nada de React.

import type { C3Client, ListParams } from './api';
import { notify } from '@c3theme/ui';
import { displayValue } from './format';
import type { FieldDef, WireRecord } from './types';

/** Maior página que o contrato aceita (openapi: pageSize). */
const PAGE = 100;
/** Acima disso a exportação para: CSV pelo navegador não é ferramenta de extração em massa. */
export const EXPORT_LIMIT = 10_000;

/** Busca todas as páginas da lista com os mesmos filtros e ordem da tela. */
export async function fetchAll(client: C3Client, entity: string, params: Omit<ListParams, 'page' | 'pageSize'>) {
  const rows: WireRecord[] = [];
  let total: number;
  for (let page = 1; ; page++) {
    const r = await client.list(entity, { ...params, page, pageSize: PAGE });
    total = r.meta.total;
    rows.push(...r.data);
    if (r.data.length < PAGE || rows.length >= Math.min(total, EXPORT_LIMIT)) break;
  }
  return { rows: rows.slice(0, EXPORT_LIMIT), total };
}

/**
 * CSV que o Excel abre direto: BOM para o UTF-8, e `;` como separador quando o idioma usa vírgula decimal
 * (pt-BR). Número sai sem separador de milhar, para continuar sendo número na planilha. `totals` vira a última
 * linha, com "Total" na primeira coluna que não é total.
 */
export function toCsv(
  fields: FieldDef[],
  rows: WireRecord[],
  locale: string,
  label: (f: FieldDef) => string,
  optionLabel: (f: FieldDef, v: string) => string,
  totals?: Record<string, number | string | null>,
  /** Linha "Saldo anterior" logo depois do cabeçalho (`views.list.opening`). */
  opening?: { field: string; value: number | string; label: string }
) {
  const decimal = (1.1).toLocaleString(locale).charAt(1);
  const sep = decimal === ',' ? ';' : ',';
  const cell = (s: string) => (/[";\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const value = (f: FieldDef, v: unknown) => {
    if (v === null || v === undefined) return '';
    if (f.type === 'decimal' || f.type === 'integer') return String(v).replace('.', decimal);
    // "21/10/2026 06:06": sem a vírgula do formato curto, o Excel reconhece como data e hora
    if (f.type === 'datetime') {
      const d = new Date(String(v));
      return `${d.toLocaleDateString(locale)} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    }
    return displayValue(f, v, locale, (x) => optionLabel(f, x));
  };
  const lines = [fields.map((f) => cell(label(f))).join(sep), ...rows.map((r) => fields.map((f) => cell(value(f, r[f.name]))).join(sep))];
  if (opening) {
    const labelAt = fields.find((f) => f.name !== opening.field)?.name;
    const line = fields.map((f) =>
      f.name === opening.field ? cell(value(f, opening.value)) : f.name === labelAt ? cell(opening.label) : ''
    );
    lines.splice(1, 0, line.join(sep));
  }
  if (totals && Object.keys(totals).length > 0) {
    const labelAt = fields.find((f) => totals[f.name] === undefined)?.name;
    lines.push(fields.map((f) => (f.name in totals ? cell(value(f, totals[f.name])) : f.name === labelAt ? 'Total' : '')).join(sep));
  }
  return '\uFEFF' + lines.join('\r\n');
}

export function download(filename: string, content: string | Blob, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Baixa o arquivo gravado num campo `file`; falha vira aviso. */
export async function saveFile(client: C3Client, entity: string, id: string, field: string, file: { name: string }) {
  try {
    download(file.name, await client.file(entity, id, field));
  } catch (e) {
    notify(e instanceof Error ? e.message : 'Não foi possível baixar o arquivo.', 'error');
  }
}
