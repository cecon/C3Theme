export type Formula =
  | { num: number }
  | { ref: string }
  | { neg: Formula }
  | { sum: string; of: Formula }
  | { op: '+' | '-' | '*' | '/'; left: Formula; right: Formula };

export function parseFormula(src: string): Formula;
export function evalFormula(ast: Formula, record: Record<string, unknown>, vars?: Record<string, number>): number;
export function formulaRefs(ast: Formula): { own: string[]; lists: Record<string, string[]> };
