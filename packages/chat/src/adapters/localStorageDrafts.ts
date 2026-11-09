import type { DraftStorage } from '../core/transport';

/** Rascunhos no localStorage do navegador, uma chave por conversa. Sem acesso (modo privado), não guarda. */
export function localStorageDrafts(prefix = 'c3-chat-draft:'): DraftStorage {
  return {
    get(id) {
      try {
        return localStorage.getItem(prefix + id) ?? '';
      } catch {
        return '';
      }
    },
    set(id, text) {
      try {
        if (text) localStorage.setItem(prefix + id, text);
        else localStorage.removeItem(prefix + id);
      } catch {
        // sem armazenamento: o rascunho vale só enquanto a tela está aberta
      }
    }
  };
}

/** Rascunhos só em memória (testes, ou quando o app não quer guardar nada no navegador). */
export function memoryDrafts(): DraftStorage {
  const map = new Map<string, string>();
  return { get: (id) => map.get(id) ?? '', set: (id, text) => (text ? map.set(id, text) : map.delete(id)) };
}
