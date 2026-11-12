// Porta de conexão (issue #99): diz à shell se o app está on-line. O padrão lê o navegador (`navigator.onLine` e os
// eventos `online`/`offline`); no Electron, onde o pedido vai por IPC, o app passa o sinal que tiver. Sem React.

export interface ConnectivityPort {
  online(): boolean;
  /** Avisa cada mudança; devolve o cancelamento. */
  subscribe(change: (online: boolean) => void): () => void;
}

/** O navegador como fonte. Sem `window` (SSR, teste de Node), sempre on-line. */
export const browserConnectivity: ConnectivityPort = {
  online: () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false),
  subscribe(change) {
    if (typeof window === 'undefined') return () => {};
    const on = () => change(true);
    const off = () => change(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }
};
