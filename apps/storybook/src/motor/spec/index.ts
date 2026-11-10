// A spec que monta as histórias pelo motor: os mesmos arquivos que o `pnpm spec:check` valida e que o painel Code mostra.

import type { AppDef, EntityDef } from '@c3theme/engine';

import app from './app.json';
import cliente from './cliente.json';
import contaContabil from './conta_contabil.json';
import orcadoRealizado from './orcado_realizado.json';
import orcamento from './orcamento.json';
import configuracaoLoja from './configuracao_loja.json';
import evento from './evento.json';
import fatura from './fatura.json';
import fornecedor from './fornecedor.json';
import inventario from './inventario.json';
import inventarioItem from './inventario_item.json';
import loja from './loja.json';
import mesa from './mesa.json';
import notaItem from './nota_item.json';
import movimento from './movimento.json';
import produto from './produto.json';
import tarefa from './tarefa.json';
import vendedor from './vendedor.json';

export const APP = app as unknown as AppDef;

export const ENTITIES = [
  produto,
  fatura,
  loja,
  cliente,
  vendedor,
  fornecedor,
  tarefa,
  evento,
  mesa,
  movimento,
  inventario,
  inventarioItem,
  configuracaoLoja,
  notaItem,
  contaContabil,
  orcadoRealizado,
  orcamento
] as unknown as EntityDef[];
