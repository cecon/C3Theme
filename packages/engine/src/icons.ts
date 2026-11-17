// Ponto de entrada à parte (`@c3theme/engine/icons`, #121): o catálogo inteiro do iconsax (vários MB). Só entra no
// pacote do app que importa este arquivo e passa `icons={allIcons}` à casca; o motor nunca importa daqui.
import * as iconsax from 'iconsax-reactjs';

import type { C3Icons } from './context';

/** Todos os ícones do iconsax, por nome: para quem não quer listar só os que a spec cita. */
export const allIcons: C3Icons = iconsax as unknown as C3Icons;
