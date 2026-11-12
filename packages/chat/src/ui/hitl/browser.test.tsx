// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BrowserCheckpoint } from '../../core/hitlBrowser';
import BrowserPart from './BrowserPart';
import BrowserView from './BrowserView';
import { answering, message, partOf, wrap } from './hitl.test-utils';

afterEach(cleanup);

const frame = 'data:image/png;base64,AAA';

describe('BrowserView', () => {
  it('mostra o endereço, a captura e onde vai clicar', () => {
    wrap(
      <BrowserView url="https://loja.com/carrinho" title="Carrinho" frame={frame} target={{ x: 50, y: 120 }} activity="Clicando em Pagar" />
    );
    expect(screen.getByRole('region', { name: 'Navegador do assistente' })).toBeTruthy();
    expect(screen.getByText('loja.com')).toBeTruthy();
    expect(screen.getByText('/carrinho')).toBeTruthy();
    expect(screen.getByTitle('Conexão segura')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Carrinho' }).getAttribute('src')).toBe(frame);
    const mark = screen.getByRole('img', { name: 'Onde o assistente vai clicar' });
    expect(mark.style.top || getComputedStyle(mark).top).toBeTruthy();
    expect(screen.getByText('Clicando em Pagar')).toBeTruthy();
  });

  it('carregando, sem captura e erro', () => {
    wrap(<BrowserView url="http://a.com" status="loading" />);
    expect(screen.getByRole('progressbar', { name: 'Carregando a página…' })).toBeTruthy();
    expect(screen.getByTitle('Conexão não segura')).toBeTruthy();
    cleanup();
    wrap(<BrowserView url="https://a.com" />);
    expect(screen.getByText('Sem captura da página.')).toBeTruthy();
    cleanup();
    wrap(<BrowserView url="https://a.com" status="error" target={{ x: 1, y: 1 }} />);
    expect(screen.getByText('Não foi possível abrir a página.')).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Onde o assistente vai clicar' })).toBeNull();
    cleanup();
    wrap(<BrowserView url="https://a.com" status="error" error="Bloqueado" />);
    expect(screen.getByText('Bloqueado')).toBeTruthy();
  });

  it('nunca mostra captura de esquema perigoso', () => {
    wrap(<BrowserView url="https://a.com" frame="javascript:alert(1)" />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('com o agente no controle, a barra fica travada e dá para assumir', () => {
    const onTakeOver = vi.fn();
    const onBack = vi.fn();
    wrap(<BrowserView url="https://a.com" control="agent" canGoBack onBack={onBack} onNavigate={vi.fn()} onTakeOver={onTakeOver} />);
    expect(screen.getByRole('status').textContent).toBe('O assistente está no controle');
    expect((screen.getByRole('button', { name: 'Voltar' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Endereço: https://a.com' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Assumir controle' }));
    expect(onTakeOver).toHaveBeenCalled();
  });

  it('com o humano no controle: navega, volta, recarrega e devolve', () => {
    const on = { onBack: vi.fn(), onForward: vi.fn(), onReload: vi.fn(), onNavigate: vi.fn(), onHandBack: vi.fn() };
    wrap(<BrowserView url="https://a.com" control="user" canGoBack canGoForward {...on} />);
    expect(screen.getByRole('status').textContent).toBe('Você está no controle');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Recarregar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Devolver ao assistente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Endereço: https://a.com' }));
    const input = screen.getByRole('textbox', { name: 'Endereço' });
    fireEvent.change(input, { target: { value: 'duas palavras' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(input, { target: { value: 'b.com/x' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(on.onNavigate).toHaveBeenCalledWith('https://b.com/x');
    for (const f of [on.onBack, on.onForward, on.onReload, on.onHandBack]) expect(f).toHaveBeenCalledTimes(1);
  });

  it('Esc e sair do campo desistem do endereço', () => {
    const onNavigate = vi.fn();
    wrap(<BrowserView url="https://a.com" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Endereço: https://a.com' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Endereço' }), { key: 'Escape' });
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Endereço: https://a.com' }));
    fireEvent.blur(screen.getByRole('textbox', { name: 'Endereço' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(onNavigate).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Voltar' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('endereço que não é http fica como texto', () => {
    wrap(<BrowserView url="about:blank" />);
    expect(screen.getByText('about:blank')).toBeTruthy();
  });
});

const checkpoint: BrowserCheckpoint = { url: 'https://loja.com/pagar', intent: 'Pagar o pedido 1234', frame, risk: 'high' };

describe('BrowserPart', () => {
  const show = (p: unknown = checkpoint, onAnswer = answering()) => {
    wrap(<BrowserPart part={partOf('c3.browser', p)} message={message} open onAnswer={onAnswer} />);
    return onAnswer;
  };

  it('permite ou assume o controle', async () => {
    const onAnswer = show();
    expect(screen.getByText('O assistente quer: Pagar o pedido 1234')).toBeTruthy();
    expect(screen.getByText('Risco alto')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Permitir' })));
    expect(onAnswer).toHaveBeenLastCalledWith({ action: 'accept', values: { decision: 'allow' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Assumir controle' })));
    expect(onAnswer).toHaveBeenLastCalledWith({ action: 'accept', values: { decision: 'takeover' } });
  });

  it('recusa com o motivo; sem assumir quando não oferecido', async () => {
    const onAnswer = show({ ...checkpoint, allowTakeover: false });
    expect(screen.queryByRole('button', { name: 'Assumir controle' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'site errado' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Recusar e avisar' })));
    expect(onAnswer).toHaveBeenCalledWith({ action: 'decline', values: { reason: 'site errado' } });
  });

  it('formato errado vira aviso', () => {
    show({ url: 'javascript:1', intent: 'x' });
    expect(screen.getByText('O assistente mandou um pedido que não dá para mostrar.')).toBeTruthy();
  });

  it('fechada: permitido, assumido, recusado ou sem resposta', () => {
    const closed = (extra: object) => wrap(<BrowserPart part={partOf('c3.browser', checkpoint, extra)} message={message} open={false} />);
    closed({ state: 'submitted', result: { decision: 'allow' } });
    expect(screen.getByText('Permitido')).toBeTruthy();
    cleanup();
    closed({ state: 'submitted', result: { decision: 'takeover' } });
    expect(screen.getByText('Você assumiu o controle')).toBeTruthy();
    cleanup();
    closed({ state: 'declined', result: { reason: 'não' } });
    expect(screen.getByText('Motivo: não')).toBeTruthy();
    cleanup();
    closed({ state: 'cancelled' });
    expect(screen.getByText('Pagar o pedido 1234')).toBeTruthy();
  });
});
