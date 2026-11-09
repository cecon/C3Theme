import { useSyncExternalStore } from 'react';

import { Invoice, SEED_INVOICES } from './data';

// faturas em memória, compartilhadas entre painel, lista, formulário e detalhes (somem ao recarregar a página)
let invoices: Invoice[] = SEED_INVOICES;
const listeners = new Set<() => void>();

const set = (next: Invoice[]) => {
  invoices = next;
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useInvoices() {
  return useSyncExternalStore(subscribe, () => invoices);
}

export function useInvoice(id: string | undefined) {
  const list = useInvoices();
  return list.find((i) => i.id === id);
}

export const invoiceStore = {
  /** Próximo id/número livre. */
  nextId: () => String(Math.max(1000, ...invoices.map((i) => Number(i.id) || 0)) + 1),
  save(invoice: Invoice) {
    const exists = invoices.some((i) => i.id === invoice.id);
    set(exists ? invoices.map((i) => (i.id === invoice.id ? invoice : i)) : [invoice, ...invoices]);
  },
  remove(ids: string[]) {
    set(invoices.filter((i) => !ids.includes(i.id)));
  },
  markPaid(id: string) {
    set(invoices.map((i) => (i.id === id ? { ...i, status: 'paga' } : i)));
  }
};
