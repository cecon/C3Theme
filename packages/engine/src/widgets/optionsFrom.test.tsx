// @vitest-environment jsdom
// `optionsFrom` (#30): as opções vêm do próprio registro; sem lista, o campo é texto livre.
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it } from 'vitest';

import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import { recordOptions } from '../format';
import { Cell } from '../pages/list/Cell';
import type { FieldDef, WireRecord } from '../types';
import FieldInput from './FieldInput';

afterEach(cleanup);

const field = { name: 'value', type: 'string', label: 'Valor', optionsFrom: 'options' } as FieldDef;
const list = JSON.stringify([
  { value: 'none', label: 'Não arredonda' },
  { value: '5c', label: 'Para 5 centavos' },
  { value: 7, label: 'número não vale' },
  { value: 'sem_label' }
]);

function show(record: WireRecord, readOnly = false) {
  const value = { client: {} as C3Client, app: { name: 'demo' } as never, entities: {}, components: {} };
  render(
    <ThemeProvider theme={createTheme()}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={value}>
          <FieldInput field={field} value={record.value} onChange={() => {}} record={record} readOnly={readOnly} />
        </EngineProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}

describe('optionsFrom', () => {
  it('lê a lista do registro: só value string, label cai no value; vazio, [] e texto solto não são lista', () => {
    expect(recordOptions(field, { options: list })).toEqual([
      { value: 'none', label: 'Não arredonda' },
      { value: '5c', label: 'Para 5 centavos' },
      { value: 'sem_label', label: 'sem_label' }
    ]);
    for (const options of [null, '', '[]', 'texto', '{"value":"a"}']) expect(recordOptions(field, { options })).toBeUndefined();
    expect(recordOptions({ ...field, optionsFrom: undefined }, { options: list })).toBeUndefined();
  });

  it('com lista vira select; sem lista, texto livre; só leitura e lista mostram o label', () => {
    show({ options: list, value: '5c' });
    expect(screen.getByRole('combobox')).toBeTruthy();
    cleanup();
    show({ options: null, value: 'livre' });
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByDisplayValue('livre')).toBeTruthy();
    cleanup();
    show({ options: list, value: '5c' }, true);
    expect(screen.getByDisplayValue('Para 5 centavos')).toBeTruthy();
    cleanup();
    render(<Cell field={field} row={{ options: list, value: 'none' }} locale="pt-BR" optionLabel={(v) => v} />);
    expect(document.body.textContent).toContain('Não arredonda');
  });
});
