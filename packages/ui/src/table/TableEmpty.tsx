import EmptyState, { type EmptyStateProps } from '../components/EmptyState';
import { useUiText } from '../i18n';

export type TableEmptyProps = Omit<EmptyStateProps, 'dense' | 'sx'>;

/** Estado vazio de tabela: o `EmptyState` com o título padrão "Nada encontrado". */
export default function TableEmpty({ title, ...rest }: TableEmptyProps) {
  const t = useUiText();
  return <EmptyState title={title ?? t('c3.table.empty')} {...rest} />;
}
