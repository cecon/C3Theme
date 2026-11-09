// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Message } from '../core/types';
import AssistantMessage from './AssistantMessage';
import Composer from './Composer';
import Markdown from './Markdown';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });

// sem as mensagens carregadas, o react-intl reclama de cada chave (e o erro serializado estoura a memória do vitest)
const wrap = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

const reply = (extra: Partial<Message> = {}): Message => ({
  id: 'r1',
  conversationId: 'c1',
  author: { id: 'ia', name: 'Assistente' },
  direction: 'in',
  format: 'markdown',
  createdAt: '2026-11-02T12:00:00.000Z',
  ...extra
});

describe('Markdown', () => {
  it('não injeta HTML nem link perigoso', () => {
    const { container } = wrap(<Markdown text={'<img src=x onerror="alert(1)"> [x](javascript:alert(1)) **ok**'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('strong')?.textContent).toBe('ok');
    expect(container.textContent).toContain('<img src=x');
  });

  it('link externo abre em outra aba sem passar o opener', () => {
    wrap(<Markdown text="[docs](https://c3.dev)" />);
    const a = screen.getByRole('link', { name: 'docs' });
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a.getAttribute('target')).toBe('_blank');
  });
});

describe('AssistantMessage', () => {
  it('sem texto e escrevendo: "Pensando…", raciocínio ao vivo e etapas em andamento', () => {
    wrap(
      <AssistantMessage
        message={reply({
          streaming: true,
          reasoning: 'Vou consultar o cadastro.',
          tools: [{ id: 't1', name: 'nati_consultar', status: 'running' }]
        })}
      />
    );
    expect(screen.getByRole('status').textContent).toContain('Pensando…');
    expect(screen.getByLabelText('Raciocínio').textContent).toBe('Vou consultar o cadastro.');
    expect(screen.getByText('nati_consultar')).toBeTruthy();
    expect(screen.queryByLabelText('Copiar resposta')).toBeNull();
  });

  it('pronta com trabalho: recolhido em "Pensou por", abre e mostra entrada e saída da etapa', () => {
    const tools = [
      { id: 't1', name: 'erp_consultar', label: 'Consultar cadastro', status: 'done' as const, input: '{"q":1}', output: '3 itens' }
    ];
    wrap(<AssistantMessage message={reply({ text: 'ok', reasoning: 'pensei', reasoningMs: 4000, tools })} />);
    const head = screen.getByRole('button', { name: /Pensou por 4 s · 1 etapa/ });
    expect(head.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(head);
    fireEvent.click(screen.getByLabelText('Detalhes de Consultar cadastro'));
    expect(screen.getByText('{"q":1}')).toBeTruthy();
    expect(screen.getByText('3 itens')).toBeTruthy();
  });

  it('sem trabalho nenhum, não mostra a área de trabalho', () => {
    wrap(<AssistantMessage message={reply({ text: 'oi' })} />);
    expect(screen.queryByText(/Pensou|Pensando/)).toBeNull();
  });

  it('pronta: markdown, copiar e gerar de novo', () => {
    const onRegenerate = vi.fn();
    wrap(<AssistantMessage message={reply({ text: 'Hoje há **1 produto**' })} onRegenerate={onRegenerate} />);
    expect(screen.getByText('1 produto').tagName).toBe('STRONG');
    fireEvent.click(screen.getByLabelText('Gerar de novo'));
    expect(onRegenerate).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Copiar resposta')).toBeTruthy();
  });
});

describe('Composer com assistente respondendo', () => {
  it('Enter não envia e o botão vira Parar', () => {
    const onSend = vi.fn();
    const onStop = vi.fn();
    wrap(<Composer value="próxima" onChange={() => {}} onSend={onSend} busy onStop={onStop} voice={false} files={false} />);
    fireEvent.keyDown(screen.getByLabelText('Mensagem'), { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Parar resposta'));
    expect(onStop).toHaveBeenCalledOnce();
  });
});
