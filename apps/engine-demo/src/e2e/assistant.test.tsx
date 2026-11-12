// @vitest-environment jsdom
// Assistente pelo app.json (#71, ADR 0005): o botão do header e a página /assistente, sem TS do sistema, contra o
// agente roteirizado do CRM de exemplo pelas rotas /_chat.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { openShell, startExampleBackend } from './shell.test-utils';

const backend = startExampleBackend();

// a lista de mensagens é virtualizada: sem altura, o jsdom não mostra linha nenhuma
beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { configurable: true, get: () => 600 },
    offsetWidth: { configurable: true, get: () => 400 },
    clientHeight: { configurable: true, get: () => 600 }
  });
  HTMLElement.prototype.scrollTo = function scrollTo() {};
});

describe('assistente declarado no app.json', () => {
  it('botão do header: a sugestão vira rascunho de cliente, e gravar cadastra pelo CRUD', async () => {
    await openShell(backend.api(), '/customer');
    fireEvent.click(await screen.findByRole('button', { name: 'Assistente' }));
    const drawer = await screen.findByRole('presentation');
    fireEvent.click(await within(drawer).findByText('Cadastrar a Padaria Bom Dia'));

    expect(await within(drawer).findByText(/Montei o cadastro/, {}, { timeout: 8000 })).toBeTruthy();
    expect(await within(drawer).findByText('Pedido pelo assistente')).toBeTruthy();
    // limite de crédito é aiReview: grava só depois de conferir
    for (const b of within(drawer).queryAllByRole('button', { name: 'Conferi' })) fireEvent.click(b);
    const save = within(drawer).getByRole('button', { name: 'Gravar' });
    await waitFor(() => expect((save as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(save);

    expect(await within(drawer).findByText(/cadastrado\. Quer abrir um pedido/, {}, { timeout: 8000 })).toBeTruthy();
    const list = (await fetch(`${backend.api()}/customer?q=Padaria%20Bom%20Dia`, { headers: { authorization: 'Bearer admin' } }).then((r) =>
      r.json()
    )) as { data: { name: string }[] };
    expect(list.data.map((c) => c.name)).toContain('Padaria Bom Dia');
  });

  it('página /assistente: a mesma conversa do usuário, e o relatório pede o período num formulário', async () => {
    await openShell(backend.api(), '/assistente', 'ana');
    fireEvent.click(await screen.findByText('Relatório de vendas do mês'));
    expect(await screen.findByText('Para montar o relatório, preciso do período', {}, { timeout: 8000 })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }));
    expect(await screen.findByText('Tudo bem, fica para depois.', {}, { timeout: 8000 })).toBeTruthy();
    // outro usuário não vê a conversa da ana
    const page = await fetch(`${backend.api()}/_chat/assistant/messages`, { headers: { authorization: 'Bearer beto' } }).then((r) =>
      r.json()
    );
    expect(page).toEqual({ messages: [], hasMore: false });
  });
});
