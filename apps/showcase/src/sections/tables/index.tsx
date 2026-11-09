import { lazy } from 'react';

// third-party
import { Grid5, TableDocument } from 'iconsax-reactjs';

import { Loadable } from '@c3theme/ui';
import type { NavItem } from '@c3theme/ui';
import type { Section } from '../../section';

// tabelas MUI (componentes de tabela do Material UI, estado local)
const MuiBasica = Loadable(lazy(() => import('./mui/Basica')));
const MuiDensa = Loadable(lazy(() => import('./mui/Densa')));
const MuiAprimorada = Loadable(lazy(() => import('./mui/Aprimorada')));
const MuiTabelaDeDados = Loadable(lazy(() => import('./mui/TabelaDeDados')));
const MuiPersonalizada = Loadable(lazy(() => import('./mui/Personalizada')));
const MuiCabecalhoFixo = Loadable(lazy(() => import('./mui/CabecalhoFixo')));
const MuiRecolhivel = Loadable(lazy(() => import('./mui/Recolhivel')));

// tabelas de dados (TanStack Table)
const DadosBasica = Loadable(lazy(() => import('./dados/Basica')));
const DadosDensa = Loadable(lazy(() => import('./dados/Densa')));
const DadosOrdenacao = Loadable(lazy(() => import('./dados/Ordenacao')));
const DadosFiltragem = Loadable(lazy(() => import('./dados/Filtragem')));
const DadosAgrupamento = Loadable(lazy(() => import('./dados/Agrupamento')));
const DadosPaginacao = Loadable(lazy(() => import('./dados/Paginacao')));
const DadosServidor = Loadable(lazy(() => import('./dados/Servidor')));
const DadosSelecao = Loadable(lazy(() => import('./dados/Selecao')));
const DadosArrastar = Loadable(lazy(() => import('./dados/Arrastar')));
const DadosVisibilidade = Loadable(lazy(() => import('./dados/Visibilidade')));
const DadosRedimensionamento = Loadable(lazy(() => import('./dados/Redimensionamento')));
const DadosFixas = Loadable(lazy(() => import('./dados/Fixas')));
const DadosGuardaChuva = Loadable(lazy(() => import('./dados/GuardaChuva')));
const DadosVazia = Loadable(lazy(() => import('./dados/Vazia')));
const DadosVirtualizada = Loadable(lazy(() => import('./dados/Virtualizada')));
const DadosEditavel = Loadable(lazy(() => import('./dados/Editavel')));
const DadosExpansivel = Loadable(lazy(() => import('./dados/Expansivel')));

const PAGINAS_MUI = [
  { slug: 'basica', title: 'Básica', element: <MuiBasica /> },
  { slug: 'densa', title: 'Densa', element: <MuiDensa /> },
  { slug: 'aprimorada', title: 'Aprimorada', element: <MuiAprimorada /> },
  { slug: 'tabela-de-dados', title: 'Tabela de dados', element: <MuiTabelaDeDados /> },
  { slug: 'personalizada', title: 'Personalizada', element: <MuiPersonalizada /> },
  { slug: 'cabecalho-fixo', title: 'Cabeçalho fixo', element: <MuiCabecalhoFixo /> },
  { slug: 'recolhivel', title: 'Linhas recolhíveis', element: <MuiRecolhivel /> }
];

const PAGINAS_DADOS = [
  { slug: 'basica', title: 'Básica', element: <DadosBasica /> },
  { slug: 'densa', title: 'Densa', element: <DadosDensa /> },
  { slug: 'ordenacao', title: 'Ordenação', element: <DadosOrdenacao /> },
  { slug: 'filtragem', title: 'Filtragem', element: <DadosFiltragem /> },
  { slug: 'agrupamento', title: 'Agrupamento', element: <DadosAgrupamento /> },
  { slug: 'paginacao', title: 'Paginação', element: <DadosPaginacao /> },
  { slug: 'servidor', title: 'Modo servidor', element: <DadosServidor /> },
  { slug: 'selecao', title: 'Seleção de linhas', element: <DadosSelecao /> },
  { slug: 'arrastar', title: 'Arrastar e soltar', element: <DadosArrastar /> },
  { slug: 'visibilidade', title: 'Visibilidade de colunas', element: <DadosVisibilidade /> },
  { slug: 'redimensionar', title: 'Redimensionar colunas', element: <DadosRedimensionamento /> },
  { slug: 'fixas', title: 'Cabeçalho e colunas fixos', element: <DadosFixas /> },
  { slug: 'guarda-chuva', title: 'Cabeçalho agrupado', element: <DadosGuardaChuva /> },
  { slug: 'vazia', title: 'Estado vazio', element: <DadosVazia /> },
  { slug: 'virtualizada', title: 'Virtualizada', element: <DadosVirtualizada /> },
  { slug: 'editavel', title: 'Edição inline', element: <DadosEditavel /> },
  { slug: 'expansivel', title: 'Linhas expansíveis', element: <DadosExpansivel /> }
];

const filhos = (base: string, paginas: { slug: string; title: string }[]): NavItem[] =>
  paginas.map((p) => ({ id: `${base.replace(/\//g, '-')}-${p.slug}`, title: p.title, url: `/${base}/${p.slug}` }));

export const section: Section = {
  menu: {
    id: 'tables',
    title: 'Tabelas',
    items: [
      { id: 'tabelas-mui', title: 'Tabelas MUI', icon: Grid5, children: filhos('tabelas/mui', PAGINAS_MUI) },
      { id: 'tabelas-dados', title: 'Tabelas de dados', icon: TableDocument, children: filhos('tabelas/dados', PAGINAS_DADOS) }
    ]
  },
  routes: [
    ...PAGINAS_MUI.map((p) => ({ path: `tabelas/mui/${p.slug}`, element: p.element })),
    ...PAGINAS_DADOS.map((p) => ({ path: `tabelas/dados/${p.slug}`, element: p.element }))
  ]
};
