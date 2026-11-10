// @vitest-environment jsdom
// Colar imagem e arrastar arquivos para anexar (#172), no Composer e no AgentComposer.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useRef, useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AgentComposer from './AgentComposer';
import Composer from './Composer';

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

const png = new File(['png'], 'image.png', { type: 'image/png' });
const txt = new File(['texto'], 'nota.txt', { type: 'text/plain' });
const box = () => screen.getByRole('textbox', { name: 'Mensagem' });
const drag = (el: Element, type: 'dragEnter' | 'dragLeave' | 'drop', files: File[] = []) =>
  fireEvent[type](el, { dataTransfer: { types: ['Files'], files } });

function Agent(props: { onSend: (t: string, f: File[]) => void; accept?: string; disabled?: boolean; chatArea?: boolean }) {
  const [value, setValue] = useState('');
  const area = useRef<HTMLDivElement>(null);
  return (
    <div ref={area} data-testid="area">
      <AgentComposer
        value={value}
        onChange={setValue}
        onSend={props.onSend}
        accept={props.accept}
        disabled={props.disabled}
        dropTarget={props.chatArea ? area : undefined}
      />
    </div>
  );
}

describe('anexar colando ou soltando', () => {
  it('colar um print no texto vira anexo; colar texto não', () => {
    const onSend = vi.fn();
    wrap(<Agent onSend={onSend} />);
    fireEvent.paste(box(), { clipboardData: { files: [] } });
    expect(screen.queryByText(/image\.png/)).toBeNull();
    fireEvent.paste(box(), { clipboardData: { files: [png] } });
    fireEvent.paste(box(), { clipboardData: { files: [png] } });
    expect(screen.getAllByText(/image\.png/)).toHaveLength(1);
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('', [png]);
  });

  it('soltar na área do chat anexa, com realce e respeitando o accept', () => {
    wrap(<Agent onSend={vi.fn()} accept="image/*" chatArea />);
    const area = screen.getByTestId('area');
    drag(area, 'dragEnter');
    expect(screen.getByText('Solte para anexar')).toBeTruthy();
    drag(area, 'drop', [png, txt]);
    expect(screen.queryByText('Solte para anexar')).toBeNull();
    expect(screen.getByText(/image\.png/)).toBeTruthy();
    expect(screen.queryByText(/nota\.txt/)).toBeNull();
  });

  it('Composer desligado não anexa; ligado aceita soltar na própria caixa', () => {
    const { container, unmount } = wrap(<Composer value="" onChange={() => {}} onSend={() => {}} disabled />);
    const root = container.querySelector('textarea')!.closest('.MuiBox-root')!;
    drag(root, 'drop', [png]);
    fireEvent.paste(box(), { clipboardData: { files: [png] } });
    expect(screen.queryByText(/image\.png/)).toBeNull();
    unmount();
    const ok = wrap(<Composer value="" onChange={() => {}} onSend={() => {}} />);
    const r = ok.container.querySelector('textarea')!.closest('.MuiBox-root')!;
    drag(r, 'dragEnter');
    drag(r, 'dragLeave');
    expect(screen.queryByText('Solte para anexar')).toBeNull();
    drag(r, 'drop', [txt]);
    expect(screen.getByText(/nota\.txt/)).toBeTruthy();
  });
});
