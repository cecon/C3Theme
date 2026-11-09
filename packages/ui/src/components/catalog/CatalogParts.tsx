// material-ui
import Button, { ButtonProps } from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';

import SoftAvatar, { SoftAvatarProps } from '../SoftAvatar';
import StatusChip from '../StatusChip';
import { primaryAction, primaryCallback, type CatalogActions, type CatalogItem, type CatalogKind } from './catalog';
import { useCatalogText } from './catalogText';

const KIND_TONE = { agent: 'primary', skill: 'info', app: 'success' } as const satisfies Record<CatalogKind, SoftAvatarProps['tone']>;

// só palavras que começam com letra ou número: "Agenda (versão antiga)" vira "AV", não "A("
const initials = (name: string) =>
  (name.match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) ?? [])
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Ícone do item, ou as iniciais do nome na cor do tipo. Decorativo: o nome vem logo ao lado. */
export function CatalogIcon({ item, size = 'md' }: { item: CatalogItem; size?: SoftAvatarProps['size'] }) {
  return (
    <SoftAvatar tone={KIND_TONE[item.kind]} size={size} variant="rounded" aria-hidden>
      {item.icon ?? initials(item.name)}
    </SoftAvatar>
  );
}

/** Selo do estado; "disponível" não tem selo (é o normal da loja). */
export function CatalogStatusChip({ item }: { item: CatalogItem }) {
  const t = useCatalogText();
  const { status } = item;
  switch (status.state) {
    case 'installing':
      return <StatusChip tone="info" label={t('c3.catalog.installing')} />;
    case 'installed':
      return <StatusChip tone="success" label={t('c3.catalog.state.installed')} />;
    case 'update-available':
      return <StatusChip tone="primary" label={t('c3.catalog.state.update', { version: status.version })} />;
    case 'removed-from-catalog':
      return <StatusChip tone="warning" label={t('c3.catalog.state.removed')} />;
    case 'error':
      return <StatusChip tone="danger" label={t('c3.catalog.state.error')} />;
    default:
      return null;
  }
}

/** Barra de instalação; o leitor de tela lê o nome do item e a porcentagem. */
export function CatalogProgress({ item }: { item: CatalogItem }) {
  const t = useCatalogText();
  if (item.status.state !== 'installing') return null;
  const { progress } = item.status;
  return (
    <LinearProgress
      variant={progress === undefined ? 'indeterminate' : 'determinate'}
      value={progress}
      aria-label={t('c3.catalog.progressOf', { name: item.name })}
      sx={{ borderRadius: 1 }}
    />
  );
}

const LABEL = { install: 'c3.catalog.install', update: 'c3.catalog.update', open: 'c3.catalog.open', retry: 'c3.catalog.retry' } as const;

/**
 * Ação principal pelo estado: Instalar, Atualizar, Abrir ou Tentar de novo. Instalando, o botão fica travado com a
 * porcentagem. Sem o callback do app para a ação, não aparece.
 */
export function CatalogPrimaryButton({
  item,
  actions,
  size = 'small'
}: {
  item: CatalogItem;
  actions: CatalogActions;
  size?: ButtonProps['size'];
}) {
  const t = useCatalogText();
  const action = primaryAction(item.status);
  if (action === 'installing') {
    const { progress } = item.status as { progress?: number };
    return (
      <Button size={size} variant="contained" disabled>
        {progress === undefined ? t('c3.catalog.installing') : t('c3.catalog.installingPct', { progress: Math.round(progress) })}
      </Button>
    );
  }
  const run = primaryCallback(item.status, actions);
  if (!run) return null;
  const label = item.actionLabel ?? t(LABEL[action]);
  // nome com o item: numa lista de cartões, "Instalar" sozinho não diz o quê; começa pelo texto visível (voz)
  return (
    <Button
      size={size}
      variant={action === 'open' ? 'outlined' : 'contained'}
      onClick={() => run(item)}
      aria-label={t('c3.catalog.actionOf', { action: label, name: item.name })}
    >
      {label}
    </Button>
  );
}

/** "por Autor · v1.2.0" */
export function useByline(item: CatalogItem) {
  const t = useCatalogText();
  const version = t('c3.catalog.version', { version: item.version });
  return item.author ? `${t('c3.catalog.by', { author: item.author })} · ${version}` : version;
}
