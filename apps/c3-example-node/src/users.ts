// Usuários de teste da suíte (spec/v0/conformance/README.md). Autenticação de verdade é do sistema; aqui o "token" é
// o nome do usuário (`Bearer caio@7`: o usuário caio, da empresa 7). Sem Authorization, o usuário enxerga tudo.

import { ALL, type Capabilities, type EngineRequest, NONE, type OrgAccess, READ_ONLY } from '@c3theme/engine-node';

export function token(req: EngineRequest): string | undefined {
  const h = req.headers.authorization;
  return h?.startsWith('Bearer ') ? h.slice(7) : undefined;
}

export function user(req: EngineRequest): string | undefined {
  const t = token(req);
  return t === undefined ? undefined : t.split('@')[0];
}

export function orgAccess(req: EngineRequest): OrgAccess {
  switch (user(req)) {
    case undefined:
    case 'admin': // o login de demonstração: enxerga e grava em todas as filiais
      return { defaultBranch: '1' };
    case 'ana': // Alfa: grava na matriz, só consulta o Centro
      return { branches: ['1', '2'], defaultBranch: '1' };
    case 'beto': // Beta: só a loja 1
      return { branches: ['3'], defaultBranch: '3' };
    case 'caio': // todas as filiais, mas sem os códigos de fornecedor, fiscal e crédito
      return { defaultBranch: '1' };
    default:
      return { branches: [] };
  }
}

export function capabilities(entity: string, branch: string | undefined, req: EngineRequest): Capabilities {
  if (user(req) === 'ana' && branch === '2') return entity === 'seller' ? NONE : READ_ONLY;
  // como no Nati: a filha with_parent só lê; quem grava é o formulário do pai
  return entity === 'company_fiscal' ? READ_ONLY : ALL;
}

/** Códigos de company.json (rowAccess, seções) e customer.json (credit_limit). */
export const permitted = (code: string, _b: string | undefined, req: EngineRequest): boolean =>
  user(req) !== 'caio' || ['empresa.cliente', 'empresa.propria'].includes(code);

export function userValue(key: string, req: EngineRequest): unknown {
  const t = token(req);
  const at = t?.indexOf('@') ?? -1;
  return key === 'company' && t !== undefined && at >= 0 ? t.slice(at + 1) : null;
}

/** ana só consulta o Centro: lê o pedido de lá, mas não age. */
export const actionAllowed = (_e: string, _a: string, branch: string | undefined, req: EngineRequest): boolean =>
  !(user(req) === 'ana' && branch === '2');
