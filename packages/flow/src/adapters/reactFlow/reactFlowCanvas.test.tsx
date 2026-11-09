// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { FLOW, TYPES } from '../../core/fixture.test-utils';
import type { FlowGraph } from '../../core/types';
import FlowEditor from '../../ui/FlowEditor';
import { edgeColor } from './canvasSx';

// O React Flow mede os nós com ResizeObserver, DOMMatrix e offsetWidth/Height, que o jsdom não tem: medida fixa
// basta para desenhar nós e ligações (receita da documentação do React Flow para testes).
beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetWidth: { configurable: true, get: () => 220 },
    offsetHeight: { configurable: true, get: () => 80 }
  });
  globalThis.ResizeObserver = class {
    constructor(private readonly cb: ResizeObserverCallback) {}
    observe(target: Element) {
      this.cb([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  globalThis.DOMMatrixReadOnly ??= class {
    m22 = 1;
  } as unknown as typeof DOMMatrixReadOnly;
});
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

const nodeEl = (id: string) => document.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement;

describe('ReactFlowCanvas (adaptador padrão do editor)', () => {
  it('desenha cada passo com o cartão, a entrada e uma saída por porta, com o rótulo da porta', () => {
    const { container } = wrap(<FlowEditor value={FLOW} kinds={TYPES} />);
    expect(screen.getByRole('region', { name: 'Fluxo de trabalho' })).toBeTruthy();
    expect(container.querySelectorAll('.react-flow__node')).toHaveLength(FLOW.nodes.length);
    const condicao = nodeEl('confirmado');
    expect(condicao.querySelectorAll('.react-flow__handle.target')).toHaveLength(1);
    expect(condicao.querySelectorAll('.react-flow__handle.source')).toHaveLength(2);
    expect(condicao.textContent).toContain('sim');
    expect(condicao.textContent).toContain('não');
    // gatilho não tem entrada; fim não tem saída
    expect(nodeEl('zap').querySelectorAll('.react-flow__handle.target')).toHaveLength(0);
    expect(nodeEl('fim').querySelectorAll('.react-flow__handle.source')).toHaveLength(0);
  });

  it('só leitura: passos sem arraste nem ligação nova, com os controles de zoom em português', () => {
    const { container } = wrap(<FlowEditor value={FLOW} kinds={TYPES} />);
    expect(container.querySelector('.react-flow__node.draggable')).toBeNull();
    expect(container.querySelector('.react-flow__handle.connectable')).toBeNull();
    expect(screen.getByRole('button', { name: 'Aproximar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ajustar à tela' })).toBeTruthy();
    expect(screen.getByLabelText('Minimapa do fluxo')).toBeTruthy();
  });

  it('editável: clicar no passo seleciona e abre o painel; Delete remove o passo e as ligações dele num onChange só', async () => {
    const onChange = vi.fn<(g: FlowGraph) => void>();
    const { container } = wrap(<FlowEditor value={FLOW} onChange={onChange} kinds={TYPES} minimap={false} />);
    expect(container.querySelector('.react-flow__node.draggable')).toBeTruthy();
    expect(screen.queryByLabelText('Minimapa do fluxo')).toBeNull();
    const cozinha = nodeEl('cozinha');
    act(() => {
      fireEvent.click(cozinha);
    });
    expect(screen.getByRole('region', { name: 'Agente' })).toBeTruthy();
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Delete', code: 'Delete' });
    });
    // o React Flow apaga de forma assíncrona (deleteElements devolve promessa)
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const g = onChange.mock.lastCall?.[0];
    expect(g?.nodes.map((n) => n.id)).not.toContain('cozinha');
    expect(g?.edges.some((e) => e.source === 'cozinha' || e.target === 'cozinha')).toBe(false);
  });

  it('pinta a ligação pela situação da execução', () => {
    const { container } = wrap(<FlowEditor value={FLOW} kinds={TYPES} run={{ status: { zap: 'done', atendente: 'running' } }} />);
    expect(container.querySelector('.react-flow__edge.animated')).toBeTruthy();
    expect(edgeColor(theme, 'failed')).toBe(theme.vars.palette.error.main);
    expect(edgeColor(theme, 'traversed')).toBe(theme.vars.palette.primary.main);
    expect(edgeColor(theme, 'default')).toBe(theme.vars.palette.text.disabled);
  });
});
