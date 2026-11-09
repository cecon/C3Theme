import { lazy } from 'react';

// third-party
import { Category2, Element3, ShieldTick, TaskSquare } from 'iconsax-reactjs';

import { Loadable } from '@c3theme/ui';
import type { Section } from '../../section';

const BasicLayouts = Loadable(lazy(() => import('./layouts/BasicLayoutsPage')));
const MultiColumn = Loadable(lazy(() => import('./layouts/MultiColumnPage')));
const ActionBar = Loadable(lazy(() => import('./layouts/ActionBarPage')));
const StickyBar = Loadable(lazy(() => import('./layouts/StickyBarPage')));
const Validation = Loadable(lazy(() => import('./validation/ValidationPage')));
const Wizard = Loadable(lazy(() => import('./wizard/WizardPage')));
const Clipboard = Loadable(lazy(() => import('./plugins/ClipboardPage')));
const Dropzone = Loadable(lazy(() => import('./plugins/dropzone/DropzonePage')));
const Editor = Loadable(lazy(() => import('./plugins/EditorPage')));
const Mask = Loadable(lazy(() => import('./plugins/MaskPage')));

const P = 'formularios';

export const section: Section = {
  menu: {
    id: 'forms',
    title: 'Formulários',
    items: [
      {
        id: 'forms-layouts',
        title: 'Layouts',
        icon: Element3,
        children: [
          { id: 'forms-basic', title: 'Básico', url: `/${P}/layouts/basico` },
          { id: 'forms-multi', title: 'Várias colunas', url: `/${P}/layouts/colunas` },
          { id: 'forms-action', title: 'Barra de ações', url: `/${P}/layouts/barra-de-acoes` },
          { id: 'forms-sticky', title: 'Barra fixa', url: `/${P}/layouts/barra-fixa` }
        ]
      },
      { id: 'forms-validation', title: 'Validação', icon: ShieldTick, url: `/${P}/validacao` },
      { id: 'forms-wizard', title: 'Assistente em etapas', icon: TaskSquare, url: `/${P}/assistente` },
      {
        id: 'forms-plugins',
        title: 'Plugins',
        icon: Category2,
        children: [
          { id: 'forms-clipboard', title: 'Área de transferência', url: `/${P}/plugins/area-de-transferencia` },
          { id: 'forms-dropzone', title: 'Upload de arquivos', url: `/${P}/plugins/upload` },
          { id: 'forms-editor', title: 'Editor de texto', url: `/${P}/plugins/editor` },
          { id: 'forms-mask', title: 'Máscaras', url: `/${P}/plugins/mascaras` }
        ]
      }
    ]
  },
  routes: [
    { path: `${P}/layouts/basico`, element: <BasicLayouts /> },
    { path: `${P}/layouts/colunas`, element: <MultiColumn /> },
    { path: `${P}/layouts/barra-de-acoes`, element: <ActionBar /> },
    { path: `${P}/layouts/barra-fixa`, element: <StickyBar /> },
    { path: `${P}/validacao`, element: <Validation /> },
    { path: `${P}/assistente`, element: <Wizard /> },
    { path: `${P}/plugins/area-de-transferencia`, element: <Clipboard /> },
    { path: `${P}/plugins/upload`, element: <Dropzone /> },
    { path: `${P}/plugins/editor`, element: <Editor /> },
    { path: `${P}/plugins/mascaras`, element: <Mask /> }
  ]
};
