// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ArgField } from '../../core/hitl';
import ArgsEditor from './ArgsEditor';
import ArgsSummary from './ArgsSummary';
import { wrap } from './hitl.test-utils';

afterEach(cleanup);

const fields: ArgField[] = [
  { name: 'nome', type: 'string', required: true },
  { name: 'obs', type: 'text' },
  { name: 'qtd', type: 'number' },
  { name: 'dados', type: 'json' },
  { name: 'ok', type: 'boolean' }
];

const input = (name: string | RegExp) => screen.getByLabelText(name) as HTMLInputElement | HTMLTextAreaElement;

describe('ArgsEditor', () => {
  it('cada tipo no campo certo', () => {
    wrap(<ArgsEditor fields={fields} drafts={{ nome: 'a', obs: 'b', qtd: '1', dados: '{}', ok: true }} errors={{}} onChange={vi.fn()} />);
    expect(input(/nome/).tagName).toBe('INPUT');
    expect(input(/nome/).required).toBe(true);
    expect(input(/nome/).getAttribute('spellcheck')).toBe('true');
    expect(input(/nome/).getAttribute('inputmode')).toBeNull();
    expect(input('obs').tagName).toBe('TEXTAREA');
    expect(input('qtd').tagName).toBe('INPUT');
    expect(input('qtd').getAttribute('inputmode')).toBe('decimal');
    expect(input('dados').tagName).toBe('TEXTAREA');
    expect(input('dados').getAttribute('spellcheck')).toBe('false');
    expect(input('dados').getAttribute('aria-invalid')).toBe('false');
    expect((screen.getByRole('switch', { name: 'ok' }) as HTMLInputElement).checked).toBe(true);
  });

  it('rascunho que não é texto fica vazio; erro aparece no campo', () => {
    wrap(<ArgsEditor fields={fields} drafts={{ nome: true, ok: 'sim' }} errors={{ dados: 'json' }} onChange={vi.fn()} />);
    expect(input(/nome/).value).toBe('');
    expect((screen.getByRole('switch', { name: 'ok' }) as HTMLInputElement).checked).toBe(false);
    expect(input('dados').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('JSON inválido')).toBeTruthy();
  });

  it('avisa a mudança pelo nome; travado não muda', () => {
    const onChange = vi.fn();
    wrap(<ArgsEditor fields={fields} drafts={{}} errors={{}} onChange={onChange} />);
    fireEvent.change(input('qtd'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('switch', { name: 'ok' }));
    expect(onChange.mock.calls).toEqual([
      ['qtd', '2'],
      ['ok', true]
    ]);
    cleanup();
    wrap(<ArgsEditor fields={fields} drafts={{}} errors={{}} onChange={vi.fn()} disabled />);
    expect(input('qtd').disabled).toBe(true);
    expect((screen.getByRole('switch', { name: 'ok' }) as HTMLInputElement).disabled).toBe(true);
  });
});

describe('ArgsSummary', () => {
  it('rótulo ou nome, valor em texto e a marca do que mudou', () => {
    const { container } = wrap(
      <ArgsSummary
        fields={[
          { name: 'a', label: 'Cliente', type: 'string' },
          { name: 'b', type: 'json' },
          { name: 'c', type: 'string' }
        ]}
        args={{ a: 'Ana', b: { x: 1 } }}
        edited={['b']}
      />
    );
    expect(screen.getByText('Cliente')).toBeTruthy();
    expect(screen.queryByText('a')).toBeNull();
    expect(screen.queryByText('c')).toBeNull();
    const dd = container.querySelectorAll('dd');
    expect(dd).toHaveLength(2);
    expect(dd[0].textContent).toBe('Ana');
    expect(dd[0].hasAttribute('data-edited')).toBe(false);
    expect(dd[1].textContent).toBe('{"x":1}');
    expect(dd[1].hasAttribute('data-edited')).toBe(true);
  });

  it('sem valor nenhum, nada', () => {
    const { container } = wrap(<ArgsSummary fields={[{ name: 'a', type: 'string' }]} args={{}} />);
    expect(container.querySelector('dl')).toBeNull();
  });
});
