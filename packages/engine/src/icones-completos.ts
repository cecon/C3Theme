// Opt-in: não reexportar pelo index principal, nem importar na shell.
import * as catalog from 'iconsax-reactjs';
import type { C3Icons } from './context';

/** Catálogo completo para specs com nomes arbitrários. Prefira um mapa com só os ícones da sua spec. */
export const icons = catalog as unknown as C3Icons;
export default icons;
