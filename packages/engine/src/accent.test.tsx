// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { createC3Theme } from '@c3theme/ui';
import { MemoryRouter } from 'react-router';
import { IntlProvider } from 'react-intl';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolveAccent } from './accent';
import { listColumns } from './pages/list/listColumns';
import { ColumnCell } from './pages/list/ColumnCell';
import type { EntityDef } from './types';
import { checkAccentColumns } from '../../../scripts/spec-accents.mjs';

afterEach(cleanup);
const fixture = JSON.parse(readFileSync('apps/storybook/src/motor/spec/agente.json', 'utf8')) as EntityDef;

describe('cor nomeada declarada na lista', () => {
  it('resolve valor fixo, campo com mapa e campo direto; sem correspondência usa o tom normal', () => {
    expect(resolveAccent('accent:forge', {})).toBe('accent:forge');
    expect(resolveAccent(undefined, {})).toBeUndefined();
    expect(resolveAccent({ field: 'cor' }, { cor: 'accent:forge' })).toBe('accent:forge');
    expect(resolveAccent({ field: 'cor' }, {})).toBeUndefined();
    expect(resolveAccent({ field: 'cargo', map: { forge: 'accent:forge' } }, { cargo: 'forge' })).toBe('accent:forge');
    expect(resolveAccent({ field: 'cargo', map: {} }, { cargo: 'forge' })).toBeUndefined();
  });

  it.each([false, true])('a spec monta avatar e selo sem renderizador do app (segunda linha: %s)', (secondLine) => {
    const ajv = new Ajv({ strict: false });
    addFormats(ajv);
    const schema = JSON.parse(readFileSync('spec/v0/entity.schema.json', 'utf8'));
    expect(ajv.compile(schema)(fixture)).toBe(true);
    const columns = listColumns(fixture);
    if (secondLine) columns[1].extras.secondary = fixture.fields[0];
    const theme = createC3Theme({ tokens: { accents: { forge: { start: '#741b31', end: '#45165b' } } } });
    render(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            {columns.map((c) => (
              <ColumnCell
                key={c.field}
                field={c.def}
                extras={c.extras}
                row={{ id: '1', nome: 'Ana Maria', cargo: 'forge' }}
                to="/agente/1"
                locale="pt-BR"
                optionLabel={() => () => 'Desenvolvimento'}
              />
            ))}
          </MemoryRouter>
        </ThemeProvider>
      </IntlProvider>
    );
    expect(screen.getByText('AM')).toBeTruthy();
    expect(screen.getByText('Desenvolvimento')).toBeTruthy();
    expect(document.head.textContent).toContain('background-image:var(--mui-palette-accents-forge-background)');
    const errors: string[] = [];
    const fields = new Map(fixture.fields.map((f) => [f.name, f]));
    checkAccentColumns(fixture, fields, 'agente.json', errors);
    expect(errors).toEqual([]);
    const bad = structuredClone(fixture);
    (bad.views!.list!.columns![0] as { avatar: unknown }).avatar = { color: { field: 'senha' } };
    checkAccentColumns(bad, fields, 'agente.json', errors);
    expect(errors.join()).toContain('senha');
    checkAccentColumns({ views: { list: { columns: [{ field: 'nome', color: 'accent:forge' }] } } }, fields, 'x', errors);
    expect(errors.join()).toContain('precisa ser enum');
  });
});
