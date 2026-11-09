/** Arquivo já no servidor: o que o campo guarda e o formulário grava (só a referência, nunca o conteúdo). */
export interface UploadedFile {
  /** Id ou chave que o backend devolveu. */
  id: string;
  name: string;
  size: number;
  contentType?: string;
  /** Para baixar ou mostrar a miniatura. */
  url?: string;
}

export interface UploadContext {
  /** Fração enviada, de 0 a 1. */
  onProgress: (fraction: number) => void;
  /** Cancelado pelo usuário (botão) ou porque a tela fechou. */
  signal: AbortSignal;
}

/**
 * Porta de envio: o app diz como o arquivo sobe (POST multipart, URL assinada do S3, chunk) e devolve a referência.
 * Para o caso comum há o `xhrUploader`.
 */
export type Uploader = (file: File, ctx: UploadContext) => Promise<UploadedFile>;
