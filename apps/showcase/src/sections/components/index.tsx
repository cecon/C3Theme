import { ComponentType, ElementType, lazy } from 'react';

// third-party
import { Brush2, Element3, Layer, Mouse, Routing2, StatusUp } from 'iconsax-reactjs';

import { Loadable } from '@c3theme/ui';
import type { Section } from '../../section';

type PageModule = Promise<{ default: ComponentType }>;

interface PageDef {
  slug: string;
  title: string;
  load: () => PageModule;
}

interface GroupDef {
  id: string;
  title: string;
  icon: ElementType;
  pages: PageDef[];
}

// Ordem do menu: grupos por finalidade, páginas em ordem alfabética dentro de cada grupo.
const GROUPS: GroupDef[] = [
  {
    id: 'entradas',
    title: 'Entradas',
    icon: Mouse,
    pages: [
      { slug: 'autocompletar', title: 'Autocompletar', load: () => import('./pages/AutocompletePage') },
      { slug: 'avaliacao', title: 'Avaliação', load: () => import('./pages/RatingPage') },
      { slug: 'botoes', title: 'Botões', load: () => import('./pages/ButtonsPage') },
      { slug: 'botao-de-opcao', title: 'Botão de opção', load: () => import('./pages/RadioPage') },
      { slug: 'caixa-de-selecao', title: 'Caixa de seleção', load: () => import('./pages/CheckboxPage') },
      { slug: 'campo-de-texto', title: 'Campo de texto', load: () => import('./pages/TextFieldPage') },
      { slug: 'controle-deslizante', title: 'Controle deslizante', load: () => import('./pages/SliderPage') },
      { slug: 'data-e-hora', title: 'Data e hora', load: () => import('./pages/DateTimePage') },
      { slug: 'interruptor', title: 'Interruptor', load: () => import('./pages/SwitchPage') },
      { slug: 'selecao', title: 'Seleção', load: () => import('./pages/SelectPage') }
    ]
  },
  {
    id: 'exibicao',
    title: 'Exibição de dados',
    icon: Element3,
    pages: [
      { slug: 'arvore', title: 'Árvore', load: () => import('./pages/TreeViewPage') },
      { slug: 'avatares', title: 'Avatares', load: () => import('./pages/AvatarsPage') },
      { slug: 'chips', title: 'Chips', load: () => import('./pages/ChipsPage') },
      { slug: 'dicas', title: 'Dicas', load: () => import('./pages/TooltipPage') },
      { slug: 'emblemas', title: 'Emblemas', load: () => import('./pages/BadgesPage') },
      { slug: 'linha-do-tempo', title: 'Linha do tempo', load: () => import('./pages/TimelinePage') },
      { slug: 'listas', title: 'Listas', load: () => import('./pages/ListsPage') }
    ]
  },
  {
    id: 'feedback',
    title: 'Feedback',
    icon: StatusUp,
    pages: [
      { slug: 'alertas', title: 'Alertas', load: () => import('./pages/AlertPage') },
      { slug: 'avisos', title: 'Avisos', load: () => import('./pages/SnackbarPage') },
      { slug: 'dialogos', title: 'Diálogos', load: () => import('./pages/DialogsPage') },
      { slug: 'modal', title: 'Modal', load: () => import('./pages/ModalPage') },
      { slug: 'progresso', title: 'Progresso', load: () => import('./pages/ProgressPage') },
      { slug: 'carregando', title: 'Carregando (skeleton)', load: () => import('./pages/SkeletonPage') }
    ]
  },
  {
    id: 'navegacao',
    title: 'Navegação',
    icon: Routing2,
    pages: [
      { slug: 'abas', title: 'Abas', load: () => import('./pages/TabsPage') },
      { slug: 'botao-de-acoes', title: 'Botão de ações', load: () => import('./pages/SpeedDialPage') },
      { slug: 'etapas', title: 'Etapas', load: () => import('./pages/StepperPage') },
      { slug: 'paginacao', title: 'Paginação', load: () => import('./pages/PaginationPage') },
      { slug: 'trilha-de-navegacao', title: 'Trilha de navegação', load: () => import('./pages/BreadcrumbsPage') }
    ]
  },
  {
    id: 'superficies',
    title: 'Superfícies',
    icon: Layer,
    pages: [
      { slug: 'acordeao', title: 'Acordeão', load: () => import('./pages/AccordionPage') },
      { slug: 'cartoes', title: 'Cartões', load: () => import('./pages/CardsPage') }
    ]
  },
  {
    id: 'fundamentos',
    title: 'Fundamentos',
    icon: Brush2,
    pages: [
      { slug: 'cores', title: 'Cores', load: () => import('./pages/ColorsPage') },
      { slug: 'sombras', title: 'Sombras', load: () => import('./pages/ShadowsPage') },
      { slug: 'tipografia', title: 'Tipografia', load: () => import('./pages/TypographyPage') }
    ]
  }
];

const path = (slug: string) => `componentes/${slug}`;

export const section: Section = {
  menu: {
    id: 'components',
    title: 'Componentes',
    items: GROUPS.map((g) => ({
      id: `componentes-${g.id}`,
      title: g.title,
      icon: g.icon,
      children: g.pages.map((p) => ({ id: `componentes-${p.slug}`, title: p.title, url: `/${path(p.slug)}` }))
    }))
  },
  routes: GROUPS.flatMap((g) =>
    g.pages.map((p) => {
      const Page = Loadable(lazy(p.load));
      return { path: path(p.slug), element: <Page /> };
    })
  )
};
