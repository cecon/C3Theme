import type { Section } from '../../section';
import * as a from './part-a';
import * as b from './part-b';
import * as c from './part-c';

// três partes escritas em paralelo: calendário/chat/kanban, clientes/e-commerce, faturas/perfis
export const section: Section = {
  menu: { id: 'apps', title: 'Aplicativos', items: [...a.items, ...b.items, ...c.items] },
  routes: [...a.routes, ...b.routes, ...c.routes]
};
