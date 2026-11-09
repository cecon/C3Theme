// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it } from 'vitest';

import AgentStrip from './AgentStrip';
import { notchRowSx, notchSideSx, notchWidth } from './notch';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const latest = { name: 'Atendente', avatar: <span />, state: 'talking' as const, activity: 'Atendente respondendo a Marina' };
const strip = (notch?: number) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <AgentStrip latest={latest} requests={[]} notch={notch} width={560} />
      </IntlProvider>
    </ThemeProvider>
  );

describe('AgentStrip com entalhe', () => {
  it('só número finito maior que zero abre o vão', () => {
    expect(notchWidth(undefined)).toBe(0);
    expect(notchWidth(0)).toBe(0);
    expect(notchWidth(-10)).toBe(0);
    expect(notchWidth(Number.NaN)).toBe(0);
    expect(notchWidth(Number.POSITIVE_INFINITY)).toBe(0);
    expect(notchWidth(199.6)).toBe(200);
  });

  it('três colunas com o vão do tamanho do entalhe, recortado do botão no meio', () => {
    const row = notchRowSx(200);
    expect(row.gridTemplateColumns).toBe('minmax(0, 1fr) 200px minmax(0, 1fr)');
    expect(row.clipPath).toBe(
      'polygon(0 0, calc(50% - 100px) 0, calc(50% - 100px) 100%, calc(50% + 100px) 100%, calc(50% + 100px) 0, 100% 0, 100% 100%, 0 100%)'
    );
    expect(notchSideSx(200, 'start')).toMatchObject({ gridColumn: 1, minWidth: 0 });
    expect(notchSideSx(200, 'end')).toMatchObject({ gridColumn: 3, justifyContent: 'flex-end' });
    // sem entalhe os lados somem do layout e a linha continua o flex de antes
    expect(notchSideSx(0, 'start')).toEqual({ display: 'contents' });
  });

  it('com ou sem entalhe: um botão só, e o leitor de tela lê na mesma ordem', () => {
    strip();
    const plain = screen.getByRole('button');
    const before = plain.textContent;
    cleanup();
    strip(200);
    const notched = screen.getAllByRole('button');
    expect(notched).toHaveLength(1);
    expect(notched[0]!.textContent).toBe(before);
    expect(before).toMatch(/^Atendente respondendo a Marina.*pend/);
  });
});
