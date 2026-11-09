import { describe, expect, it } from 'vitest';

import { planFill, planUndo } from './lookupFill';

const fills = ['street', 'city', 'state'];
const data = { street: 'Avenida Paulista', city: 'São Paulo', state: 'SP' };

describe('planFill', () => {
  it('preenche vazio e mantém o que o usuário digitou', () => {
    const fill = planFill(fills, data, { street: '', city: 'Campinas', state: null }, {});
    expect(fill.patch).toEqual({ street: 'Avenida Paulista', state: 'SP' });
    expect(fill.before).toEqual({ street: '', state: null });
  });

  it('troca o que a consulta anterior pôs, mas não o que foi editado depois', () => {
    const filled = { street: 'Rua A', city: 'Rio' };
    const fill = planFill(fills, data, { street: 'Rua A', city: 'Niterói', state: 'RJ' }, filled);
    expect(fill.patch).toEqual({ street: 'Avenida Paulista' });
  });

  it('ignora campo fora de fills e campo que a resposta não traz', () => {
    expect(planFill(['street'], { ...data, name: 'x' }, {}, {}).patch).toEqual({ street: 'Avenida Paulista' });
    expect(planFill(fills, { city: 'X' }, {}, {}).patch).toEqual({ city: 'X' });
  });
});

describe('planUndo', () => {
  it('volta só o que ainda tem o valor preenchido', () => {
    const fill = planFill(fills, data, {}, {});
    const now = { street: 'Avenida Paulista', city: 'Santos', state: 'SP' };
    expect(planUndo(fill, now)).toEqual({ street: undefined, state: undefined });
  });
});
