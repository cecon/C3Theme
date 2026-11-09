// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import TablePagination from '@mui/material/TablePagination';
import { afterEach, describe, expect, it } from 'vitest';

import C3ThemeProvider from '../C3ThemeProvider';
import { muiLocaleFor } from './muiLocale';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const pagination = (locale: string) =>
  render(
    <C3ThemeProvider defaultConfig={{ locale }}>
      <TablePagination component="div" count={30} page={0} rowsPerPage={10} onPageChange={() => {}} />
    </C3ThemeProvider>
  );

describe('textos do MUI no idioma do app', () => {
  it('pt e es têm locale do MUI; inglês fica no padrão', () => {
    expect(muiLocaleFor('pt-BR')).toBeDefined();
    expect(muiLocaleFor('es')).toBeDefined();
    expect(muiLocaleFor('en')).toBeUndefined();
    expect(muiLocaleFor(undefined)).toBeUndefined();
  });

  it('a paginação do MUI sai em português com o app em pt-BR', () => {
    pagination('pt-BR');
    expect(screen.getByText('Linhas por página:')).toBeTruthy();
    expect(screen.getByText('1–10 de 30')).toBeTruthy();
  });

  it('em inglês continua o texto do MUI', () => {
    pagination('en');
    expect(screen.getByText('Rows per page:')).toBeTruthy();
  });
});
