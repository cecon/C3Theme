// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import Button from '@mui/material/Button';

import Panel from './Panel';

afterEach(cleanup);

describe('Panel', () => {
  it('sem footer, o corpo é filho direto do Paper e o Paper não vira coluna flex', () => {
    const { container } = render(<Panel title="Equipe">corpo</Panel>);
    const paper = container.firstElementChild as HTMLElement;
    expect(getComputedStyle(paper).display).not.toBe('flex');
  });

  it('com footer, as ações vêm depois do corpo e descem com mt auto num Paper em coluna', () => {
    const { container } = render(
      <Panel title="Idiomas" footer={<Button>Exportar textos</Button>}>
        corpo
      </Panel>
    );
    const paper = container.firstElementChild as HTMLElement;
    expect(getComputedStyle(paper).display).toBe('flex');
    expect(getComputedStyle(paper).flexDirection).toBe('column');
    const footer = screen.getByRole('button', { name: 'Exportar textos' }).parentElement as HTMLElement;
    expect(footer.parentElement).toBe(paper);
    expect(paper.lastElementChild).toBe(footer);
    expect(getComputedStyle(footer).marginTop).toBe('auto');
  });

  it('footer null não cria rodapé', () => {
    const { container } = render(<Panel footer={null}>corpo</Panel>);
    expect((container.firstElementChild as HTMLElement).childElementCount).toBe(1);
  });
});
