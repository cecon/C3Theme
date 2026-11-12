export type DocumentFormat = 'cpf' | 'cnpj' | 'cpf_cnpj' | 'phone' | 'shortcut';

export function documentKind(format: DocumentFormat, value: string): 'cpf' | 'cnpj' | 'phone' | null;
export function documentError(format: DocumentFormat, value: string): null | 'pattern' | 'check_digit';
export function normalizeDocument(input: string): string;
export function maskDocument(value: string, format?: DocumentFormat): string;
