// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import useMessageQueue from '../hooks/useMessageQueue';
import AgentComposer, { type AgentComposerProps } from './AgentComposer';
import ComposerSelect from './ComposerSelect';
import StatusLine from './StatusLine';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const wrap = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

function Controlled(props: Omit<AgentComposerProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState('');
  return <AgentComposer {...props} value={value} onChange={setValue} />;
}

const box = () => screen.getByRole('textbox', { name: 'Mensagem' });

describe('AgentComposer', () => {
  it('Enter envia; Shift+Enter não', () => {
    const onSend = vi.fn();
    wrap(<Controlled onSend={onSend} />);
    fireEvent.change(box(), { target: { value: 'oi' } });
    fireEvent.keyDown(box(), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('oi', []);
  });

  it('respondendo: Enter põe na fila e limpa; Esc e o botão param', () => {
    const onSend = vi.fn();
    const onStop = vi.fn();
    const { result } = renderHook(() => useMessageQueue({ generating: true, send: onSend }));
    wrap(<Controlled onSend={onSend} onStop={onStop} busy queue={result.current} />);
    fireEvent.change(box(), { target: { value: 'próxima' } });
    expect(screen.getByRole('button', { name: 'Pôr na fila' })).toBeTruthy();
    act(() => void fireEvent.keyDown(box(), { key: 'Enter' }));
    expect(onSend).not.toHaveBeenCalled();
    expect(result.current.items.map((q) => q.text)).toEqual(['próxima']);
    expect((box() as HTMLTextAreaElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Parar resposta' }));
    fireEvent.keyDown(box(), { key: 'Escape' });
    expect(onStop).toHaveBeenCalledTimes(2);
  });

  it('a fila aparece acima, dá para editar e tirar', () => {
    const queue = {
      items: [{ id: 'q1', text: 'depois', files: [] }],
      enqueue: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      sendNow: vi.fn(),
      steer: vi.fn(),
      steerNext: vi.fn(),
      canSteer: false,
      pause: vi.fn()
    };
    wrap(<Controlled onSend={vi.fn()} queue={queue} />);
    expect(screen.getByText('depois')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar agora' }));
    expect(queue.sendNow).toHaveBeenCalledWith('q1');
    fireEvent.click(screen.getByRole('button', { name: 'Editar mensagem da fila' }));
    const edit = screen.getByRole('textbox', { name: 'Editar mensagem da fila' });
    fireEvent.change(edit, { target: { value: 'depois, editada' } });
    fireEvent.keyDown(edit, { key: 'Enter' });
    expect(queue.update).toHaveBeenCalledWith('q1', 'depois, editada');
    fireEvent.click(screen.getByRole('button', { name: 'Tirar da fila' }));
    expect(queue.remove).toHaveBeenCalledWith('q1');
  });

  it('o + abre o menu com os itens do app', () => {
    const onClick = vi.fn();
    wrap(<Controlled onSend={vi.fn()} addItems={[{ id: 'cmd', label: 'Comandos', onClick }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Comandos' }));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('ComposerSelect e StatusLine', () => {
  it('escolhe outra opção pelo menu', () => {
    const onChange = vi.fn();
    const options = [
      { value: 'ask', label: 'Perguntar antes' },
      { value: 'full', label: 'Acesso total', description: 'Age sem perguntar' }
    ];
    wrap(<ComposerSelect label="Modo" value="ask" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Modo: Perguntar antes' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Acesso total/ }));
    expect(onChange).toHaveBeenCalledWith('full');
  });

  it('mostra os itens e o progresso limitado a 0..100', () => {
    wrap(<StatusLine items={[{ id: 't', label: '41 turnos' }]} progress={130} progressLabel="Contexto usado" />);
    expect(screen.getByText('41 turnos')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
  });
});
