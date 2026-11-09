import { ReactNode } from 'react';

// third-party
import { ptBR } from 'date-fns/locale/pt-BR';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR as pickersPtBR } from '@mui/x-date-pickers/locales';

// textos do seletor em português, inclusive o formato vazio (DD/MM/AAAA em vez de DD/MM/YYYY)
const localeText = pickersPtBR.components.MuiLocalizationProvider.defaultProps.localeText;

/** Seletores de data em português (dd/mm/aaaa). */
export default function DateProvider({ children }: { children: ReactNode }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR} localeText={localeText}>
      {children}
    </LocalizationProvider>
  );
}
