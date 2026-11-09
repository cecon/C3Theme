// Regras de negócio do sistema: o que o JSON não diz. Todos os pontos são opcionais; veja `Hooks` no
// @c3theme/engine-node e a skill c3-backend. Exemplos: `validate` (regra entre campos que a spec não expressa),
// `orgAccess` e `capabilities` (o que o usuário enxerga e grava), `runAction` (ações declaradas em `actions`).

import type { Hooks } from '@c3theme/engine-node';

export const appHooks: Hooks = {};
