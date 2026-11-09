// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FlowCanvasProps } from '../canvas/port';
import { FLOW, TYPES } from '../core/fixture.test-utils';
import type { FlowGraph } from '../core/types';
import FlowEditor from './FlowEditor';

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

// adaptador de mentira na porta do canvas: prova que o editor não depende do React Flow e deixa disparar os eventos
let canvas: FlowCanvasProps;
function StubCanvas(props: FlowCanvasProps) {
  canvas = props;
  return (
    <ul>
      {props.nodes.map((n) => (
        <li key={n.id} aria-label={n.ariaLabel}>
          <button onClick={() => props.onSelect(n.id)}>{n.id}</button>
        </li>
      ))}
    </ul>
  );
}

const editor = (onChange = vi.fn<(g: FlowGraph) => void>(), extra = {}) => {
  wrap(<FlowEditor value={FLOW} onChange={onChange} kinds={TYPES} canvas={StubCanvas} {...extra} />);
  return onChange;
};

describe('FlowEditor', () => {
  it('liga, move e remove pelos eventos do canvas, devolvendo o grafo no onChange', () => {
    const onChange = editor();
    canvas.onConnect('confirmado', 'nao', 'cozinha');
    expect(onChange.mock.lastCall![0].edges.find((e) => e.source === 'confirmado' && e.sourcePort === 'nao')?.target).toBe('cozinha');
    canvas.onMove('fim', { x: 9, y: 9 });
    expect(onChange.mock.lastCall![0].nodes.find((n) => n.id === 'fim')?.position).toEqual({ x: 9, y: 9 });
    canvas.onRemove(['cozinha'], ['e1']);
    const g = onChange.mock.lastCall![0];
    expect(g.nodes.map((n) => n.id)).not.toContain('cozinha');
    expect(g.edges.map((e) => e.id)).toEqual(['e2', 'e4']);
  });

  it('marca o problema no nó (rótulo acessível) e conta na barra', () => {
    wrap(<FlowEditor value={{ ...FLOW, edges: FLOW.edges.filter((e) => e.id !== 'e4') }} kinds={TYPES} canvas={StubCanvas} />);
    expect(screen.getByLabelText(/Condição.*Saída "não" sem ligação/)).toBeTruthy();
    expect(screen.getByText('1 problema')).toBeTruthy();
  });

  it('o painel do passo liga a saída pelo menu, sem arrastar', () => {
    const onChange = editor();
    fireEvent.click(screen.getByRole('button', { name: 'confirmado' }));
    const panel = screen.getByRole('region', { name: 'Condição' });
    fireEvent.mouseDown(within(panel).getByRole('combobox', { name: /"não"/ }));
    fireEvent.click(screen.getAllByRole('option', { name: 'Agente' })[1]); // atendente, cozinha (sem rótulo, vale o do tipo)
    expect(onChange.mock.lastCall![0].edges.find((e) => e.source === 'confirmado' && e.sourcePort === 'nao')?.target).toBe('cozinha');
    fireEvent.mouseDown(within(panel).getByRole('combobox', { name: /"sim"/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Sem ligação' }));
    expect(onChange.mock.lastCall![0].edges.some((e) => e.source === 'confirmado' && e.sourcePort === 'sim')).toBe(false);
  });

  it('sem onChange fica só leitura: sem adicionar, organizar nem remover', () => {
    wrap(<FlowEditor value={FLOW} kinds={TYPES} canvas={StubCanvas} run={{ status: { zap: 'done', atendente: 'running' } }} />);
    expect(canvas.readOnly).toBe(true);
    expect(screen.queryByRole('button', { name: 'Adicionar passo' })).toBeNull();
    expect(screen.getByText('1 em andamento')).toBeTruthy();
    expect(canvas.edges.find((e) => e.id === 'e1')?.tone).toBe('active');
    fireEvent.click(screen.getByRole('button', { name: 'atendente' }));
    expect(screen.queryByRole('button', { name: 'Remover passo' })).toBeNull();
  });

  it('adicionar com passo selecionado já liga na saída livre dele', () => {
    const onChange = editor(undefined, { value: { ...FLOW, edges: FLOW.edges.filter((e) => e.id !== 'e5') } });
    fireEvent.click(screen.getByRole('button', { name: 'cozinha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar passo' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fim' }));
    const g = onChange.mock.lastCall![0];
    expect(g.nodes.at(-1)?.id).toBe('fim-1');
    expect(g.edges.at(-1)).toMatchObject({ source: 'cozinha', sourcePort: 'out', target: 'fim-1' });
  });

  it('tipo com max some do menu no limite; removable: false não sai pelo Delete nem pelo painel', () => {
    const kinds = TYPES.map((k) => (k.type === 'gatilho' ? { ...k, max: 1, removable: false } : k));
    const onChange = editor(undefined, { kinds });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar passo' }));
    expect(screen.queryByRole('menuitem', { name: 'Gatilho' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Agente' })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    canvas.onRemove(['zap', 'fim'], []);
    expect(onChange.mock.lastCall![0].nodes.map((n) => n.id)).toEqual(['zap', 'atendente', 'confirmado', 'cozinha']);
    onChange.mockClear();
    canvas.onRemove(['zap'], []);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'zap' }));
    expect(screen.queryByRole('button', { name: 'Remover passo' })).toBeNull();
  });

  it('passo novo entra com o config de defaults', () => {
    const kinds = TYPES.map((k) => (k.type === 'agente' ? { ...k, defaults: () => ({ agente: 'Atendente' }) } : k));
    const onChange = editor(undefined, { kinds });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar passo' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Agente' }));
    expect(onChange.mock.lastCall![0].nodes.at(-1)).toMatchObject({ id: 'agente-1', config: { agente: 'Atendente' } });
  });

  it('seleção controlada: o app abre o passo e fica sabendo quando muda', () => {
    const onSelectedChange = vi.fn();
    editor(undefined, { selectedId: 'cozinha', onSelectedChange });
    expect(screen.getByRole('region', { name: 'Agente' })).toBeTruthy();
    expect(canvas.selectedId).toBe('cozinha');
    fireEvent.click(screen.getByRole('button', { name: 'zap' }));
    expect(onSelectedChange).toHaveBeenLastCalledWith('zap');
    // controlado: só muda quando o app passar o novo id
    expect(canvas.selectedId).toBe('cozinha');
  });

  it('problemas do app marcam o nó e somam na barra', () => {
    editor(undefined, { extraIssues: [{ nodeId: 'cozinha', message: 'Agente desativado' }] });
    expect(screen.getByLabelText(/Agente desativado/)).toBeTruthy();
    expect(screen.getByText('1 problema')).toBeTruthy();
  });
});
