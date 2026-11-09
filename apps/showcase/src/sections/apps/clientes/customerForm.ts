// Formulário do cliente: CPF, regras e valores iniciais.
import { z } from 'zod';

function isValidCpf(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const check = (len: number) => {
    const sum = cpf
      .slice(0, len)
      .split('')
      .reduce((acc, d, i) => acc + Number(d) * (len + 1 - i), 0);
    const r = (sum * 10) % 11;
    return (r === 10 ? 0 : r) === Number(cpf[len]);
  };
  return check(9) && check(10);
}

export const schema = z.object({
  foto: z.string().optional(),
  nome: z.string().trim().min(3, 'Informe o nome completo.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone incompleto.'),
  cpf: z.string().refine(isValidCpf, 'CPF inválido.'),
  idade: z.number({ error: 'Informe a idade.' }).int().min(18, 'Precisa ter 18 anos ou mais.').max(110, 'Idade inválida.'),
  cidade: z.string().trim().min(2, 'Informe a cidade.'),
  uf: z.string().min(2, 'Escolha o estado.'),
  cargo: z.string().trim().min(2, 'Informe a profissão.'),
  status: z.enum(['ativo', 'pendente', 'inativo']),
  interesses: z.array(z.string()).max(4, 'Escolha até 4 interesses.'),
  sobre: z.string().trim().max(300, 'Até 300 caracteres.')
});

export type FormValues = z.infer<typeof schema>;

export const EMPTY: Partial<FormValues> = {
  foto: undefined,
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  idade: undefined,
  cidade: '',
  uf: '',
  cargo: '',
  status: 'ativo',
  interesses: [],
  sobre: ''
};
