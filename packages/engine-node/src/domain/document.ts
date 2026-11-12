// CPF, CNPJ e telefone (spec: `format` em string). Mesma regra da shell (packages/engine/src/documents.mjs) e do
// c3-engine; as três precisam concordar com spec/v0/conformance/documents.json.
//
// O valor trafega sem máscara: CPF com 11 dígitos; CNPJ com 12 caracteres [0-9A-Z] e 2 dígitos verificadores
// (alfanumérico desde jul/2026; o numérico antigo é o caso particular só com dígitos).

export type DocFormat = 'cpf' | 'cnpj' | 'cpf_cnpj' | 'phone' | 'shortcut';

export const DOC_FORMATS: readonly DocFormat[] = ['cpf', 'cnpj', 'cpf_cnpj', 'phone', 'shortcut'];

const MODIFIERS = ['Ctrl', 'Alt', 'Shift', 'Meta'];
const NAMED = new Set([
  'Space',
  'Enter',
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Up',
  'Down',
  'Left',
  'Right',
  'Plus',
  'Minus',
  'Comma',
  'Period',
  'Slash'
]);

/** Atalho de teclado (#110): modificadores na ordem Ctrl, Alt, Shift, Meta, sem repetir, e a tecla no fim; sem modificador, só F1 a F24. */
function shortcutOk(value: string): boolean {
  const parts = value.split('+');
  const key = parts.pop() ?? '';
  let last = -1;
  for (const m of parts) {
    const i = MODIFIERS.indexOf(m);
    if (i <= last) return false;
    last = i;
  }
  const fn = /^F([1-9]|1\d|2[0-4])$/.test(key);
  return (fn || /^[A-Z0-9]$/.test(key) || NAMED.has(key)) && (parts.length > 0 || fn);
}

/** Dígito verificador módulo 11: pesos de 2 a `max`, da direita para a esquerda. */
function mod11(values: number[], max: number): number {
  let w = 2;
  let sum = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    sum += values[i] * w;
    w = w === max ? 2 : w + 1;
  }
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

/** `undefined` = válido; `pattern` = forma errada (máscara, minúscula, tamanho); `check_digit` = dígito errado. */
export function documentError(format: DocFormat, value: string): 'pattern' | 'check_digit' | undefined {
  if (format === 'phone') return /^\d{10,11}$/.test(value) ? undefined : 'pattern';
  if (format === 'shortcut') return shortcutOk(value) ? undefined : 'pattern';
  let cnpj: boolean;
  if (format === 'cpf' || (format === 'cpf_cnpj' && value.length === 11)) cnpj = false;
  else if (format === 'cnpj' || (format === 'cpf_cnpj' && value.length === 14)) cnpj = true;
  else return 'pattern';
  const shape = cnpj ? /^[0-9A-Z]{12}\d{2}$/.test(value) : /^\d{11}$/.test(value);
  if (!shape) return 'pattern';
  // 000.000.000-00 passa no cálculo mas não existe
  if ([...value].every((c) => c === value[0])) return 'check_digit';
  // CNPJ alfanumérico: cada caractere vale o código ASCII menos 48 ('0' = 0, 'A' = 17)
  const values = [...value].map((c) => c.charCodeAt(0) - 48);
  const max = cnpj ? 9 : 11;
  const n = values.length;
  const d1 = mod11(values.slice(0, n - 2), max);
  const d2 = mod11([...values.slice(0, n - 2), d1], max);
  return values[n - 2] !== d1 || values[n - 1] !== d2 ? 'check_digit' : undefined;
}
