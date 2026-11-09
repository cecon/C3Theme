// Regras e valores iniciais do cadastro de produto.
import { z } from 'zod';
import { ArtShape, CATEGORIES, CategoryId, SHAPES } from '../data';

export const MAX_FILES = 5;
export const MAX_SIZE = 2 * 1024 * 1024;

export const schema = z
  .object({
    nome: z.string().trim().min(3, 'Informe o nome do produto.'),
    sku: z
      .string()
      .trim()
      .regex(/^[A-Z0-9-]{4,16}$/, 'Use de 4 a 16 letras maiúsculas, números ou hífen.'),
    marca: z.string().trim().min(2, 'Informe a marca.'),
    categoria: z.enum(Object.keys(CATEGORIES) as [CategoryId, ...CategoryId[]], { error: 'Escolha a categoria.' }),
    forma: z.enum(Object.keys(SHAPES) as [ArtShape, ...ArtShape[]]),
    preco: z.number({ error: 'Informe o preço.' }).positive('O preço deve ser maior que zero.'),
    precoAntigo: z.number().positive().optional(),
    estoque: z.number({ error: 'Informe o estoque.' }).int().min(0, 'Estoque inválido.'),
    cores: z.array(z.string()).min(1, 'Escolha pelo menos uma cor.'),
    tamanhos: z.array(z.string()),
    resumo: z.string().trim().min(10, 'Escreva um resumo de pelo menos 10 caracteres.').max(120, 'Até 120 caracteres.'),
    descricao: z.string().trim().min(20, 'Descreva o produto (pelo menos 20 caracteres).'),
    imagens: z.array(z.string()).max(MAX_FILES)
  })
  .refine((v) => !v.precoAntigo || v.precoAntigo > v.preco, {
    path: ['precoAntigo'],
    message: 'O preço "de" precisa ser maior que o preço de venda.'
  });

export type FormValues = z.infer<typeof schema>;

export const EMPTY: Partial<FormValues> = {
  nome: '',
  sku: '',
  marca: '',
  forma: 'caixaSom',
  cores: [],
  tamanhos: [],
  resumo: '',
  descricao: '',
  imagens: []
};
