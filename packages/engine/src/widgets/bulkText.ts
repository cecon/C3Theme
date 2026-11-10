// Textos da ação em lote: valores para a condição, título da linha que falhou e o alcance no diálogo.

import type { ActionDef } from '../actionTypes';
import type { RefusedRecord } from '../api';
import type { EntityDef, WireRecord } from '../types';

/** Registro lido → valores para avaliar condição: reference vira só o id. */
export function plain(record: WireRecord): WireRecord {
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k, v && typeof v === 'object' && 'id' in v ? (v as { id: string }).id : v])
  );
}

/** Título de uma linha para listar o que falhou: titleField, ou o primeiro campo de texto, ou o id. */
export function rowTitle(def: EntityDef, row: WireRecord): string {
  const name = def.titleField ?? def.fields.find((f) => f.type === 'string')?.name;
  const v = name ? row[name] : undefined;
  return v === undefined || v === null || v === '' ? `#${row.id}` : String(v);
}

/** "Vale para 3 de 4 registros marcados; 1 não se aplica e fica de fora." (em conjunto: "Uma execução só sobre"), com as somas. */
export function scopeText(action: ActionDef, n: number, marked: number, sums: string): string {
  const skipped = marked - n;
  const s = (k: number, one: string, many: string) => (k === 1 ? one : many);
  const start = action.bulk === 'together' ? 'Uma execução só sobre' : 'Vale para';
  const out = skipped ? `; ${skipped} ${s(skipped, 'não se aplica e fica', 'não se aplicam e ficam')} de fora` : '';
  return `${start} ${n} de ${marked} ${s(marked, 'registro marcado', 'registros marcados')}${out}.${sums ? ` ${sums}.` : ''}`;
}

/** Uma linha do relatório: título da linha e a mensagem do erro, com os erros de campo. */
export function refusedLine(def: EntityDef, chosen: WireRecord[], f: RefusedRecord) {
  const row = chosen.find((r) => r.id === f.id);
  const fields = Object.values(f.error.fields ?? {}).flatMap((list) => list.map((e) => e.message));
  return { id: f.id, title: row ? rowTitle(def, row) : `#${f.id}`, message: [f.error.message, ...fields].join(' ') };
}
