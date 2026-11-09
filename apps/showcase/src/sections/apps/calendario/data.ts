// third-party
import { addDays, setHours, setMinutes, startOfDay, startOfMonth } from 'date-fns';

export type EventTone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  allDay: boolean;
  start: Date;
  /** Fim exclusivo, como no FullCalendar (evento de dia inteiro termina às 0h do dia seguinte). */
  end: Date;
  tone: EventTone;
}

export const EVENT_TONES: { tone: EventTone; label: string }[] = [
  { tone: 'primary', label: 'Principal' },
  { tone: 'secondary', label: 'Neutra' },
  { tone: 'success', label: 'Verde' },
  { tone: 'warning', label: 'Amarela' },
  { tone: 'danger', label: 'Vermelha' },
  { tone: 'info', label: 'Azul' }
];

// os exemplos ficam no mês corrente para o calendário nunca abrir vazio
const base = startOfMonth(new Date());
const day = (offset: number) => startOfDay(addDays(base, offset));
const at = (offset: number, hour: number, minute = 0) => setMinutes(setHours(day(offset), hour), minute);

export const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Planejamento trimestral',
    description: 'Revisão de metas com as lideranças de vendas e operações.',
    allDay: false,
    start: at(1, 9),
    end: at(1, 11, 30),
    tone: 'primary'
  },
  {
    id: 'ev-2',
    title: 'Visita ao cliente em Curitiba',
    description: 'Apresentação da proposta comercial para a Araucária Têxtil.',
    allDay: true,
    start: day(3),
    end: day(5),
    tone: 'info'
  },
  {
    id: 'ev-3',
    title: 'Entrega da apuração fiscal',
    description: 'Prazo final para envio dos arquivos à contabilidade.',
    allDay: true,
    start: day(7),
    end: day(8),
    tone: 'danger'
  },
  {
    id: 'ev-4',
    title: 'Almoço com fornecedores',
    description: 'Restaurante no centro de Belo Horizonte.',
    allDay: false,
    start: at(9, 12),
    end: at(9, 13, 30),
    tone: 'warning'
  },
  {
    id: 'ev-5',
    title: 'Treinamento da equipe de suporte',
    description: 'Novo fluxo de atendimento e base de conhecimento.',
    allDay: false,
    start: at(11, 14),
    end: at(11, 17),
    tone: 'success'
  },
  {
    id: 'ev-6',
    title: 'Webinar: LGPD na prática',
    description: 'Transmissão aberta para clientes e parceiros.',
    allDay: false,
    start: at(14, 19),
    end: at(14, 20, 30),
    tone: 'secondary'
  },
  {
    id: 'ev-7',
    title: 'Revisão da sprint',
    description: 'Demonstração das entregas e retrospectiva.',
    allDay: false,
    start: at(16, 10),
    end: at(16, 11),
    tone: 'primary'
  },
  {
    id: 'ev-8',
    title: 'Viagem a Recife',
    description: 'Feira regional de varejo e encontros com distribuidores.',
    allDay: true,
    start: day(18),
    end: day(21),
    tone: 'info'
  },
  {
    id: 'ev-9',
    title: 'Aniversário da Carla',
    description: 'Bolo na copa às 16h.',
    allDay: true,
    start: day(22),
    end: day(23),
    tone: 'success'
  },
  {
    id: 'ev-10',
    title: 'Comitê de investimentos',
    description: 'Análise das propostas de expansão para o Nordeste.',
    allDay: false,
    start: at(24, 15),
    end: at(24, 16, 30),
    tone: 'warning'
  },
  {
    id: 'ev-11',
    title: 'Fechamento do mês',
    description: 'Conciliação bancária e relatório gerencial.',
    allDay: false,
    start: at(26, 8, 30),
    end: at(26, 12),
    tone: 'danger'
  },
  {
    id: 'ev-12',
    title: 'Café com novos colaboradores',
    description: 'Boas-vindas à nova turma de contratados.',
    allDay: false,
    start: at(16, 15),
    end: at(16, 16),
    tone: 'secondary'
  }
];
