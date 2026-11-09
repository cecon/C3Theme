// filial ativa guardada na sessão do navegador (não na URL)

const BRANCH_KEY = 'c3.branch';

export function readStoredBranch(): string | null {
  try {
    return sessionStorage.getItem(BRANCH_KEY);
  } catch {
    return null;
  }
}

export function storeBranch(id: string) {
  try {
    sessionStorage.setItem(BRANCH_KEY, id);
  } catch {
    /* sem storage: a filial vale só até recarregar */
  }
}
