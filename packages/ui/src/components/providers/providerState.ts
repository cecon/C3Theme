import type { Tone } from '../../theme/soft';
import type { ProviderItem, ProviderStatus } from './types';

/** Botão principal de cada estado (o que leva o provedor adiante). */
export type MainAction = 'install' | 'signIn' | 'retry';

const MAIN: Partial<Record<ProviderStatus, MainAction>> = { missing: 'install', 'needs-login': 'signIn', error: 'retry' };

const TONE: Record<ProviderStatus, Tone> = {
  missing: 'neutral',
  installing: 'info',
  installed: 'primary',
  'needs-login': 'warning',
  'signing-in': 'info',
  ready: 'success',
  error: 'danger'
};

/** Estados em que o programa está no computador: aí o menu oferece atualizar e remover. */
const ON_DISK: ProviderStatus[] = ['installed', 'needs-login', 'ready'];

export const mainActionFor = (status: ProviderStatus): MainAction | undefined => MAIN[status];
export const toneFor = (status: ProviderStatus): Tone => TONE[status];
export const hasMenu = (status: ProviderStatus) => ON_DISK.includes(status);
export const isBusy = (status: ProviderStatus) => status === 'installing' || status === 'signing-in';

/** Progresso arredondado e preso entre 0 e 100; `undefined` quando indeterminado. */
export const percentOf = (progress?: number) =>
  progress === undefined || Number.isNaN(progress) ? undefined : Math.min(100, Math.max(0, Math.round(progress)));

/** De quanto em quanto por cento o leitor de tela ouve o progresso (avisar todo 1% atropela a leitura). */
export const PROGRESS_STEP = 25;

/** O que mudou e merece aviso: troca de estado ou progresso que cruzou um degrau de `PROGRESS_STEP`. */
export type ProviderChange = { kind: 'status'; item: ProviderItem } | { kind: 'progress'; item: ProviderItem; percent: number };

export function changesBetween(prev: ProviderItem[], next: ProviderItem[]): ProviderChange[] {
  const before = new Map(prev.map((p) => [p.id, p]));
  const out: ProviderChange[] = [];
  for (const item of next) {
    const old = before.get(item.id);
    if (!old) continue;
    if (old.status !== item.status) {
      out.push({ kind: 'status', item });
      continue;
    }
    if (item.status !== 'installing') continue;
    const a = percentOf(old.progress);
    const b = percentOf(item.progress);
    if (b === undefined) continue;
    const step = Math.floor(b / PROGRESS_STEP);
    if (a === undefined ? step > 0 : step > Math.floor(a / PROGRESS_STEP))
      out.push({ kind: 'progress', item, percent: step * PROGRESS_STEP });
  }
  return out;
}
