// Uma tela inteira do motor a partir da spec: a lista (`views.list`) ou o formulário da entidade. A história só diz
// qual entidade e qual registro; colunas, filtros, ações e lote vêm do JSON.

import { EntityForm, EntityHome, EntityList } from '@c3theme/engine';

export interface MotorScreenProps {
  /** Entidade da spec do Storybook. */
  entity: string;
  /** Tela: a lista, o formulário ou a tela da entidade `singleton` (configurações, como em /{entidade}). */
  screen?: 'list' | 'form' | 'singleton';
  /** No formulário: registro gravado; sem ele, cadastro novo. */
  id?: string;
}

export default function MotorScreen({ entity, screen = 'list', id }: MotorScreenProps) {
  if (screen === 'singleton') return <EntityHome key={entity} entity={entity} />;
  if (screen === 'form') return <EntityForm key={`${entity}-${id ?? 'new'}`} entity={entity} id={id} />;
  return <EntityList key={entity} entity={entity} />;
}
