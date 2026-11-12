// Com cssVariables ligado, `theme.vars` sempre existe; isto avisa o TypeScript. A diretiva (e não um `import type`)
// sobrevive no .d.ts, então vale também em quem compila contra o dist do pacote.
/// <reference types="@mui/material/themeCssVarsAugmentation" preserve="true" />
import type { AccentPalette } from './accents';

declare module '@mui/material/styles' {
  /** Barra de cima: fundo e texto. O visual `angle` pinta ela de azul, como o Angle. */
  interface Palette {
    accents?: Record<string, AccentPalette>;
    header: { bg: string; fg: string };
  }
  interface PaletteOptions {
    accents?: Record<string, AccentPalette>;
    header?: { bg: string; fg: string };
  }
  /** Camadas dentro do conteúdo, abaixo da barra de cima; ver `Z_INDEX`. */
  interface ZIndex {
    raised: number;
    sticky: number;
    floating: number;
  }
}

export {};
