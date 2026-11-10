// @vitest-environment jsdom
// Variante inline do AgentComposer (#25): uma linha, ação de espera que vira enviar, parar, sem linha de ajuda.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AgentComposer, { type AgentComposerProps } from './AgentComposer';
import ComposerIconButton from './composer/ComposerIconButton';

afterEach(cleanup);

const wrap = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

function Controlled(props: Omit<AgentComposerProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState('');
  return <AgentComposer {...props} variant="inline" value={value} onChange={setValue} />;
}

const box = () => screen.getByRole('textbox', { name: 'Mensagem' });

describe('AgentComposer inline', () => {
  it('vazio mostra a ação de espera; com texto vira enviar', () => {
    const voice = vi.fn();
    const onSend = vi.fn();
    wrap(<Controlled onSend={onSend} hint="Enter envia" idleAction={{ label: 'Conversar por voz', icon: <i />, onClick: voice }} />);
    expect(screen.queryByText('Enter envia')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Conversar por voz' }));
    expect(voice).toHaveBeenCalled();
    fireEvent.change(box(), { target: { value: 'oi' } });
    expect(screen.queryByRole('button', { name: 'Conversar por voz' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(onSend).toHaveBeenCalledWith('oi', []);
  });

  it('respondendo e vazio, o mesmo botão para; sem ação de espera, enviar fica desligado', () => {
    const onStop = vi.fn();
    const { unmount } = wrap(
      <Controlled onSend={vi.fn()} busy onStop={onStop} idleAction={{ label: 'Voz', icon: <i />, onClick: vi.fn() }} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Parar resposta' }));
    expect(onStop).toHaveBeenCalled();
    unmount();
    wrap(<Controlled onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Enviar mensagem' }).hasAttribute('disabled')).toBe(true);
  });

  it('ações da direita com o botão redondo e o + com menu', () => {
    const novo = vi.fn();
    const cmd = vi.fn();
    wrap(
      <Controlled
        onSend={vi.fn()}
        addItems={[{ id: 'c', label: 'Comandos', onClick: cmd }]}
        endActions={
          <ComposerIconButton label="Nova conversa" onClick={novo}>
            <i />
          </ComposerIconButton>
        }
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
    expect(novo).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Comandos' }));
    expect(cmd).toHaveBeenCalled();
  });
});

describe('AgentComposer split', () => {
  function Split(props: Omit<AgentComposerProps, 'value' | 'onChange' | 'variant'>) {
    const [value, setValue] = useState('');
    return <AgentComposer {...props} variant="split" value={value} onChange={setValue} />;
  }

  it('voz fica fixa na barra; o enviar fica na caixa e vira parar respondendo', () => {
    const voice = vi.fn();
    const onSend = vi.fn();
    const { unmount } = wrap(
      <Split onSend={onSend} hint="Enter envia" idleAction={{ label: 'Conversar por voz', icon: <i />, onClick: voice }} />
    );
    expect(screen.queryByText('Enter envia')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Conversar por voz' }));
    expect(voice).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Enviar mensagem' }).hasAttribute('disabled')).toBe(true);
    fireEvent.change(box(), { target: { value: 'oi' } });
    expect(screen.getByRole('button', { name: 'Conversar por voz' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(onSend).toHaveBeenCalledWith('oi', []);
    unmount();
    const onStop = vi.fn();
    wrap(<Split onSend={vi.fn()} busy onStop={onStop} />);
    fireEvent.click(screen.getByRole('button', { name: 'Parar resposta' }));
    expect(onStop).toHaveBeenCalled();
  });
});
