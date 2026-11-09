import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { Code, Danger, DocumentText, Home2, Message, Profile, Setting4 } from 'iconsax-reactjs';

import type { NavGroup } from '@c3theme/ui';

/**
 * Menu lateral. Cada tela nova entra aqui com um item e na lista de rotas do App.tsx.
 * Os títulos passam pelo react-intl (src/locales); texto sem tradução aparece como está no defaultMessage.
 */
export function useMenu(): NavGroup[] {
  const intl = useIntl();
  return useMemo(() => {
    const t = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage });
    return [
      {
        id: 'principal',
        title: t('menu.principal', 'Principal'),
        items: [{ id: 'inicio', title: t('menu.inicio', 'Início'), icon: Home2, url: '/inicio' }]
      },
      {
        id: 'paginas',
        title: t('menu.paginas', 'Páginas'),
        items: [
          { id: 'perfil', title: t('menu.perfil', 'Meu perfil'), icon: Profile, url: '/perfil' },
          {
            id: 'manutencao',
            title: t('menu.manutencao', 'Manutenção'),
            icon: Setting4,
            children: [
              { id: 'erro404', title: t('menu.erro404', 'Erro 404'), icon: Danger, url: '/manutencao/404' },
              { id: 'erro500', title: t('menu.erro500', 'Erro 500'), icon: Danger, url: '/manutencao/500' },
              { id: 'em-manutencao', title: t('menu.emManutencao', 'Em manutenção'), icon: Code, url: '/manutencao/em-manutencao' },
              { id: 'em-breve', title: t('menu.emBreve', 'Em breve'), icon: Code, url: '/manutencao/em-breve' }
            ]
          }
        ]
      },
      {
        id: 'suporte',
        title: t('menu.suporte', 'Suporte'),
        items: [
          {
            id: 'docs',
            title: t('menu.documentacao', 'Documentação'),
            icon: DocumentText,
            url: 'https://github.com/cecon/C3Theme#readme',
            external: true
          },
          { id: 'contato', title: 'suporte@exemplo.com', icon: Message, url: 'mailto:suporte@exemplo.com', external: true }
        ]
      }
    ];
  }, [intl]);
}
