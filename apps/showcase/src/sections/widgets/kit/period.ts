export type Period = 'dia' | 'semana' | 'mes' | 'ano';

export const PERIOD_LABELS: Record<Period, string> = {
  dia: 'Hoje',
  semana: 'Esta semana',
  mes: 'Este mês',
  ano: 'Este ano'
};

/** Valores por período, para widgets que mudam de dados ao trocar o período. */
export type ByPeriod<T> = Record<Period, T>;

export const PERIODS: Period[] = ['dia', 'semana', 'mes', 'ano'];
