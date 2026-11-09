// Registros do adaptador em memória: os mesmos dados que as telas em código da vitrine usam, no formato trafegado.

import type { MemorySeed, WireRecord } from '@c3theme/engine';

import { SEED_CUSTOMERS } from '../apps/clientes/data';
import { CUSTOMERS, invoiceTotal, SEED_INVOICES, totals } from '../apps/faturas/data';
import { INITIAL_DATA, storyCode } from '../apps/kanban/data';
import { SAMPLE_EVENTS } from '../apps/calendario/data';
import { PESSOAS } from '../tables/data';
import { ENTITIES, APP } from './spec';

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const money = (n: number) => n.toFixed(2);

const pessoas: WireRecord[] = PESSOAS.map(({ equipe: _e, ...p }) => ({ ...p, id: String(p.id), salario: money(p.salario) }));

const clientes: WireRecord[] = SEED_CUSTOMERS.map((c) => ({
  id: String(c.id),
  nome: c.nome,
  email: c.email,
  telefone: c.telefone,
  cpf: c.cpf,
  idade: c.idade,
  cargo: c.cargo,
  cidade: c.cidade,
  uf: c.uf,
  status: c.status,
  desde: c.desde.slice(0, 10),
  pedidos: c.pedidos,
  total_gasto: money(c.totalGasto),
  sobre: c.sobre
}));

const contas: WireRecord[] = CUSTOMERS.map((c) => ({
  id: c.id,
  nome: c.name,
  email: c.email,
  telefone: c.phone,
  documento: c.document,
  endereco: c.address.street,
  bairro: c.address.district,
  cidade: c.address.city,
  uf: c.address.state,
  cep: c.address.zip
}));

const faturas: WireRecord[] = SEED_INVOICES.map((i) => ({
  id: i.id,
  numero: i.number,
  conta: i.customer.id,
  cliente: i.customer.name,
  cliente_email: i.customer.email,
  emissao: i.issueDate,
  vencimento: i.dueDate,
  status: i.status,
  desconto: String(i.discount),
  impostos: String(i.tax),
  total: money(invoiceTotal(i)),
  observacoes: i.notes
}));

const itens: WireRecord[] = SEED_INVOICES.flatMap((i) =>
  i.lines.map((l) => ({ id: `${i.id}-${l.id}`, fatura: i.id, descricao: l.description, quantidade: l.quantity, preco: money(l.price) }))
);

const kanban = INITIAL_DATA;
const storyCodeOf = (cardId: string) => {
  const story = Object.values(kanban.stories).find((s) => s.cardIds.includes(cardId));
  return story ? storyCode(story.code) : null;
};
const tarefas: WireRecord[] = kanban.columnOrder.flatMap((col) =>
  kanban.columns[col].cardIds.map((id) => {
    const c = kanban.cards[id];
    return {
      id,
      titulo: c.title,
      codigo: storyCodeOf(id),
      etapa: col,
      responsavel: c.assigneeId,
      prioridade: c.priority,
      prazo: c.due ? isoDate(c.due) : null,
      descricao: c.description,
      comentarios: c.comments.length
    };
  })
);

const eventos: WireRecord[] = SAMPLE_EVENTS.map((e) => ({
  id: e.id,
  titulo: e.title,
  inicio: e.start.toISOString(),
  fim: e.end.toISOString(),
  dia_inteiro: e.allDay,
  cor: e.tone === 'primary' ? 'info' : e.tone === 'secondary' ? 'neutral' : e.tone,
  descricao: e.description
}));

// avisos do painel de faturas, com a hora relativa a agora (o "há 12 min" fica certo em qualquer dia)
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};
const notificacoes: WireRecord[] = [
  ['Pagamento recebido', 'Padaria Pão de Mel pagou FAT-2026-1028 via Pix.', 'pagamento', ago(12)],
  ['Fatura vencida', 'Mercadinho Bom Preço: FAT-2026-1025 está em atraso.', 'vencida', ago(180)],
  ['Lembrete enviado', 'Cobrança automática para Rafael Lima.', 'lembrete', ago(300)],
  ['Fatura criada', 'FAT-2026-1027 para Clínica Vida Plena.', 'criada', daysAgo(1)],
  ['Boleto visualizado', 'Livraria Página Viva abriu a fatura FAT-2026-1023.', 'visualizada', daysAgo(2)]
].map(([titulo, detalhe, tipo, quando], i) => ({ id: `n${i + 1}`, titulo, detalhe, tipo, quando }));

// receita de nov/2025 a out/2026, em R$, a mesma série do painel em código (faturado x recebido)
const BILLED = [38, 44, 31, 35, 42, 47, 45, 52, 58, 55, 61, 66];
const RECEIVED = [34, 41, 29, 30, 39, 41, 43, 47, 51, 52, 54, 57];
const receitas: WireRecord[] = BILLED.map((b, i) => {
  const d = new Date(2025, 10 + i, 1);
  return { id: `r${i + 1}`, mes: isoDate(d), faturado: money(b * 1000), recebido: money(RECEIVED[i] * 1000) };
});

// o total gravado é regra do sistema: a mesma conta do resumo do formulário, sobre os itens gravados
const faturaTotal = (f: WireRecord) => {
  const lines = ((f.fatura_item as WireRecord[] | undefined) ?? []).map((l) => ({
    quantity: Number(l.quantidade),
    price: Number(l.preco)
  }));
  return { total: money(totals(lines, Number(f.desconto), Number(f.impostos)).total) };
};

export const SEED: MemorySeed = {
  app: APP,
  entities: ENTITIES,
  latency: 150,
  actions: { fatura: { marcar_paga: () => ({ status: 'paga' }) }, cliente_fatura: { cobrar: () => ({}) } },
  onSave: { fatura: faturaTotal },
  records: {
    pessoa: pessoas,
    cliente: clientes,
    cliente_fatura: contas,
    fatura: faturas,
    fatura_item: itens,
    membro: kanban.members.map((m) => ({ id: m.id, nome: m.name })),
    tarefa: tarefas,
    evento: eventos,
    notificacao: notificacoes,
    receita_mes: receitas
  }
};
