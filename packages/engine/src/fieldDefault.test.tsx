// @vitest-environment jsdom
// Default numérico de decimal (#47): vira texto na escala do campo, e a grade do input adiciona a linha sem quebrar.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useEffect } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { C3Client } from './api';
import { EngineProvider } from './context';
import { defaultsOf, fieldDefault } from './fieldDefault';
import useActionInput from './hooks/useActionInput';
import type { ActionDef, FieldDef } from './types';
import GridInput from './widgets/GridInput';

afterEach(cleanup);

const dec = (d: unknown, scale?: number) => ({ name: 'fator', type: 'decimal', default: d, scale }) as FieldDef;

describe('default no formato trafegado', () => {
  it('decimal numérico vira texto na escala; o resto passa', () => {
    expect(fieldDefault(dec(1, 4))).toBe('1.0000');
    expect(fieldDefault(dec(2.5))).toBe('2.5');
    expect(fieldDefault(dec('3.00', 2))).toBe('3.00');
    expect(fieldDefault({ name: 'n', type: 'integer', default: 1 } as FieldDef)).toBe(1);
    const fields = [dec(1, 2), { name: 'x', type: 'string', default: 'a', readOnly: true }, { name: 'y', type: 'string' }] as FieldDef[];
    expect(defaultsOf(fields)).toEqual({ fator: '1.00', x: 'a' });
    expect(defaultsOf(fields, true)).toEqual({ fator: '1.00' });
  });

  it('Adicionar linha com decimal de default 1 mostra o valor e não quebra', () => {
    const action = {
      name: 'converter',
      label: 'Converter',
      input: { fields: [{ name: 'itens', type: 'grid', label: 'Itens', fields: [dec(1, 4) as never] }] }
    } as unknown as ActionDef;
    function Harness() {
      const form = useActionInput(action);
      useEffect(() => form.reset(action), []); // eslint-disable-line react-hooks/exhaustive-deps
      return form.grids[0] ? <GridInput grid={form.grids[0]} form={form} error={() => undefined} /> : null;
    }
    const value = { client: {} as C3Client, app: { name: 'demo' } as never, entities: {}, components: {} };
    render(
      <ThemeProvider theme={createTheme()}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <EngineProvider value={value}>
            <Harness />
          </EngineProvider>
        </IntlProvider>
      </ThemeProvider>
    );
    fireEvent.click(document.querySelector('button')!);
    const cell = document.querySelector<HTMLInputElement>('[data-cell="0:fator"] input')!;
    expect(cell.value).toBe('1,0000');
  });
});
