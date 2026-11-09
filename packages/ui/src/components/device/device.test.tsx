// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AccessRequests from './AccessRequests';
import AllowList from './AllowList';
import DeviceLink from './DeviceLink';
import { useNow } from './useNow';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const theme = createTheme({ cssVariables: true });
const ui = (node: ReactNode) => (
  <ThemeProvider theme={theme}>
    <IntlProvider locale="pt-BR" onError={() => {}}>
      {node}
    </IntlProvider>
  </ThemeProvider>
);

describe('DeviceLink', () => {
  it('QR novo troca só o desenho do mesmo nó (sem desmontar, sem piscar)', () => {
    const { rerender } = render(ui(<DeviceLink status="qr" qr="primeiro" />));
    const svg = screen.getByRole('img', { name: 'QR Code para ligar o aparelho' });
    const before = svg.querySelector('path')!.getAttribute('d');
    rerender(ui(<DeviceLink status="qr" qr="segundo-codigo" />));
    const after = screen.getByRole('img', { name: 'QR Code para ligar o aparelho' });
    expect(after).toBe(svg);
    expect(after.querySelector('path')!.getAttribute('d')).not.toBe(before);
  });

  it('"Usar código" pede o número e devolve só os dígitos', () => {
    const onUsePairingCode = vi.fn();
    render(ui(<DeviceLink status="qr" qr="x" onUsePairingCode={onUsePairingCode} />));
    fireEvent.click(screen.getByRole('button', { name: 'Usar código em vez de QR' }));
    const field = screen.getByRole('textbox', { name: 'Número do celular com DDD' });
    fireEvent.change(field, { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pedir código' }));
    expect(onUsePairingCode).not.toHaveBeenCalled();
    fireEvent.change(field, { target: { value: '+55 11 98765-4321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pedir código' }));
    expect(onUsePairingCode).toHaveBeenCalledWith('5511987654321');
  });

  it('com o número conhecido, "Usar código" chama direto', () => {
    const onUsePairingCode = vi.fn();
    render(ui(<DeviceLink status="qr" qr="x" phone="+55 11 98765-4321" onUsePairingCode={onUsePairingCode} />));
    fireEvent.click(screen.getByRole('button', { name: 'Usar código em vez de QR' }));
    expect(onUsePairingCode).toHaveBeenCalledWith('5511987654321');
  });

  it('código de pareamento aparece agrupado e soletrado para o leitor de tela', () => {
    render(ui(<DeviceLink status="pairing-code" pairingCode="abcd1234" />));
    expect(screen.getByText('ABCD-1234')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Código de pareamento: A B C D, 1 2 3 4' })).toBeTruthy();
  });

  it('erro mostra o detalhe e "Tentar de novo" chama o app', () => {
    const onRetry = vi.fn();
    render(ui(<DeviceLink status="error" error="Tempo esgotado" onRetry={onRetry} onCancel={() => {}} />));
    expect(screen.getByText('Tempo esgotado')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('AccessRequests', () => {
  const request = {
    id: 'r1',
    name: 'Maria Souza',
    phone: '5511987654321',
    code: 'K7P2QX9M',
    message: '<b>Oi</b>, quero fazer um pedido 😀',
    receivedAt: Date.now() - 5 * 60_000
  };

  it('primeira mensagem começa recolhida, abre pelo botão e HTML fica como texto', () => {
    const { container } = render(ui(<AccessRequests requests={[request]} onApprove={() => {}} onReject={() => {}} />));
    const toggle = screen.getByRole('button', { name: 'Ver a primeira mensagem' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Esconder a primeira mensagem' }).getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText('<b>Oi</b>, quero fazer um pedido 😀')).toBeTruthy();
  });

  it('mostra há quanto tempo chegou e as ações devolvem o pedido', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(ui(<AccessRequests requests={[request]} onApprove={onApprove} onReject={onReject} />));
    expect(screen.getByText('há 5 minutos')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar Maria Souza' }));
    fireEvent.click(screen.getByRole('button', { name: 'Recusar Maria Souza' }));
    expect(onApprove).toHaveBeenCalledWith(request);
    expect(onReject).toHaveBeenCalledWith(request);
  });

  it('sem pedidos mostra o estado vazio', () => {
    render(ui(<AccessRequests requests={[]} onApprove={() => {}} onReject={() => {}} />));
    expect(screen.getByText('Nenhum pedido esperando aprovação.')).toBeTruthy();
  });
});

describe('useNow', () => {
  it('atualiza no intervalo e limpa o timer ao desmontar', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useNow(1000));
    const first = result.current;
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBeGreaterThan(first);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('AllowList', () => {
  const entries = [{ id: '1', kind: 'contact' as const, value: '5511987654321', label: 'Maria', access: 'blocked' as const }];

  it('etiqueta em texto e botão de liberar quando bloqueado', () => {
    const onChangeAccess = vi.fn();
    render(ui(<AllowList entries={entries} onAdd={() => {}} onChangeAccess={onChangeAccess} />));
    expect(screen.getByText('Bloqueado')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Liberar Maria' }));
    expect(onChangeAccess).toHaveBeenCalledWith(entries[0], 'allowed');
  });

  it('campo recusa duplicado e entrega o telefone normalizado', () => {
    const onAdd = vi.fn();
    render(ui(<AllowList entries={entries} onAdd={onAdd} />));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar contato ou grupo' }));
    const field = screen.getByRole('textbox', { name: 'Telefone com DDD ou ID do grupo' });
    fireEvent.change(field, { target: { value: '+55 11 98765-4321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(screen.getByText('Já está na lista.')).toBeTruthy();
    expect(onAdd).not.toHaveBeenCalled();
    fireEvent.change(field, { target: { value: '120363041234567890@g.us' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onAdd).toHaveBeenCalledWith({ kind: 'group', value: '120363041234567890@g.us', access: 'allowed' });
  });
});
