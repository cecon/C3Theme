import { useColorScheme } from '@mui/material/styles';

export type ColorMode = 'light' | 'dark';
export type ColorModePreference = ColorMode | 'system';

/**
 * Modo claro/escuro em um lugar só. `mode` é o que está na tela (com "sistema" já resolvido); `preference` é o que
 * o usuário escolheu. A escolha fica salva pelo C3ThemeProvider.
 */
export default function useColorMode() {
  const { mode: chosen, systemMode, setMode } = useColorScheme();
  const preference: ColorModePreference = chosen ?? 'system';
  const mode: ColorMode = (preference === 'system' ? systemMode : preference) ?? 'light';
  return {
    mode,
    preference,
    setPreference: (p: ColorModePreference) => setMode(p),
    toggle: () => setMode(mode === 'dark' ? 'light' : 'dark')
  };
}
