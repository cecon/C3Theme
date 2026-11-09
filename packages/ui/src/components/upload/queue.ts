// Envios em andamento: estado puro, sem React e sem rede.

import type { UploadedFile } from './types';

export type UploadStatus = 'waiting' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  key: string;
  file: File;
  status: UploadStatus;
  /** 0 a 1. */
  progress: number;
  result?: UploadedFile;
  error?: string;
}

export type UploadAction =
  | { type: 'add'; items: { key: string; file: File }[] }
  | { type: 'start'; key: string }
  | { type: 'progress'; key: string; progress: number }
  | { type: 'done'; key: string; result: UploadedFile }
  | { type: 'error'; key: string; error: string }
  | { type: 'retry'; key: string }
  | { type: 'remove'; key: string };

export function uploadReducer(items: UploadItem[], a: UploadAction): UploadItem[] {
  const patch = (key: string, p: Partial<UploadItem>) => items.map((i) => (i.key === key ? { ...i, ...p } : i));
  switch (a.type) {
    case 'add':
      return [...items, ...a.items.map((i) => ({ ...i, status: 'waiting' as const, progress: 0 }))];
    case 'start':
      return patch(a.key, { status: 'uploading', progress: 0, error: undefined });
    case 'progress':
      // o XHR às vezes repete ou volta um pouco; a barra só anda para frente
      return items.map((i) =>
        i.key === a.key && i.status === 'uploading' ? { ...i, progress: Math.max(i.progress, Math.min(1, a.progress)) } : i
      );
    case 'done':
      return patch(a.key, { status: 'done', progress: 1, result: a.result });
    case 'error':
      return patch(a.key, { status: 'error', error: a.error });
    case 'retry':
      return patch(a.key, { status: 'waiting', progress: 0, error: undefined });
    case 'remove':
      return items.filter((i) => i.key !== a.key);
  }
}

/** Os próximos a começar, respeitando quantos podem subir ao mesmo tempo. */
export function nextToStart(items: UploadItem[], concurrency: number): UploadItem[] {
  const running = items.filter((i) => i.status === 'uploading').length;
  return items.filter((i) => i.status === 'waiting').slice(0, Math.max(0, concurrency - running));
}
