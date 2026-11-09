import type { ColumnDef } from '@c3theme/ui/table';

import { StatusChip, type StatusTone } from '@c3theme/ui';

export interface Fatura {
  id: string;
  cliente: string;
  emissao: string;
  valor: number;
  status: 'paga' | 'aberta' | 'atrasada';
}

const CLIENTES = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Araújo', 'Elisa Prado', 'Fábio Nogueira'];
const STATUS: Fatura['status'][] = ['paga', 'aberta', 'atrasada'];
const TONE: Record<Fatura['status'], StatusTone> = { paga: 'success', aberta: 'info', atrasada: 'danger' };

/** 42 faturas fixas (sem aleatório: a história fica igual a cada carga e o print não muda à toa). */
export const FATURAS: Fatura[] = Array.from({ length: 42 }, (_, i) => ({
  id: `FT-${String(i + 1).padStart(4, '0')}`,
  cliente: CLIENTES[i % CLIENTES.length],
  emissao: `2026-${String((i % 10) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
  valor: 150 + ((i * 7919) % 4800) + (i % 4) * 0.25,
  status: STATUS[(i * 5) % 3]
}));

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const date = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

export const COLUNAS: ColumnDef<Fatura, any>[] = [
  { accessorKey: 'id', header: 'Fatura' },
  { accessorKey: 'cliente', header: 'Cliente' },
  { accessorKey: 'emissao', header: 'Emissão', cell: ({ getValue }) => date.format(new Date(getValue<string>())) },
  { accessorKey: 'valor', header: 'Valor', meta: { align: 'right' }, cell: ({ getValue }) => money.format(getValue<number>()) },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { filterVariant: 'select' },
    cell: ({ getValue }) => <StatusChip label={getValue<string>()} tone={TONE[getValue<Fatura['status']>()]} />
  }
];
