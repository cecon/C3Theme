// Textos e números da página pública.
import { Chart21, Mobile, People, ReceiptText, SecuritySafe, Wallet3 } from 'iconsax-reactjs';
import { Tone } from '@c3theme/ui';

export const FEATURES: { icon: typeof Chart21; tone: Tone; title: string; text: string }[] = [
  { icon: ReceiptText, tone: 'primary', title: 'Faturas em minutos', text: 'Monte a fatura, envie por e-mail e acompanhe quem já pagou.' },
  {
    icon: Wallet3,
    tone: 'success',
    title: 'Cobrança automática',
    text: 'Lembretes antes e depois do vencimento, sem você precisar lembrar.'
  },
  { icon: Chart21, tone: 'info', title: 'Relatórios prontos', text: 'Receita, inadimplência e ticket médio sempre atualizados.' },
  { icon: People, tone: 'warning', title: 'Clientes organizados', text: 'Histórico de compras, contatos e anotações em um só cadastro.' },
  { icon: SecuritySafe, tone: 'danger', title: 'Segurança de banco', text: 'Verificação em duas etapas e controle de quem acessa o quê.' },
  { icon: Mobile, tone: 'secondary', title: 'Funciona no celular', text: 'Consulte e aprove de qualquer lugar, sem instalar nada.' }
];

export const NUMBERS = [
  ['12 mil', 'empresas usando'],
  ['R$ 1,8 bi', 'faturados por ano'],
  ['38%', 'menos inadimplência'],
  ['4,8/5', 'nota de satisfação']
];

export const TESTIMONIALS = [
  {
    name: 'Ricardo Nunes',
    role: 'Sócio, Oficina Rota Sul (Porto Alegre)',
    text: 'Antes eu cobrava cliente por WhatsApp e esquecia metade. Hoje os lembretes saem sozinhos e o caixa fecha certinho.'
  },
  {
    name: 'Patrícia Lopes',
    role: 'Gerente, Clínica Vida Plena (Curitiba)',
    text: 'A equipe da recepção aprendeu em uma tarde. Os relatórios do fim do mês, que levavam dois dias, agora saem num clique.'
  },
  {
    name: 'Fábio Teixeira',
    role: 'Fundador, Livraria Página Viva (Salvador)',
    text: 'Gosto de ver tudo pelo celular entre uma reunião e outra. O suporte responde rápido e em português de verdade.'
  }
];
