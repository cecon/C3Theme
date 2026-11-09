export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

const escape = (v: string | number) => {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Gera um CSV (separado por ponto e vírgula, como o Excel em pt-BR espera) e baixa no navegador. */
export function downloadCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]) {
  const lines = [columns.map((c) => escape(c.header)).join(';'), ...rows.map((r) => columns.map((c) => escape(c.value(r))).join(';'))];
  // BOM para o Excel reconhecer UTF-8 (acentos)
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
