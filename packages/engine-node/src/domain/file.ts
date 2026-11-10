// Arquivo (`type: file`): na escrita trafega como `{ name, contentType, data }`, com `data` em base64. O motor confere
// forma, tamanho e extensão; abrir e guardar o arquivo é do sistema. Na entidade, a coluna guarda os metadados
// (`{ name, size, contentType }` em JSON, gravados pelo sistema) e a leitura devolve só eles.

import { isObject } from './types';

/** `maxSize` de quem não declara e teto padrão do app (`maxUploadSize`), em bytes: 1 MB. */
export const MAX_FILE_SIZE = 1 << 20;
/** O maior `maxUploadSize` que o app pode escolher: 32 MB. */
export const UPLOAD_CEILING = 32 << 20;

/** Limite do corpo para o teto de upload: o arquivo em base64 (4/3) e folga para o resto, nunca abaixo de 2 MB. */
export const bodyLimit = (maxUpload: number): number => Math.max(Math.ceil(maxUpload / 3) * 4 + (512 << 10), 2 << 20);

interface FileRules {
  maxSize: number;
  /** Extensões aceitas, minúsculas e com ponto (`.pfx`); vazio aceita qualquer uma. */
  accept: string[];
}

/** Arquivo novo (com `data`). Sem `data`, é o que veio da leitura (metadados): o gravado fica. */
export const isNewFile = (v: unknown): boolean => isObject(v) && 'data' in v;

/** Coluna → formato trafegado: os metadados em JSON; texto que não é objeto JSON vale como sem arquivo. */
export function fileToWire(text: string | null): unknown {
  if (text === null) return null;
  try {
    const v = JSON.parse(text);
    return isObject(v) ? v : null;
  } catch {
    return null;
  }
}

export function checkFile(f: FileRules, v: unknown): 'invalid_type' | 'too_large' | 'file_type' | undefined {
  if (!isObject(v)) return 'invalid_type';
  if (Object.keys(v).some((k) => k !== 'name' && k !== 'contentType' && k !== 'data')) return 'invalid_type';
  const name = v.name;
  if (typeof name !== 'string' || name.trim() === '' || new TextEncoder().encode(name).length > 255) return 'invalid_type';
  if ('contentType' in v && v.contentType !== null && typeof v.contentType !== 'string') return 'invalid_type';
  const size = typeof v.data === 'string' ? decodedLength(v.data) : undefined;
  if (size === undefined || size === 0) return 'invalid_type';
  if (size > f.maxSize) return 'too_large';
  const lower = name.toLowerCase();
  if (f.accept.length && !f.accept.some((ext) => lower.endsWith(ext))) return 'file_type';
  return undefined;
}

/** Tamanho em bytes de um base64 padrão (com `=`), sem decodificar; `undefined` se não for base64. */
export function decodedLength(s: string): number | undefined {
  if (s.length % 4 !== 0) return undefined;
  const pad = /=*$/.exec(s)![0].length;
  const body = s.slice(0, s.length - pad);
  if (pad > 2 || !/^[A-Za-z0-9+/]*$/.test(body)) return undefined;
  return (s.length / 4) * 3 - pad;
}
