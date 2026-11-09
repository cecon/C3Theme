// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiCall, openShell, orderNumber, tag, startExampleBackend } from './shell.test-utils';

const backend = startExampleBackend();

describe('seleção em lote, exportação e consulta com parâmetros', () => {
  it('pedidos: marca dois, vê a soma e cancela os dois em lote com o motivo', async () => {
    const t = tag();
    const ids: string[] = [];
    for (const [n, total] of [
      ['A', '10.00'],
      ['B', '15.50'],
      ['C', '1.00']
    ])
      ids.push(
        (await apiCall(backend.api(), 'POST', '/sales_order', { number: orderNumber(), description: `Lote ${n} ${t}`, total })).id as string
      );
    await openShell(backend.api(), '/sales_order');
    for (const n of ['A', 'B']) {
      const row = (await screen.findByText(`Lote ${n} ${t}`)).closest('tr')!;
      fireEvent.click(within(row).getByRole('checkbox', { name: 'Marcar linha' }));
    }
    expect(screen.getByTestId('selection-summary').textContent).toContain('25,50');
    fireEvent.click(screen.getAllByRole('button', { name: /Cancelar pedido/ })[0]);
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Motivo/, { selector: 'textarea, input' }), {
      target: { value: 'Cliente desistiu da compra toda' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /Cancelar pedido/ }));
    await waitFor(async () => {
      const status = await Promise.all(ids.map(async (id) => (await apiCall(backend.api(), 'GET', `/sales_order/${id}`)).status));
      expect(status).toEqual(['canceled', 'canceled', 'open']);
    });
  });

  it('Exportar CSV baixa as linhas da lista', async () => {
    const t = tag();
    await apiCall(backend.api(), 'POST', '/customer', { name: `Csv ${t}`, status: 'active' });
    await openShell(backend.api(), '/customer');
    await screen.findByText(`Csv ${t}`);
    const blobs: Blob[] = [];
    URL.createObjectURL = vi.fn((b: Blob) => {
      blobs.push(b);
      return 'blob:csv';
    });
    URL.revokeObjectURL = vi.fn();
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    await waitFor(() => expect(blobs).toHaveLength(1));
    const csv = await blobs[0].text();
    expect(csv.split('\n')[0]).toContain('Nome');
    expect(csv).toContain(`Csv ${t}`);
  });

  it('consulta do sistema: pendências por cliente com os parâmetros na barra', async () => {
    const t = tag();
    const c = await apiCall(backend.api(), 'POST', '/customer', { name: `Pendente ${t}`, status: 'active' });
    await apiCall(backend.api(), 'POST', '/activity', { subject: `Cobrar ${t}`, stage: 'todo', due_date: '2020-01-01', customer_id: c.id });
    await openShell(backend.api(), '/customer_pending');
    expect(await screen.findByLabelText(/Posição em/, { selector: 'input' })).toBeTruthy();
    expect(await screen.findByText(`Pendente ${t}`)).toBeTruthy();
  });
});
