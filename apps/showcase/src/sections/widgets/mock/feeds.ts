// Pessoas, tarefas, feed, mensagens e finanças dos widgets de dados.

// ---------------------------------------------------------------- widgets de dados

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary';

export interface Person {
  name: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  city: string;
  online: boolean;
}

export const PEOPLE: Person[] = [
  {
    name: 'Ana Ribeiro',
    initials: 'AR',
    role: 'Gerente de projetos',
    email: 'ana.ribeiro@exemplo.com.br',
    phone: '(11) 98123-4501',
    city: 'São Paulo, SP',
    online: true
  },
  {
    name: 'Bruno Carvalho',
    initials: 'BC',
    role: 'Desenvolvedor front-end',
    email: 'bruno.carvalho@exemplo.com.br',
    phone: '(21) 99734-2210',
    city: 'Rio de Janeiro, RJ',
    online: true
  },
  {
    name: 'Camila Duarte',
    initials: 'CD',
    role: 'Designer de produto',
    email: 'camila.duarte@exemplo.com.br',
    phone: '(31) 98455-7781',
    city: 'Belo Horizonte, MG',
    online: false
  },
  {
    name: 'Diego Moreira',
    initials: 'DM',
    role: 'Analista de dados',
    email: 'diego.moreira@exemplo.com.br',
    phone: '(41) 99288-1043',
    city: 'Curitiba, PR',
    online: true
  },
  {
    name: 'Elisa Nogueira',
    initials: 'EN',
    role: 'Recursos humanos',
    email: 'elisa.nogueira@exemplo.com.br',
    phone: '(51) 98611-5320',
    city: 'Porto Alegre, RS',
    online: false
  },
  {
    name: 'Fábio Teixeira',
    initials: 'FT',
    role: 'Suporte técnico',
    email: 'fabio.teixeira@exemplo.com.br',
    phone: '(71) 99102-8876',
    city: 'Salvador, BA',
    online: true
  },
  {
    name: 'Gabriela Lins',
    initials: 'GL',
    role: 'Financeiro',
    email: 'gabriela.lins@exemplo.com.br',
    phone: '(81) 98820-6634',
    city: 'Recife, PE',
    online: false
  },
  {
    name: 'Henrique Prado',
    initials: 'HP',
    role: 'Vendas',
    email: 'henrique.prado@exemplo.com.br',
    phone: '(61) 99540-1197',
    city: 'Brasília, DF',
    online: true
  }
];

export const MY_TASKS: { title: string; time: string; tag: string; tone: StatusTone }[] = [
  { title: 'Enviar proposta para a Construtora Horizonte', time: '08:30', tag: 'Comercial', tone: 'primary' },
  { title: 'Revisar contrato de manutenção', time: '10:00', tag: 'Jurídico', tone: 'warning' },
  { title: 'Reunião de alinhamento da sprint 42', time: '11:30', tag: 'Equipe', tone: 'info' },
  { title: 'Aprovar notas fiscais de setembro', time: '14:00', tag: 'Financeiro', tone: 'success' },
  { title: 'Retornar chamado #4821 do cliente', time: '16:15', tag: 'Suporte', tone: 'danger' }
];

export interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

export const TODOS: TodoItem[] = [
  { id: 1, text: 'Atualizar a planilha de custos', done: true },
  { id: 2, text: 'Agendar visita técnica em Campinas', done: false },
  { id: 3, text: 'Responder pesquisa de satisfação', done: false },
  { id: 4, text: 'Renovar certificado digital A1', done: true },
  { id: 5, text: 'Preparar apresentação do trimestre', done: false }
];

