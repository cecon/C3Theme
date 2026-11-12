// @vitest-environment jsdom
// Prévia com texto pré-formatado (#66): a coluna `format: "pre"` mantém os espaços do cupom e não quebra a linha.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ActionPreviewPanel from './ActionPreviewPanel';

afterEach(cleanup);

const cupom = ['R E L .   E N T R E G A S', '#1041 Ana Souza ........... 58,90'];

describe('prévia pré-formatada', () => {
  it('a coluna pre guarda o texto como veio, em fonte fixa e sem quebrar', () => {
    render(
      <ActionPreviewPanel
        state={{
          loading: false,
          data: {
            table: {
              columns: [
                { name: 'linha', label: 'Relação', format: 'pre' },
                { name: 'obs', label: 'Obs.' }
              ],
              rows: cupom.map((linha) => ({ linha, obs: 'a  b' }))
            }
          }
        }}
      />
    );
    const cell = screen.getByText((_, el) => el?.tagName === 'TD' && el.textContent === cupom[0]);
    expect(cell.textContent).toBe(cupom[0]);
    const style = getComputedStyle(cell);
    expect(style.whiteSpace).toBe('pre');
    expect(style.fontFamily).toContain('monospace');
    const plain = screen.getAllByText('a b', { normalizer: (s) => s.replace(/\s+/g, ' ') })[0];
    expect(getComputedStyle(plain).whiteSpace).not.toBe('pre');
  });
});
