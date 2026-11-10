import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type RefObject } from 'react';

import { addFiles } from '../core/files';

export interface AttachmentOptions {
  /** Anexar ligado (`files` do composer). */
  enabled: boolean;
  accept?: string;
  disabled?: boolean;
  /** Onde soltar arquivos vale: a área do chat, por exemplo. Sem ele, o próprio composer. */
  dropTarget?: RefObject<HTMLElement | null>;
}

/**
 * Anexos do composer (#172): o seletor (+), colar imagem no campo de texto e arrastar arquivos para cima do composer
 * (ou de `dropTarget`). Tudo entra na mesma lista, sem repetir nome e tamanho e respeitando `accept` e `disabled`.
 * `dragging` liga o realce enquanto há arquivo sendo arrastado por cima.
 */
export default function useAttachments({ enabled, accept, disabled, dropTarget }: AttachmentOptions) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const on = enabled && !disabled;
  const add = (added: File[]) => setFiles((list) => addFiles(list, added, accept));

  useEffect(() => {
    const el = dropTarget?.current ?? rootRef.current;
    if (!el || !on) return;
    // entrar num filho dispara dragleave no pai: conta para saber quando saiu de verdade
    let depth = 0;
    const hasFiles = (e: DragEvent) => Boolean(e.dataTransfer?.types.includes('Files'));
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setDragging(true);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (!depth) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      setFiles((list) => addFiles(list, Array.from(e.dataTransfer?.files ?? []), accept));
    };
    el.addEventListener('dragenter', enter);
    el.addEventListener('dragover', over);
    el.addEventListener('dragleave', leave);
    el.addEventListener('drop', drop);
    return () => {
      el.removeEventListener('dragenter', enter);
      el.removeEventListener('dragover', over);
      el.removeEventListener('dragleave', leave);
      el.removeEventListener('drop', drop);
      setDragging(false);
    };
  }, [on, accept, dropTarget]);

  /** Seletor de arquivos (o input escondido do +). */
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    add(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  /** Colar no campo de texto: arquivo (print) vira anexo; texto cola como sempre. */
  const paste = (e: ClipboardEvent) => {
    const pasted = Array.from(e.clipboardData?.files ?? []);
    if (!on || !pasted.length) return;
    e.preventDefault();
    add(pasted);
  };

  return { files, setFiles, dragging, rootRef, pick, paste: enabled ? paste : undefined };
}
