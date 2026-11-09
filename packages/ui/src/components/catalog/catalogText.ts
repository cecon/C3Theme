import { useCallback } from 'react';
import { useIntl } from 'react-intl';

// textos do catálogo; ficam aqui e não no i18n.ts para o arquivo geral não passar de 300 linhas
const PT = {
  'c3.catalog.kind.all': 'Tudo',
  'c3.catalog.kind.agent': 'Agentes',
  'c3.catalog.kind.skill': 'Habilidades',
  'c3.catalog.kind.app': 'Apps',
  'c3.catalog.kind.one.agent': 'Agente',
  'c3.catalog.kind.one.skill': 'Habilidade',
  'c3.catalog.kind.one.app': 'App',
  'c3.catalog.filter': 'Tipo de item',
  'c3.catalog.search': 'Buscar',
  'c3.catalog.empty': 'Nada encontrado',
  'c3.catalog.emptyHint': 'Confira a grafia ou mude o tipo.',
  'c3.catalog.noCategory': 'Outros',
  'c3.catalog.install': 'Instalar',
  'c3.catalog.update': 'Atualizar',
  'c3.catalog.open': 'Abrir',
  'c3.catalog.retry': 'Tentar de novo',
  'c3.catalog.remove': 'Remover',
  'c3.catalog.details': 'Detalhes',
  'c3.catalog.detailsOf': 'Detalhes de {name}',
  'c3.catalog.actionOf': '{action} {name}',
  'c3.catalog.installing': 'Instalando…',
  'c3.catalog.installingPct': 'Instalando… {progress}%',
  'c3.catalog.progressOf': 'Instalação de {name}',
  'c3.catalog.state.installed': 'Instalado',
  'c3.catalog.state.update': 'Versão {version} disponível',
  'c3.catalog.state.removed': 'Saiu do catálogo',
  'c3.catalog.state.error': 'Falhou',
  'c3.catalog.by': 'por {author}',
  'c3.catalog.version': 'v{version}',
  'c3.catalog.removedHint': 'Continua funcionando aqui, mas não recebe mais atualizações.',
  'c3.catalog.errorHint': 'A instalação não terminou.',
  'c3.catalog.about': 'Sobre',
  'c3.catalog.installs': 'O que instala',
  'c3.catalog.files': 'Arquivos',
  'c3.catalog.permissions': 'Permissões',
  'c3.catalog.versions': 'Histórico de versões',
  'c3.catalog.current': 'instalada',
  'c3.catalog.edited':
    '{count, plural, one {Você editou um arquivo} other {Você editou # arquivos}} à mão. A atualização não sobrescreve: a versão nova fica ao lado, com ".nova" no fim do nome.'
} as const;

export type CatalogMessageId = keyof typeof PT;

/** Tradução para inglês dos textos do catálogo; entra junto do UI_MESSAGES_EN. */
export const CATALOG_MESSAGES_EN: Record<CatalogMessageId, string> = {
  'c3.catalog.kind.all': 'All',
  'c3.catalog.kind.agent': 'Agents',
  'c3.catalog.kind.skill': 'Skills',
  'c3.catalog.kind.app': 'Apps',
  'c3.catalog.kind.one.agent': 'Agent',
  'c3.catalog.kind.one.skill': 'Skill',
  'c3.catalog.kind.one.app': 'App',
  'c3.catalog.filter': 'Item type',
  'c3.catalog.search': 'Search',
  'c3.catalog.empty': 'Nothing found',
  'c3.catalog.emptyHint': 'Check the spelling or change the type.',
  'c3.catalog.noCategory': 'Other',
  'c3.catalog.install': 'Install',
  'c3.catalog.update': 'Update',
  'c3.catalog.open': 'Open',
  'c3.catalog.retry': 'Try again',
  'c3.catalog.remove': 'Remove',
  'c3.catalog.details': 'Details',
  'c3.catalog.detailsOf': 'Details of {name}',
  'c3.catalog.actionOf': '{action} {name}',
  'c3.catalog.installing': 'Installing…',
  'c3.catalog.installingPct': 'Installing… {progress}%',
  'c3.catalog.progressOf': 'Installing {name}',
  'c3.catalog.state.installed': 'Installed',
  'c3.catalog.state.update': 'Version {version} available',
  'c3.catalog.state.removed': 'Removed from catalog',
  'c3.catalog.state.error': 'Failed',
  'c3.catalog.by': 'by {author}',
  'c3.catalog.version': 'v{version}',
  'c3.catalog.removedHint': 'It still works here, but gets no more updates.',
  'c3.catalog.errorHint': 'The installation did not finish.',
  'c3.catalog.about': 'About',
  'c3.catalog.installs': 'What it installs',
  'c3.catalog.files': 'Files',
  'c3.catalog.permissions': 'Permissions',
  'c3.catalog.versions': 'Version history',
  'c3.catalog.current': 'installed',
  'c3.catalog.edited':
    'You edited {count, plural, one {one file} other {# files}} by hand. The update does not overwrite them: the new version goes next to each one, with ".nova" at the end of the name.'
};

/** `t('c3.catalog.install')` com o texto do idioma atual. */
export function useCatalogText() {
  const intl = useIntl();
  return useCallback(
    (id: CatalogMessageId, values?: Record<string, string | number>) => intl.formatMessage({ id, defaultMessage: PT[id] }, values),
    [intl]
  );
}
