// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { apiCall, openShell, tag, startExampleBackend } from './shell.test-utils';

const backend = startExampleBackend();
const today = new Date().toISOString().slice(0, 10);

describe('quadro, agenda, salão e painel', () => {
  it('quadro de atividades: uma coluna por etapa, com o cartão na sua', async () => {
    const t = tag();
    await apiCall(backend.api(), 'POST', '/activity', { subject: `Ligar ${t}`, stage: 'doing', due_date: today });
    await openShell(backend.api(), '/activity/board');
    const card = await screen.findByText(`Ligar ${t}`);
    expect(card.closest('section')?.getAttribute('aria-label')).toBe('Em andamento');
    expect(screen.getByRole('region', { name: 'A fazer' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Concluída' })).toBeTruthy();
    // a coluna descartada não está no quadro (views.board.columns)
    expect(screen.queryByRole('region', { name: 'Descartada' })).toBeNull();
  });

  it('agenda: a atividade aparece no dia', async () => {
    const t = tag();
    await apiCall(backend.api(), 'POST', '/activity', { subject: `Visita ${t}`, stage: 'todo', due_date: today });
    await openShell(backend.api(), '/activity/calendar');
    expect(await screen.findByText(`Visita ${t}`)).toBeTruthy();
  });

  it('salão: mesa no mapa, e clicar abre o registro com as ações', async () => {
    const t = tag();
    await apiCall(backend.api(), 'POST', '/dining_table', { name: `Mesa ${t}`, area: 'hall', seats: 4, x: 1, y: 1, w: 1 });
    await openShell(backend.api(), '/dining_table/map');
    fireEvent.click(await screen.findByText(`Mesa ${t}`));
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('painel: KPI conta os clientes e a lista mostra a atividade pendente', async () => {
    const t = tag();
    await apiCall(backend.api(), 'POST', '/customer', { name: `Painel ${t}`, status: 'active' });
    await apiCall(backend.api(), 'POST', '/activity', { subject: `Pendente ${t}`, stage: 'todo', due_date: today });
    await openShell(backend.api(), '/painel');
    expect(await screen.findByText(`Pendente ${t}`)).toBeTruthy();
    const kpi = screen.getByText('Clientes ativos').closest('div')!.parentElement!;
    await waitFor(() => expect(within(kpi).queryByText('0')).toBeNull());
  });
});
