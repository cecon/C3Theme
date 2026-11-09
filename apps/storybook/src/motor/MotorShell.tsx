// A shell inteira pela spec: o C3Layout do motor desenha menu, cabeçalho e rodapé do app.json e, no meio, a tela da
// entidade da rota. Faz o que o <C3Shell> faz em volta das rotas, sem o HTTP: o adaptador em memória responde.

import { useEffect } from 'react';
import { Route, Routes, useParams } from 'react-router';

import { C3Layout, EngineProvider, EntityForm, EntityHome, useEngine } from '@c3theme/engine';
import { useUiConfig } from '@c3theme/ui';

import { appWith } from './source';

export interface MotorShellProps {
  /** `layout.orientation` do app.json. */
  orientation?: 'vertical' | 'horizontal' | 'rail';
}

function List() {
  const { entity } = useParams();
  return <EntityHome key={entity} entity={entity!} />;
}

function Record() {
  const { entity, id } = useParams();
  return <EntityForm key={`${entity}-${id}`} entity={entity!} id={id === 'new' ? undefined : id} />;
}

/** Como o <C3Shell>: a orientação do app.json vale até o usuário trocar nas preferências; ao sair, volta a anterior. */
function useOrientation(orientation: NonNullable<MotorShellProps['orientation']>) {
  const { config, setConfig } = useUiConfig();
  const before = config.menuOrientation;
  useEffect(() => {
    setConfig({ menuOrientation: orientation });
    return () => setConfig({ menuOrientation: before });
    // só na troca de orientação da história
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);
}

export default function MotorShell({ orientation = 'vertical' }: MotorShellProps) {
  const state = useEngine();
  useOrientation(orientation);
  return (
    <EngineProvider value={{ ...state, app: appWith(orientation) }}>
      <Routes>
        <Route element={<C3Layout />}>
          <Route path=":entity" element={<List />} />
          <Route path=":entity/:id" element={<Record />} />
        </Route>
      </Routes>
    </EngineProvider>
  );
}
