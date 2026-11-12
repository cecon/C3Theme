// Estados da página (`pages[].states`, issue #99, ADR 0010) em volta do corpo do painel ou da página registrada.

import { ReactNode } from 'react';
import useSWR from 'swr';

import { PanelSkeleton } from '@c3theme/ui';
import { useEngine } from '../context';
import type { PageDef } from '../types';
import { countOf, probeState } from './states';
import StateView from './StateView';
import { useOnline } from './useOnline';

/**
 * Sem conexão, o aviso declarado fica no alto e a página continua embaixo, com o que já carregou. Com `statesEntity`,
 * a shell conta os registros dessa entidade antes de desenhar o corpo: carregando, erro (403 é sem permissão, sem
 * conexão é offline), zero é vazio. Estado não declarado fica com o padrão da shell; página sem `states` é a de sempre.
 */
export default function PageStates({ page, children }: { page: PageDef; children: ReactNode }) {
  const online = useOnline();
  const states = page.states ?? {};
  return (
    <>
      {!online && <StateView states={states} state="offline" />}
      {page.statesEntity ? (
        <Probe entity={page.statesEntity} page={page} online={online}>
          {children}
        </Probe>
      ) : (
        children
      )}
    </>
  );
}

function Probe({ entity, page, online, children }: { entity: string; page: PageDef; online: boolean; children: ReactNode }) {
  const { client, org } = useEngine();
  // começa com 'c3-list': gravar um registro em outra tela atualiza a contagem
  const probe = useSWR(['c3-list', entity, 'states', org?.active], () => client.aggregate(entity, { measure: 'count' }).then(countOf));
  const state = probeState(probe);
  if (state === 'ready') return children;
  const states = page.states ?? {};
  const retry = () => void probe.mutate();
  if (state === 'loading') return states.loading ? <StateView states={states} state="loading" /> : <PanelSkeleton />;
  // o pedido não chegou ao servidor: o aviso de sem conexão (o do alto, se o navegador já sabe) ou, sem ele, o erro
  const shown = state === 'offline' && !states.offline ? 'error' : state;
  if (shown === 'offline' && !online) return null;
  // vazio sem recado, ou falha que a página não declarou: o corpo desenha o dele (o vazio e o erro de cada widget)
  return states[shown] ? <StateView states={states} state={shown} onRetry={retry} /> : children;
}
