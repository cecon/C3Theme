// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ModelGroup } from '../core/models';
import ModelPicker, { type ModelPickerProps } from './ModelPicker';

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

const GROUPS: ModelGroup[] = [
  {
    id: 'opencode',
    label: 'OpenCode',
    options: [
      { value: 'oc/grok', label: 'Grok Code', flags: ['free'] },
      { value: 'oc/qwen', label: 'Qwen Coder', flags: ['free'] }
    ]
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    status: { label: 'Precisa entrar', tone: 'warning' },
    unavailable: 'Entre na Anthropic para usar',
    options: [{ value: 'an/sonnet', label: 'Claude Sonnet' }]
  },
  { id: 'ollama', label: 'Ollama', options: [{ value: 'ol/llama', label: 'Llama Média', flags: ['local'] }] }
];

function Controlled(props: Partial<ModelPickerProps> & { withFallback?: boolean; onPick?: (v: string) => void }) {
  const [value, setValue] = useState<string | null>(props.value ?? 'oc/grok');
  const [fallback, setFallback] = useState<string | null>('ol/llama');
  return (
    <ModelPicker
      groups={GROUPS}
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v);
        props.onPick?.(v);
      }}
      fallback={props.withFallback ? { value: fallback, onChange: setFallback } : undefined}
    />
  );
}

const search = () => screen.getByRole('combobox', { name: 'Buscar modelo' });
const active = () => document.getElementById(search().getAttribute('aria-activedescendant') ?? '');

describe('ModelPicker', () => {
  it('mostra grupos por provedor, etiquetas e o motivo da opção indisponível', () => {
    wrap(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: /^Modelo:\s?Grok Code/ }));
    expect(screen.getByRole('group', { name: 'Anthropic, Precisa entrar' })).toBeTruthy();
    const sonnet = screen.getByRole('option', { name: /Claude Sonnet/ });
    expect(sonnet.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById(sonnet.getAttribute('aria-describedby')!)?.textContent).toBe('Entre na Anthropic para usar');
    expect(screen.getByRole('option', { name: /Grok Code/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getAllByText('Grátis').length).toBeGreaterThan(0);
  });

  it('setas pulam a indisponível e Enter escolhe', () => {
    const onPick = vi.fn();
    wrap(<Controlled onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: /^Modelo:\s?Grok Code/ }));
    expect(active()?.textContent).toContain('Grok Code');
    fireEvent.keyDown(search(), { key: 'ArrowDown' });
    fireEvent.keyDown(search(), { key: 'ArrowDown' });
    expect(active()?.textContent).toContain('Llama Média');
    fireEvent.keyDown(search(), { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith('ol/llama');
  });

  it('digitar no gatilho abre já buscando; sem resultado avisa', () => {
    const onPick = vi.fn();
    wrap(<Controlled onPick={onPick} variant="field" />);
    const field = screen.getByRole('combobox', { name: 'Modelo' });
    fireEvent.keyDown(field, { key: 'q' });
    expect((search() as HTMLInputElement).value).toBe('q');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([expect.stringContaining('Qwen Coder')]);
    expect(screen.getByRole('status').textContent).toBe('1 modelo');
    fireEvent.change(search(), { target: { value: 'medIA' } });
    fireEvent.keyDown(search(), { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith('ol/llama');
    fireEvent.keyDown(field, { key: 'z' });
    expect(screen.getByText('Nenhum modelo com “z”')).toBeTruthy();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('reserva não lista o principal e é limpo quando vira o principal', () => {
    wrap(<Controlled withFallback />);
    fireEvent.click(screen.getByRole('button', { name: /^Reserva\s?Llama Média/ }));
    const names = screen.getAllByRole('option').map((o) => o.textContent);
    expect(names.some((n) => n?.includes('Grok Code'))).toBe(false);
    expect(names.some((n) => n?.includes('Claude Sonnet'))).toBe(false);
    expect(names[0]).toContain('Sem reserva');
    expect(screen.getAllByRole('group').every((g) => g.getAttribute('aria-label'))).toBe(true);
    act(() => void fireEvent.keyDown(search(), { key: 'Escape' }));
    fireEvent.click(screen.getByRole('button', { name: /^Modelo:\s?Grok Code/ }));
    fireEvent.click(screen.getByRole('option', { name: /Llama Média/ }));
    expect(screen.getByRole('button', { name: /^Reserva\s?Sem reserva/ })).toBeTruthy();
  });
});
