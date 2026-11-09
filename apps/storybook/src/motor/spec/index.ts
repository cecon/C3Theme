// A spec que monta as histórias pelo motor: os mesmos arquivos que o `pnpm spec:check` valida e que o painel Code mostra.

import type { AppDef, EntityDef } from '@c3theme/engine';

import app from './app.json';
import cliente from './cliente.json';
import evento from './evento.json';
import fatura from './fatura.json';
import fornecedor from './fornecedor.json';
import loja from './loja.json';
import mesa from './mesa.json';
import produto from './produto.json';
import tarefa from './tarefa.json';
import vendedor from './vendedor.json';

export const APP = app as unknown as AppDef;

export const ENTITIES = [produto, fatura, loja, cliente, vendedor, fornecedor, tarefa, evento, mesa] as unknown as EntityDef[];
