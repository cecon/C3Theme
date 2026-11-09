// As specs das telas por JSON: os mesmos arquivos que o `pnpm spec:check` valida e que o botão de código mostra.

import type { AppDef, EntityDef } from '@c3theme/engine';

import app from './app.json';
import cliente from './cliente.json';
import clienteFatura from './cliente_fatura.json';
import evento from './evento.json';
import fatura from './fatura.json';
import faturaItem from './fatura_item.json';
import membro from './membro.json';
import notificacao from './notificacao.json';
import pessoa from './pessoa.json';
import receitaMes from './receita_mes.json';
import tarefa from './tarefa.json';

export const APP = app as unknown as AppDef;

export const SPECS: Record<string, unknown> = {
  app,
  pessoa,
  cliente,
  cliente_fatura: clienteFatura,
  fatura,
  fatura_item: faturaItem,
  membro,
  tarefa,
  evento,
  notificacao
};

export const ENTITIES = [
  pessoa,
  cliente,
  clienteFatura,
  fatura,
  faturaItem,
  membro,
  tarefa,
  evento,
  notificacao,
  receitaMes
] as unknown as EntityDef[];
