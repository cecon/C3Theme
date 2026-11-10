// @vitest-environment jsdom
// Filtro no input da ação (#40): a escolha que depende de outro campo (`{"$field": ...}`) limpa quando ele muda,
// no campo simples e na mesma linha da grade.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ActionDef } from '../actionTypes';
import useActionInput from './useActionInput';

const byCompany = { field: 'company_id', op: 'eq', value: { $field: 'company' } } as const;
const referrals = {
  name: 'referrals',
  label: 'Indicações',
  target: 'list',
  input: {
    fields: [
      { name: 'company', type: 'reference', entity: 'company' },
      { name: 'referrer', type: 'reference', entity: 'customer', filter: byCompany },
      {
        name: 'links',
        type: 'grid',
        label: 'Indicados',
        fields: [
          { name: 'company', type: 'reference', entity: 'company' },
          { name: 'customer', type: 'reference', entity: 'customer', filter: byCompany }
        ]
      }
    ]
  }
} as unknown as ActionDef;

describe('useActionInput com filtro dependente', () => {
  it('limpa a escolha dependente no campo e só na linha que mudou', () => {
    const { result } = renderHook(() => useActionInput(referrals));
    const ana = { id: '1', title: 'Ana' };
    act(() =>
      result.current.reset(referrals, {
        company: '7',
        referrer: ana,
        links: [
          { company: '7', customer: ana },
          { company: '7', customer: ana }
        ]
      })
    );
    act(() => result.current.change('company', '8'));
    expect(result.current.input.referrer).toBeNull();
    act(() => result.current.changeCell('links', 1, 'company', '8'));
    expect(result.current.input.links).toEqual([
      { company: '7', customer: ana },
      { company: '8', customer: null }
    ]);
  });
});
