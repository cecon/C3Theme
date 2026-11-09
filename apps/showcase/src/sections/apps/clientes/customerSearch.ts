// Busca e exportação de clientes usadas pela tela de cartões.

import { downloadCsv } from './csv';
import { Customer, formatCpf, formatPhone, STATUS } from './data';

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Texto pesquisável do cliente: nome, e-mail, cidade, CPF e telefone (com ou sem máscara). */
export const searchText = (c: Customer) =>
  normalize([c.nome, c.email, c.cidade, c.uf, c.cpf, formatCpf(c.cpf), c.telefone, formatPhone(c.telefone)].join(' '));

export function exportCustomers(rows: Customer[]) {
  downloadCsv(
    'clientes.csv',
    [
      { header: 'Código', value: (c) => c.id },
      { header: 'Nome', value: (c) => c.nome },
      { header: 'E-mail', value: (c) => c.email },
      { header: 'Telefone', value: (c) => formatPhone(c.telefone) },
      { header: 'CPF', value: (c) => formatCpf(c.cpf) },
      { header: 'Idade', value: (c) => c.idade },
      { header: 'Cidade', value: (c) => `${c.cidade} - ${c.uf}` },
      { header: 'Situação', value: (c) => STATUS[c.status].label },
      { header: 'Pedidos', value: (c) => c.pedidos },
      { header: 'Total gasto', value: (c) => c.totalGasto.toFixed(2).replace('.', ',') }
    ],
    rows
  );
}
