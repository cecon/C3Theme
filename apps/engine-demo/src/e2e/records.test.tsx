// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { apiCall, openShell, orderNumber, tag, startExampleBackend } from './shell.test-utils';

const backend = startExampleBackend();
const read = (path: string) => apiCall(backend.api(), 'GET', path);

describe('ações, filhos e abas da lista', () => {
  it('ação com motivo: "Marcar como perdido" pede o motivo, grava e some do registro perdido', async () => {
    const t = tag();
    const c = await apiCall(backend.api(), 'POST', '/customer', { name: `Perda ${t}`, status: 'active' });
    await openShell(backend.api(), `/customer/${c.id as string}`);
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar como perdido' }));
    const dialog = await screen.findByRole('dialog');
    // obrigatório vazio: não envia
    fireEvent.click(within(dialog).getByRole('button', { name: 'Marcar como perdido' }));
    expect(await within(dialog).findAllByText(/obrigatório/i)).not.toHaveLength(0);
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /Motivo/ }));
    fireEvent.click(await screen.findByRole('option', { name: 'Preço' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Marcar como perdido' }));
    expect(await screen.findByText('Cliente marcado como perdido.')).toBeTruthy();
    await waitFor(async () => expect((await read(`/customer/${c.id as string}`)).status).toBe('churned'));
  });

  it('pedido com itens: adiciona a linha no lugar e grava pai e filhos juntos', async () => {
    const t = tag();
    await openShell(backend.api(), '/sales_order/new');
    fireEvent.change(await screen.findByLabelText(/^Número/), { target: { value: String(orderNumber()) } });
    fireEvent.change(screen.getByLabelText(/^Descrição/), { target: { value: `Com itens ${t}` } });
    const itens = screen.getByText('Itens').closest('.MuiCard-root, .MuiPaper-root') as HTMLElement;
    fireEvent.click(within(itens).getByRole('button', { name: /^Adicionar/ }));
    const inputs = within(itens).getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Pastel' } });
    fireEvent.change(within(itens).getAllByRole('spinbutton')[0] ?? inputs[1], { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('button', { name: 'Editar' })).toBeTruthy();
    const orders = (await (
      await fetch(`${backend.api()}/sales_order?q=${t}`, { headers: { authorization: 'Bearer admin', 'c3-branch': '1' } })
    ).json()) as {
      data: { id: string }[];
    };
    const order = await read(`/sales_order/${orders.data[0].id}`);
    expect(order.description).toBe(`Com itens ${t}`);
    expect(await screen.findByText('Pastel')).toBeTruthy();
    const where = encodeURIComponent(JSON.stringify({ field: 'order_id', op: 'eq', value: orders.data[0].id }));
    const items = (await (
      await fetch(`${backend.api()}/sales_order_item?where=${where}`, { headers: { authorization: 'Bearer admin', 'c3-branch': '1' } })
    ).json()) as {
      data: { product: string; quantity: number }[];
    };
    expect(items.data.map((i) => [i.product, i.quantity])).toEqual([['Pastel', 3]]);
  });

  it('perfil: permissões marcadas na lista agrupada por módulo', async () => {
    const t = tag();
    await openShell(backend.api(), '/role/new');
    fireEvent.change(await screen.findByLabelText(/^Nome/), { target: { value: `Caixa ${t}` } });
    const boxes = await screen.findAllByRole('checkbox');
    fireEvent.click(boxes[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('button', { name: 'Editar' })).toBeTruthy();
    const roles = (await (await fetch(`${backend.api()}/role?q=${t}`, { headers: { authorization: 'Bearer admin' } })).json()) as {
      data: { id: string }[];
    };
    const where = encodeURIComponent(JSON.stringify({ field: 'role_id', op: 'eq', value: roles.data[0].id }));
    const granted = (await (
      await fetch(`${backend.api()}/role_permission?where=${where}`, { headers: { authorization: 'Bearer admin' } })
    ).json()) as { data: unknown[] };
    // o primeiro da lista marca o módulo inteiro
    expect(granted.data.length).toBeGreaterThan(0);
  });

  it('filtro salvo: clicar no ativo tira o filtro e mostra os leads; outro filtro troca o recorte', async () => {
    const t = tag();
    await apiCall(backend.api(), 'POST', '/customer', { name: `Lead ${t}`, status: 'lead', vip: true });
    await openShell(backend.api(), '/customer');
    await screen.findByRole('table');
    const main = within(document.querySelector('main')!);
    fireEvent.click(main.getByRole('button', { name: 'Ativos' }));
    expect(await screen.findByText(`Lead ${t}`)).toBeTruthy();
    fireEvent.click(main.getByRole('button', { name: 'VIPs sem empresa' }));
    expect(await screen.findByText(`Lead ${t}`)).toBeTruthy();
    fireEvent.click(main.getByRole('button', { name: 'Limite acima de 10 mil' }));
    await waitFor(() => expect(screen.queryByText(`Lead ${t}`)).toBeNull());
  });
});
