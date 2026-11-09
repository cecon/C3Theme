import { Chart21, DocumentText, Home2, People, Setting2, ShoppingCart } from 'iconsax-reactjs';

import type { NavGroup } from '@c3theme/ui';

/** Menu de um ERP pequeno: grupos, um nível de filhos e contador. Serve ao AppLayout e às migalhas. */
export const MENU: NavGroup[] = [
  {
    id: 'inicio',
    title: 'Início',
    items: [{ id: 'painel', title: 'Painel', icon: Home2, url: '/painel' }]
  },
  {
    id: 'cadastros',
    title: 'Cadastros',
    items: [
      { id: 'clientes', title: 'Clientes', icon: People, url: '/clientes' },
      {
        id: 'vendas',
        title: 'Vendas',
        icon: ShoppingCart,
        children: [
          { id: 'pedidos', title: 'Pedidos', url: '/vendas/pedidos', badge: 4 },
          { id: 'faturas', title: 'Faturas', url: '/vendas/faturas' }
        ]
      }
    ]
  },
  {
    id: 'gestao',
    title: 'Gestão',
    items: [
      { id: 'relatorios', title: 'Relatórios', icon: Chart21, url: '/relatorios' },
      { id: 'documentos', title: 'Documentos', icon: DocumentText, url: '/documentos' },
      { id: 'config', title: 'Configurações', icon: Setting2, url: '/config' }
    ]
  }
];
