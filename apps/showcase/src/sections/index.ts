// As áreas da vitrine, na ordem do menu. Fica fora do App para o build ler o menu sem montar o roteador
// (as páginas estáticas por rota e o sitemap saem daqui).

import type { Section } from '../section';

import { section as apps } from './apps';
import { section as charts } from './charts';
import { section as components } from './components';
import { section as dashboard } from './dashboard';
import { section as forms } from './forms';
import { section as motor } from './motor';
import { section as pages } from './pages';
import { section as tables } from './tables';
import { section as widgets } from './widgets';

export const SECTIONS: Section[] = [dashboard, motor, widgets, apps, forms, tables, charts, components, pages];

export const menu = SECTIONS.map((s) => s.menu).filter((g) => g.items.length > 0);
