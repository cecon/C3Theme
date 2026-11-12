// O editor de fluxo pela spec (`views.flow`, #72): as duas rotas que a shell monta para a entidade, o formulário do
// registro (o campo do grafo vira o resumo com "Abrir o fluxo") e o editor em /{entidade}/:id/flow.

import { Route, Routes, useParams } from 'react-router';

import { EntityFlow, EntityForm } from '@c3theme/engine';

function Editor() {
  const { entity, id } = useParams();
  return <EntityFlow key={`${entity}-${id}`} entity={entity!} id={id!} />;
}

function Record() {
  const { entity, id } = useParams();
  return <EntityForm key={`${entity}-${id}`} entity={entity!} id={id === 'new' ? undefined : id} />;
}

export default function FluxoPeloMotor() {
  return (
    <Routes>
      <Route path="/:entity/:id/flow" element={<Editor />} />
      <Route path="/:entity/:id" element={<Record />} />
    </Routes>
  );
}
