// Uma tela inteira do motor a partir da spec: a lista (`views.list`) ou o formulário da entidade. A história só diz
// qual entidade e qual registro; colunas, filtros, ações e lote vêm do JSON.

import { EntityForm, EntityList } from '@c3theme/engine';

export interface MotorScreenProps {
  /** Entidade da spec do Storybook. */
  entity: string;
  /** Tela: a lista ou o formulário. */
  screen?: 'list' | 'form';
  /** No formulário: registro gravado; sem ele, cadastro novo. */
  id?: string;
}

export default function MotorScreen({ entity, screen = 'list', id }: MotorScreenProps) {
  if (screen === 'form') return <EntityForm key={`${entity}-${id ?? 'new'}`} entity={entity} id={id} />;
  return <EntityList key={entity} entity={entity} />;
}
