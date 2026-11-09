import type { UploadedFile, Uploader } from './types';

export interface XhrUploaderOptions {
  url: string;
  /** Nome do campo no multipart. Padrão "file". */
  field?: string;
  /** Cabeçalhos extras, ex.: token. Função para pegar o token atual a cada envio. */
  headers?: Record<string, string> | (() => Record<string, string>);
  withCredentials?: boolean;
  /** Converte a resposta do servidor na referência. Padrão: o JSON já é um `UploadedFile`. */
  parse?: (body: unknown, file: File) => UploadedFile;
}

/**
 * POST multipart com progresso real (o `fetch` não informa progresso de envio, o XMLHttpRequest sim). Resposta
 * fora de 2xx rejeita com a mensagem do corpo (`message` ou `error`) ou o status.
 */
export function xhrUploader({ url, field = 'file', headers, withCredentials, parse }: XhrUploaderOptions): Uploader {
  return (file, { onProgress, signal }) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.withCredentials = Boolean(withCredentials);
      for (const [k, v] of Object.entries(typeof headers === 'function' ? headers() : (headers ?? {}))) xhr.setRequestHeader(k, v);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onerror = () => reject(new Error('network'));
      xhr.onabort = () => reject(new DOMException('aborted', 'AbortError'));
      xhr.onload = () => {
        let body: any;
        try {
          body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          body = null;
        }
        if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(body?.message ?? body?.error ?? `HTTP ${xhr.status}`));
        resolve(parse ? parse(body, file) : (body as UploadedFile));
      };
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
      const form = new FormData();
      form.append(field, file, file.name);
      xhr.send(form);
    });
}
