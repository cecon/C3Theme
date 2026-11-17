import { describe, expect, it } from 'vitest';

import { iconByName } from './context';
import { allIcons } from './icons';

describe('@c3theme/engine/icons (#121)', () => {
  it('traz o catálogo inteiro do iconsax por nome, para o app passar em `icons`', () => {
    expect(iconByName('Profile2User', allIcons)).toBeDefined();
    expect(iconByName('Box', allIcons)).toBeDefined();
    expect(iconByName('NaoExiste', allIcons)).toBeUndefined();
  });

  it('sem `icons` na casca, nome de ícone da spec não desenha nada (o motor não baixa o catálogo sozinho)', () => {
    expect(iconByName('Profile2User', undefined)).toBeUndefined();
  });
});
