// `access` em campo e seção (spec/README.md, "Permissão por linha, seção e campo"): códigos opacos do sistema para
// ver e para alterar. Vazio = livre. Seção e campo se somam (os dois valem).

export interface Access {
  view: string[];
  edit: string[];
}

export function parseAccess(v: unknown): Access {
  const code = (k: string): string[] => {
    const c = v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined;
    return typeof c === 'string' ? [c] : [];
  };
  return { view: code('view'), edit: code('edit') };
}

export const isFreeAccess = (a: Access): boolean => a.view.length === 0 && a.edit.length === 0;

export function addAccess(a: Access, other: Access): void {
  a.view.push(...other.view);
  a.edit.push(...other.edit);
}