export const DELIVERIES: { title: string; detail: string; date: string; tone: StatusTone }[] = [
  { title: 'Entrega do módulo de estoque', detail: 'Equipe Atlas · 12 tarefas', date: '2026-10-20', tone: 'primary' },
  { title: 'Treinamento dos usuários', detail: 'Filial Recife · 3 turmas', date: '2026-10-23', tone: 'success' },
  { title: 'Migração do banco de dados', detail: 'Infraestrutura · janela noturna', date: '2026-10-27', tone: 'warning' },
  { title: 'Auditoria de segurança', detail: 'Consultoria externa', date: '2026-11-03', tone: 'danger' }
];

export const JOB = {
  company: 'Mercado Bom Preço Ltda.',
  cnpj: '12.345.678/0001-90',
  title: 'Pessoa desenvolvedora sênior',
  location: 'Florianópolis, SC · híbrido',
  salary: 'R$ 14.000 a R$ 18.000',
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  description: 'Time de 8 pessoas cuidando do aplicativo de compras e da plataforma de parceiros.'
};

export const NEW_CUSTOMERS = [
  { name: 'Padaria Pão Dourado', initials: 'PD', city: 'Campinas, SP', when: 'há 5 min', orders: 3 },
  { name: 'Clínica Vida Plena', initials: 'VP', city: 'Niterói, RJ', when: 'há 18 min', orders: 1 },
  { name: 'Auto Peças Paraná', initials: 'AP', city: 'Londrina, PR', when: 'há 42 min', orders: 7 },
  { name: 'Escola Saber Mais', initials: 'SM', city: 'Goiânia, GO', when: 'há 1 h', orders: 2 },
  { name: 'Farmácia Bem Estar', initials: 'BE', city: 'Fortaleza, CE', when: 'há 2 h', orders: 4 },
  { name: 'Hotel Mar Azul', initials: 'MA', city: 'Natal, RN', when: 'há 3 h', orders: 1 },
  { name: 'Mercearia do Zé', initials: 'MZ', city: 'Manaus, AM', when: 'ontem', orders: 5 }
];

export const USER_ACTIVITY = [
  { person: 0, action: 'publicou o relatório de vendas de setembro', when: 'há 2 min' },
  { person: 1, action: 'corrigiu 3 falhas no checkout', when: 'há 15 min' },
  { person: 3, action: 'atualizou o painel de indicadores', when: 'há 40 min' },
  { person: 5, action: 'encerrou 12 chamados de suporte', when: 'há 1 h' },
  { person: 2, action: 'enviou novas telas para revisão', when: 'há 3 h' }
];

export const FEED: { kind: 'pedido' | 'tarefa' | 'cancelamento' | 'cliente' | 'pagamento'; text: string; when: string }[] = [
  { kind: 'pedido', text: 'Novo pedido #10482 de R$ 1.240,00', when: 'agora' },
  { kind: 'tarefa', text: 'Você tem 3 tarefas vencendo hoje', when: 'há 10 min' },
  { kind: 'cliente', text: 'Clínica Vida Plena criou uma conta', when: 'há 18 min' },
  { kind: 'pagamento', text: 'Pix de R$ 3.580,00 confirmado', when: 'há 35 min' },
  { kind: 'cancelamento', text: 'Pedido #10461 cancelado pelo cliente', when: 'há 1 h' },
  { kind: 'pedido', text: 'Novo pedido #10479 de R$ 389,90', when: 'há 2 h' }
];

export const REQUESTS: { text: string; tone: StatusTone }[] = [
  { text: 'Solicitação de férias de Elisa Nogueira', tone: 'success' },
  { text: '2 reembolsos aguardando aprovação', tone: 'danger' },
  { text: 'Pedido de acesso ao sistema financeiro', tone: 'warning' },
  { text: 'Troca de equipamento — notebook', tone: 'primary' },
  { text: 'Inclusão de dependente no plano de saúde', tone: 'success' },
  { text: 'Ajuste de ponto do dia 14/10', tone: 'neutral' },
  { text: 'Compra de licenças de software', tone: 'warning' }
];

