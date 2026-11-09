// Período de consulta (de/até) sem React: atalhos e validação.

/** Período como a tela guarda: datas ISO (AAAA-MM-DD); null é "sem limite". */
export interface Period {
  from: string | null;
  to: string | null;
}

export type PeriodShortcut = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth';

export const PERIOD_SHORTCUTS: PeriodShortcut[] = ['today', 'yesterday', 'last7', 'thisMonth', 'lastMonth'];

const pad = (n: number) => String(n).padStart(2, '0');
/** Data local em ISO, sem passar por UTC (meia-noite em UTC-3 ainda é o dia anterior em UTC). */
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const day = (y: number, m: number, d: number) => isoDate(new Date(y, m, d));

/** Período de um atalho, contado a partir de `today` (dia local). */
export function shortcutPeriod(shortcut: PeriodShortcut, today = new Date()): Period {
  const [y, m, d] = [today.getFullYear(), today.getMonth(), today.getDate()];
  switch (shortcut) {
    case 'today':
      return { from: day(y, m, d), to: day(y, m, d) };
    case 'yesterday':
      return { from: day(y, m, d - 1), to: day(y, m, d - 1) };
    case 'last7':
      return { from: day(y, m, d - 6), to: day(y, m, d) };
    case 'thisMonth':
      return { from: day(y, m, 1), to: day(y, m + 1, 0) };
    case 'lastMonth':
      return { from: day(y, m - 1, 1), to: day(y, m, 0) };
  }
}

/** Qual atalho o período é, para destacar a ficha; null se nenhum. */
export function activeShortcut(p: Period, today = new Date()): PeriodShortcut | null {
  return (
    PERIOD_SHORTCUTS.find((s) => {
      const q = shortcutPeriod(s, today);
      return q.from === p.from && q.to === p.to;
    }) ?? null
  );
}

/** O que impede filtrar: início depois do fim, ou falta uma ponta obrigatória. */
export function periodProblem(p: Period, required = false): 'order' | 'missing' | null {
  if (required && (!p.from || !p.to)) return 'missing';
  if (p.from && p.to && p.from > p.to) return 'order';
  return null;
}
