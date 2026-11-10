// Guarda do assistente (`pages[].wizard.pending`, #34): enquanto o registro diz que está pendente, toda rota da shell
// leva ao assistente, menos ele mesmo. Sair fica no menu do usuário, que não é rota.
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { useEngine } from '../../context';
import { guardPage, guardRedirect } from '../../wizard';
import { useSingletonRecord } from './useSingletonRecord';

export default function WizardGuard({ children }: { children: ReactNode }) {
  const { app, entities } = useEngine();
  const guard = guardPage(app.pages);
  const entity = guard && entities[guard.wizard.entity] ? guard.wizard.entity : undefined;
  const { record, loaded } = useSingletonRecord(entity);
  const { pathname } = useLocation();
  if (!entity) return children;
  // até saber se está pendente, não mostra a tela que talvez nem possa abrir
  if (!loaded) return null;
  const to = guardRedirect(pathname, guard!.path, record, guard!.wizard.pending!);
  return to ? <Navigate to={to} replace /> : children;
}
