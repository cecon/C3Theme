export type Billing = 'mensal' | 'anual';

export interface Plan {
  id: string;
  name: string;
  description: string;
  /** Preço por mês no plano mensal (R$). */
  monthly: number;
  popular?: boolean;
  /** Quais itens de FEATURES o plano inclui (índices). */
  includes: number[];
  limits: { users: string; invoices: string; storage: string };
}

/** Desconto do pagamento anual. */
export const ANNUAL_DISCOUNT = 0.2;

export const FEATURES = [
  'Painel com indicadores',
  'Faturas e cobranças',
  'Cadastro de clientes',
  'Relatórios exportáveis',
  'Lembretes automáticos de cobrança',
  'Papéis e permissões por pessoa',
  'Integração por API',
  'Suporte prioritário por telefone'
];

export const PLANS: Plan[] = [
  {
    id: 'essencial',
    name: 'Essencial',
    description: 'Para quem está começando e quer sair da planilha.',
    monthly: 49,
    includes: [0, 1, 2],
    limits: { users: '2 usuários', invoices: '50 faturas/mês', storage: '2 GB' }
  },
  {
    id: 'profissional',
    name: 'Profissional',
    description: 'Para pequenas empresas com equipe e rotina de cobrança.',
    monthly: 129,
    popular: true,
    includes: [0, 1, 2, 3, 4, 5],
    limits: { users: '10 usuários', invoices: 'Faturas ilimitadas', storage: '20 GB' }
  },
  {
    id: 'empresarial',
    name: 'Empresarial',
    description: 'Para operações maiores, com integrações e suporte dedicado.',
    monthly: 299,
    includes: [0, 1, 2, 3, 4, 5, 6, 7],
    limits: { users: 'Usuários ilimitados', invoices: 'Faturas ilimitadas', storage: '100 GB' }
  }
];

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Preço mostrado por mês e o total cobrado no ciclo. */
export function price(plan: Plan, billing: Billing) {
  const perMonth = billing === 'anual' ? Math.round(plan.monthly * (1 - ANNUAL_DISCOUNT)) : plan.monthly;
  return {
    perMonth: brl.format(perMonth),
    total: billing === 'anual' ? `${brl.format(perMonth * 12)} por ano` : 'cobrado todo mês',
    saving: billing === 'anual' ? brl.format((plan.monthly - perMonth) * 12) : undefined
  };
}