export const MESSAGES = [
  { person: 1, text: 'Subi a correção do cálculo de frete, pode testar?', when: '09:12' },
  { person: 0, text: 'Cliente aprovou o cronograma. Começamos segunda.', when: '09:47' },
  { person: 6, text: 'Os boletos de outubro já foram emitidos.', when: '10:30' },
  { person: 3, text: 'Backup do banco concluído sem erros.', when: '11:05' }
];

export const POSTS: { title: string; excerpt: string; when: string; tone: StatusTone }[] = [
  {
    title: 'Como reduzimos o tempo de entrega em 30%',
    excerpt: 'Mudanças simples na separação de pedidos.',
    when: '2 dias atrás',
    tone: 'primary'
  },
  { title: 'Novidades da versão 3.2', excerpt: 'Pix agendado, relatórios e modo escuro.', when: '5 dias atrás', tone: 'success' },
  {
    title: 'Guia de boas-vindas para novos clientes',
    excerpt: 'Os primeiros passos na plataforma.',
    when: '1 semana atrás',
    tone: 'warning'
  }
];

export interface Transaction {
  id: string;
  name: string;
  detail: string;
  amount: number;
  status: 'concluida' | 'pendente' | 'falhou';
}

export const TRANSACTIONS: Transaction[] = [
  { id: 't1', name: 'Distribuidora Sul', detail: 'Pix · 18/10, 09:14', amount: 4_830.0, status: 'concluida' },
  { id: 't2', name: 'Assinatura de software', detail: 'Cartão · 17/10, 22:01', amount: -219.9, status: 'concluida' },
  { id: 't3', name: 'Papelaria Central', detail: 'Boleto · 17/10, 14:30', amount: -1_082.45, status: 'pendente' },
  { id: 't4', name: 'Loja Virtual', detail: 'Cartão · 16/10, 11:48', amount: 12_420.0, status: 'concluida' },
  { id: 't5', name: 'Transportadora Rápida', detail: 'TED · 16/10, 08:05', amount: -3_150.0, status: 'falhou' },
  { id: 't6', name: 'Consultoria Alfa', detail: 'Pix · 15/10, 16:22', amount: 7_500.0, status: 'pendente' }
];

export const PAYMENTS = [
  { name: 'Aluguel do escritório', initials: 'AL', date: '2026-10-05', amount: 8_500 },
  { name: 'Energia elétrica', initials: 'EE', date: '2026-10-11', amount: 1_284.37 },
  { name: 'Internet e telefonia', initials: 'IT', date: '2026-10-09', amount: 459.9 },
  { name: 'Folha de pagamento', initials: 'FP', date: '2026-10-01', amount: 96_430 },
  { name: 'Contabilidade', initials: 'CT', date: '2026-10-14', amount: 2_100 }
];

export const INVESTMENTS = [
  { name: 'Tesouro Selic 2029', change: 145.85 },
  { name: 'CDB 110% do CDI', change: 92.4 },
  { name: 'Fundo imobiliário', change: -63.68 },
  { name: 'Ações — carteira dividendos', change: -210.12 },
  { name: 'LCI 95% do CDI', change: 38.5 },
  { name: 'Fundo multimercado', change: 12.07 }
];

export const TRAFFIC: { label: string; value: number; color: 'primary' | 'success' | 'warning' | 'info' | 'error' }[] = [
  { label: 'Busca orgânica', value: 46, color: 'primary' },
  { label: 'Acesso direto', value: 22, color: 'success' },
  { label: 'Redes sociais', value: 17, color: 'info' },
  { label: 'Indicações', value: 10, color: 'warning' },
  { label: 'E-mail marketing', value: 5, color: 'error' }
];

export const MONTHLY_REVENUE = [
  { month: 'Outubro', revenue: 214_900, change: 12.3 },
  { month: 'Setembro', revenue: 191_350, change: 4.1 },
  { month: 'Agosto', revenue: 183_820, change: -2.6 },
  { month: 'Julho', revenue: 188_730, change: 7.9 },
  { month: 'Junho', revenue: 174_920, change: -1.4 }
];
