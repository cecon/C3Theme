import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';

import { FormSkeleton, Panel } from '@c3theme/ui';
import { useEngine, useText } from '../context';
import AutosaveForm from './AutosaveForm';
import EntityForm from './EntityForm';
import EntityList from './EntityList';

/** /{entity}: a lista, ou o formulário do único registro quando a entidade é `singleton` (configuração). */
export default function EntityHome({ entity }: { entity: string }) {
  const { entities } = useEngine();
  return entities[entity].def.singleton ? <SingletonForm entity={entity} /> : <EntityList entity={entity} />;
}

/**
 * Configuração de registro único: lê o registro da filial ativa e abre o formulário dele; sem registro, o
 * formulário novo (com create) ou um aviso. A chave começa com 'c3-list': criar relê e o formulário passa a ser
 * o do registro gravado.
 */
function SingletonForm({ entity }: { entity: string }) {
  const { client, entities, org } = useEngine();
  const text = useText();
  const { def, capabilities } = entities[entity];
  const { data, error } = useSWR(['c3-list', entity, 'singleton', org?.active], () => client.list(entity, { page: 1, pageSize: 10 }));

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!data)
    return (
      <Panel title={text(def.label.singular)}>
        <FormSkeleton />
      </Panel>
    );
  const id = data.data[0]?.id;
  // `autosave`: cada ajuste grava na hora, sem Editar nem Salvar
  if (id && def.views?.form?.autosave) return <AutosaveForm key={`${entity}-${id}`} entity={entity} id={id} />;
  if (id) return <EntityForm key={`${entity}-${id}`} entity={entity} id={id} />;
  if (capabilities.create) return <EntityForm key={`${entity}-new`} entity={entity} />;
  return <Alert severity="info">{`${text(def.label.singular)} ainda não foi configurada.`}</Alert>;
}
