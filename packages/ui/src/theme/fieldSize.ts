import type { Components, Theme } from '@mui/material/styles';

/**
 * Tamanho dos campos: `small` para tabela, filtro e lista densa; `medium` para formulário (o padrão);
 * `large` para tela com poucos campos, como login. Vale para TextField, Select e Autocomplete.
 */
export type FieldSize = 'small' | 'medium' | 'large';

/** Altura total do campo contornado (borda incluída), em px, por tamanho. */
export type FieldHeights = Record<FieldSize, number>;

declare module '@mui/material/styles' {
  interface Theme {
    fieldHeight: FieldHeights;
  }
  interface ThemeOptions {
    fieldHeight?: FieldHeights;
  }
}
declare module '@mui/material/TextField' {
  interface TextFieldPropsSizeOverrides {
    large: true;
  }
}
declare module '@mui/material/InputBase' {
  interface InputBasePropsSizeOverrides {
    large: true;
  }
}
declare module '@mui/material/FormControl' {
  interface FormControlPropsSizeOverrides {
    large: true;
  }
}
declare module '@mui/material/InputLabel' {
  interface InputLabelPropsSizeOverrides {
    large: true;
  }
}
declare module '@mui/material/Autocomplete' {
  interface AutocompletePropsSizeOverrides {
    large: true;
  }
}

export const C3_FIELD_HEIGHT: FieldHeights = { small: 40, medium: 48, large: 56 };

// a altura chega a quem precisa por esta variável, posta no próprio campo e no rótulo conforme o tamanho
const H = '--c3-field-h';
// meia sobra entre a altura do campo e a linha do texto (1.4375em, a do InputBase e do rótulo)
const HALF_GAP = `calc((var(${H}) - 1.4375em) / 2)`;
// o Autocomplete deixa 3px de folga no contorno para os chips de seleção múltipla quebrarem linha
const AUTOCOMPLETE_GAP = 3;

function heightVar(prefix: string, h: FieldHeights) {
  return {
    [H]: `${h.medium}px`,
    [`&.${prefix}-sizeSmall`]: { [H]: `${h.small}px` },
    [`&.${prefix}-sizeLarge`]: { [H]: `${h.large}px` }
  };
}

/** Espaçamento do campo contornado; o tema junta com o acabamento dele (createTheme troca uma função por objeto). */
export const outlinedFieldSize = {
  root: { '&.MuiInputBase-multiline': { paddingBlock: HALF_GAP } },
  input: { '&:not(.MuiInputBase-inputMultiline)': { paddingBlock: HALF_GAP } }
};

/** Acabamento que faz o campo, o rótulo e o Autocomplete obedecerem a `fieldHeight` (o contorno vem de `outlinedFieldSize`). */
export function fieldSizeComponents(h: FieldHeights): Components<Omit<Theme, 'components'>> {
  return {
    MuiInputBase: { styleOverrides: { root: heightVar('MuiInputBase', h) } },
    MuiInputLabel: {
      // rótulo sempre na borda, com ou sem valor: o padrão do MUI deixa o rótulo dentro do campo vazio (parece
      // placeholder) e só sobe com valor, foco ou ícone, misturando os dois jeitos no mesmo formulário.
      // Campo flutuante: `slotProps.inputLabel.shrink: false` (o TextField fecha o entalhe junto).
      defaultProps: { shrink: true },
      styleOverrides: {
        root: {
          ...heightVar('MuiInputLabel', h),
          '&.MuiInputLabel-outlined:not(.MuiInputLabel-shrink)': { transform: `translate(14px, ${HALF_GAP}) scale(1)` }
        }
      }
    },
    // campos do @mui/x-date-pickers (quando o app usar): o PickersTextField só abre o entalhe e mostra o formato
    // (DD/MM/AAAA) do campo vazio quando recebe o shrink explícito; a chave fica fora dos tipos do MUI
    // (o @c3theme/ui não depende do MUI X). Conferido no @mui/x-date-pickers 9.15: rever se o slotProps dele mudar.
    // A altura deles segue o mesmo `fieldHeight` (o MUI X fixa 16.5px/8.5px de respiro, 56/40px de altura)
    ...({
      MuiPickersTextField: { defaultProps: { slotProps: { inputLabel: { shrink: true } } } },
      MuiPickersInputBase: {
        styleOverrides: {
          root: {
            [H]: `${h.medium}px`,
            '&.MuiPickersInputBase-inputSizeSmall': { [H]: `${h.small}px` },
            '& .MuiPickersInputBase-sectionsContainer': { paddingBlock: HALF_GAP }
          }
        }
      }
    } as object),
    // rótulo solto de grupo (radio, checkbox, upload) no mesmo tamanho do rótulo na borda dos campos
    // (o InputLabel encolhido é 0.75 do body1), para o formulário não ter dois tamanhos de rótulo
    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:not(.MuiInputLabel-root)': {
            display: 'block',
            fontSize: `calc(${theme.typography.body1.fontSize} * 0.75)`,
            lineHeight: 1.5,
            marginBottom: theme.spacing(0.25)
          }
        })
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root.MuiInputBase-root': { paddingBlock: AUTOCOMPLETE_GAP },
          '& .MuiOutlinedInput-root.MuiInputBase-root .MuiAutocomplete-input': {
            paddingBlock: `calc(${HALF_GAP} - ${AUTOCOMPLETE_GAP}px)`
          }
        }
      }
    }
  };
}
