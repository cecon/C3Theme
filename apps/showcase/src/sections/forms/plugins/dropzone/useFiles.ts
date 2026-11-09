import { useCallback, useEffect, useRef, useState } from 'react';

// third-party
import type { FileRejection } from 'react-dropzone';

import { notify } from '@c3theme/ui';

export interface UploadFile {
  id: string;
  file: File;
  /** URL temporária para a prévia de imagens. */
  preview?: string;
}

let seq = 0;

export const isImage = (f: File) => f.type.startsWith('image/');

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} KB`;
  return `${(kb / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

const REASONS: Record<string, string> = {
  'file-too-large': 'maior que o limite',
  'file-invalid-type': 'tipo não aceito',
  'too-many-files': 'excede a quantidade permitida',
  'file-too-small': 'arquivo vazio'
};

/** Avisa, em português, por que cada arquivo foi recusado. */
export function reportRejections(rejections: FileRejection[]) {
  if (!rejections.length) return;
  const first = rejections[0];
  const why = REASONS[first.errors[0]?.code] ?? 'não aceito';
  const extra = rejections.length > 1 ? ` e mais ${rejections.length - 1}` : '';
  notify(`"${first.file.name}"${extra}: ${why}.`, 'error');
}

const toUpload = (file: File): UploadFile => ({ id: `f${++seq}`, file, preview: isImage(file) ? URL.createObjectURL(file) : undefined });
const release = (list: UploadFile[]) => list.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));

/** Lista de arquivos escolhidos, cuidando de criar e liberar as URLs de prévia. */
export function useFiles(max: number) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const latest = useRef(files);
  useEffect(() => {
    latest.current = files;
  }, [files]);

  // libera as prévias ao sair da página
  useEffect(() => () => release(latest.current), []);

  const add = useCallback(
    (accepted: File[]) => {
      const room = Math.max(0, max - files.length);
      if (accepted.length > room) notify(`Limite de ${max} arquivos: ${accepted.length - room} ficaram de fora.`, 'warning');
      if (room > 0) setFiles([...files, ...accepted.slice(0, room).map(toUpload)]);
    },
    [files, max]
  );

  /** Troca tudo por um só arquivo (campos de arquivo único). */
  const replace = useCallback(
    (file: File) => {
      release(files);
      setFiles([toUpload(file)]);
    },
    [files]
  );

  const remove = useCallback(
    (id: string) => {
      release(files.filter((f) => f.id === id));
      setFiles(files.filter((f) => f.id !== id));
    },
    [files]
  );

  const clear = useCallback(() => {
    release(files);
    setFiles([]);
  }, [files]);

  return { files, add, replace, remove, clear };
}
