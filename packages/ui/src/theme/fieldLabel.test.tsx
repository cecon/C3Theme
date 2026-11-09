// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it } from 'vitest';

import { createC3Theme } from './createC3Theme';

afterEach(cleanup);

const label = (text: string) => screen.getByText(text, { selector: 'label' });
// entalhe aberto: a legenda do contorno tem largura livre; fechado, 0.01px
const notched = (container: HTMLElement) =>
  [...container.querySelectorAll('fieldset legend')].map((l) => getComputedStyle(l).maxWidth === '100%');

describe('rótulo do campo no tema', () => {
  for (const look of ['c3', 'angle'] as const) {
    it(`${look}: campo vazio, com valor e com placeholder deixam o rótulo na borda`, () => {
      const { container } = render(
        <ThemeProvider theme={createC3Theme({ look })}>
          <TextField label="Vazio" />
          <TextField label="Com valor" defaultValue="Ana" />
          <TextField label="Com placeholder" placeholder="https://" />
          <FormControl>
            <InputLabel id="uf">UF</InputLabel>
            <Select labelId="uf" label="UF" value="" input={<OutlinedInput label="UF" />}>
              <MenuItem value="SP">SP</MenuItem>
            </Select>
          </FormControl>
        </ThemeProvider>
      );
      for (const text of ['Vazio', 'Com valor', 'Com placeholder', 'UF']) expect(label(text).dataset.shrink).toBe('true');
      expect(notched(container)).toEqual([true, true, true, true]);
    });
  }

  it('quem pede o rótulo flutuante ainda consegue', () => {
    const { container } = render(
      <ThemeProvider theme={createC3Theme({})}>
        <TextField label="Flutuante" slotProps={{ inputLabel: { shrink: false } }} />
      </ThemeProvider>
    );
    expect(label('Flutuante').dataset.shrink).toBe('false');
    expect(notched(container)).toEqual([false]);
  });
});
