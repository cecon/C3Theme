// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { apiCall, openShell, orderNumber, tag, startExampleBackend } from './shell.test-utils';

const backend = startExampleBackend();

describe('lista e formulário de clientes', () => {
  it('lista os registros, busca, abre um e altera', async () => {
    const t = tag();
    for (const [name, status] of [
      [`Ana ${t}`, 'active'],
      [`Bruno ${t}`, 'active'],
      [`Carla ${t}`, 'lead']
    ])
      await apiCall(backend.api(), 'POST', '/customer', { name, status });
    await openShell(backend.api(), '/customer');
    expect(await screen.findByText(`Ana ${t}`)).toBeTruthy();
    // a lista abre no primeiro filtro salvo (Ativos): o lead fica de fora até trocar de aba
    expect(screen.queryByText(`Carla ${t}`)).toBeNull();

    fireEvent.change(within(document.querySelector('main')!).getByRole('textbox', { name: 'Buscar clientes' }), {
      target: { value: `Bruno ${t}` }
    });
    await waitFor(() => expect(screen.queryByText(`Ana ${t}`)).toBeNull());
    fireEvent.click(screen.getByText(`Bruno ${t}`));

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const nome = screen.getByLabelText(/^Nome/);
    fireEvent.change(nome, { target: { value: `Bruno Alterado ${t}` } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(async () => {
      const list = await fetch(`${backend.api()}/customer?q=${encodeURIComponent(`Alterado ${t}`)}`, {
        headers: { authorization: 'Bearer admin' }
      });
      expect(((await list.json()) as { data: unknown[] }).data).toHaveLength(1);
    });
  });

  it('novo cliente: obrigatório vazio mostra o erro no campo; preenchido grava', async () => {
    const t = tag();
    await openShell(backend.api(), '/customer/new');
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    expect(await screen.findAllByText(/obrigatório/i)).not.toHaveLength(0);
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: `Novo ${t}` } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('button', { name: 'Editar' })).toBeTruthy();
    const list = await fetch(`${backend.api()}/customer?q=${t}`, { headers: { authorization: 'Bearer admin' } });
    expect(((await list.json()) as { data: { name: string }[] }).data.map((r) => r.name)).toEqual([`Novo ${t}`]);
  });

  it('pedidos: lista com total e a tabela no relatório agrupado', async () => {
    const t = tag();
    await apiCall(backend.api(), 'POST', '/sales_order', { number: orderNumber(), description: `Pedido ${t}`, total: '150.00' });
    await openShell(backend.api(), '/sales_order');
    const row = (await screen.findByText(`Pedido ${t}`)).closest('tr')!;
    expect(within(row).getByText(/150,00/)).toBeTruthy();
  });

  it('pedidos: relatório agrupado por vendedor e situação', async () => {
    const t = tag();
    await apiCall(backend.api(), 'POST', '/sales_order', { number: orderNumber(), description: `Relatório ${t}`, total: '80.00' });
    await openShell(backend.api(), '/sales_order/report');
    expect(await screen.findAllByText('Pedidos por vendedor e situação')).not.toHaveLength(0);
    expect(await screen.findByText(`Relatório ${t}`)).toBeTruthy();
  });
});
