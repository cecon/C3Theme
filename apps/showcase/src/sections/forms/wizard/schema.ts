// third-party
import { z } from 'zod';

const digits = (s: string) => s.replace(/\D/g, '');

/** Validade do cartão no formato MM/AA, sem estar vencida. */
function validadeOk(v: string) {
  const [mm, aa] = v.split('/').map(Number);
  if (!mm || mm > 12 || Number.isNaN(aa)) return false;
  const hoje = new Date();
  const ano = 2000 + aa;
  return ano > hoje.getFullYear() || (ano === hoje.getFullYear() && mm >= hoje.getMonth() + 1);
}

export const enderecoSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.'),
  sobrenome: z.string().trim().min(2, 'Informe o sobrenome.'),
  cep: z.string().refine((v) => digits(v).length === 8, 'CEP com 8 dígitos.'),
  logradouro: z.string().trim().min(3, 'Informe rua e número.'),
  complemento: z.string(),
  cidade: z.string().trim().min(2, 'Informe a cidade.'),
  uf: z.string().min(2, 'Escolha a UF.'),
  principal: z.boolean()
});

export const pagamentoSchema = z.object({
  titular: z.string().trim().min(3, 'Nome como está no cartão.'),
  cartao: z.string().refine((v) => digits(v).length === 16, 'O número tem 16 dígitos.'),
  validade: z.string().refine(validadeOk, 'Validade inválida ou vencida.'),
  cvv: z.string().refine((v) => digits(v).length === 3, 'CVV com 3 dígitos.'),
  salvarCartao: z.boolean()
});

export const pedidoSchema = enderecoSchema.extend(pagamentoSchema.shape);

export type Pedido = z.infer<typeof pedidoSchema>;

export const PEDIDO_VAZIO: Pedido = {
  nome: '',
  sobrenome: '',
  cep: '',
  logradouro: '',
  complemento: '',
  cidade: '',
  uf: '',
  principal: true,
  titular: '',
  cartao: '',
  validade: '',
  cvv: '',
  salvarCartao: false
};

/** Campos conferidos em cada etapa (a revisão não tem campos). */
export const CAMPOS_POR_ETAPA: (keyof Pedido)[][] = [
  Object.keys(enderecoSchema.shape) as (keyof Pedido)[],
  Object.keys(pagamentoSchema.shape) as (keyof Pedido)[],
  []
];
