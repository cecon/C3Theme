// Regras do formulário de fatura e conversão de/para a fatura e a pré-visualização.
import { format, parseISO } from 'date-fns';
import { z } from 'zod';
import { Address, Customer, Invoice } from '../data';
import { InvoiceDraft } from '../InvoiceDocument';

const addressSchema = z.object({ street: z.string(), district: z.string(), city: z.string(), state: z.string(), zip: z.string() });

export const schema = z
  .object({
    number: z.string().trim().min(1, 'Informe o número da fatura.'),
    status: z.enum(['paga', 'pendente', 'vencida', 'cancelada']),
    issueDate: z.date({ error: 'Informe a data de emissão.' }),
    dueDate: z.date({ error: 'Informe o vencimento.' }),
    customer: z.custom<Customer>((v) => typeof v === 'object' && v !== null, { message: 'Selecione o cliente.' }),
    billing: addressSchema,
    shipping: addressSchema,
    lines: z
      .array(
        z.object({
          id: z.string(),
          description: z.string().trim().min(1, 'Descreva o item.'),
          quantity: z.number({ error: 'Informe a quantidade.' }).int('Use número inteiro.').min(1, 'Mínimo 1.'),
          price: z.number({ error: 'Informe o preço.' }).positive('Maior que zero.')
        })
      )
      .min(1, 'Adicione ao menos um item.'),
    discount: z.number({ error: 'Informe o desconto.' }).min(0, 'Não pode ser negativo.').max(100, 'Até 100%.'),
    tax: z.number({ error: 'Informe o imposto.' }).min(0, 'Não pode ser negativo.').max(100, 'Até 100%.'),
    notes: z.string().max(500, 'Até 500 caracteres.')
  })
  .refine((d) => d.dueDate >= d.issueDate, { path: ['dueDate'], message: 'O vencimento não pode ser antes da emissão.' });

export type FormInput = z.input<typeof schema>;
export type FormOutput = z.output<typeof schema>;

export const EMPTY_ADDRESS: Address = { street: '', district: '', city: '', state: '', zip: '' };
let lineSeq = 0;
export const newLine = () => ({ id: `novo-${++lineSeq}`, description: '', quantity: 1, price: Number.NaN });
export const iso = (d: Date) => format(d, 'yyyy-MM-dd');

export function toForm(inv: Invoice | undefined, nextNumber: string): Partial<FormInput> {
  if (!inv) {
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 15);
    return {
      number: nextNumber,
      status: 'pendente',
      issueDate: today,
      dueDate: due,
      customer: undefined,
      billing: EMPTY_ADDRESS,
      shipping: EMPTY_ADDRESS,
      lines: [newLine()],
      discount: 0,
      tax: 0,
      notes: 'Pagamento via Pix ou boleto bancário.'
    };
  }
  return { ...inv, issueDate: parseISO(inv.issueDate), dueDate: parseISO(inv.dueDate), lines: inv.lines.map((l) => ({ ...l })) };
}

/** Converte os valores (mesmo incompletos) para o formato do documento, para a pré-visualização. */
export function toDraft(v: FormInput): InvoiceDraft {
  return {
    number: v.number,
    status: v.status,
    issueDate: v.issueDate instanceof Date && !isNaN(v.issueDate.getTime()) ? iso(v.issueDate) : '',
    dueDate: v.dueDate instanceof Date && !isNaN(v.dueDate.getTime()) ? iso(v.dueDate) : '',
    customer: v.customer ?? null,
    billing: v.billing,
    shipping: v.shipping,
    lines: v.lines.map((l) => ({ ...l, quantity: Number(l.quantity) || 0, price: Number(l.price) || 0 })),
    discount: Number(v.discount) || 0,
    tax: Number(v.tax) || 0,
    notes: v.notes
  };
}
