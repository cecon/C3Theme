// CPF, CNPJ e telefone (spec: `format` em string). Mesma regra no backend; casos em spec/v0/conformance/documents.json.
// O valor trafega sem máscara: CPF com 11 dígitos; CNPJ com 12 caracteres [0-9A-Z] e 2 dígitos verificadores
// (alfanumérico desde jul/2026; o numérico antigo é o caso particular só com dígitos).

const SHAPE = { cpf: /^\d{11}$/, cnpj: /^[0-9A-Z]{12}\d{2}$/, phone: /^\d{10,11}$/ };

/** Dígito verificador módulo 11: pesos de 2 a `max` da direita para a esquerda. */
function mod11(values, max) {
  let sum = 0;
  for (let i = values.length - 1, w = 2; i >= 0; i--, w = w === max ? 2 : w + 1) sum += values[i] * w;
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

function checkDigitsOk(kind, value) {
  if (/^(.)\1*$/.test(value)) return false; // 000.000.000-00 passa no cálculo mas não existe
  // CNPJ alfanumérico: cada caractere vale o código ASCII menos 48 ('0' = 0, 'A' = 17)
  const values = [...value].map((c) => c.charCodeAt(0) - 48);
  const max = kind === 'cpf' ? 11 : 9;
  const n = values.length;
  const d1 = mod11(values.slice(0, n - 2), max);
  const d2 = mod11([...values.slice(0, n - 2), d1], max);
  return values[n - 2] === d1 && values[n - 1] === d2;
}

/** Qual documento o valor é, pelo tamanho; null se não cabe no formato. */
export function documentKind(format, value) {
  if (format === 'cpf_cnpj') return value.length === 11 ? 'cpf' : value.length === 14 ? 'cnpj' : null;
  return format;
}

/** null = válido; 'pattern' = forma errada (máscara, minúscula, tamanho); 'check_digit' = dígito errado. */
export function documentError(format, value) {
  const kind = documentKind(format, value);
  if (!kind || !SHAPE[kind].test(value)) return 'pattern';
  if (kind === 'phone') return null; // telefone não tem dígito verificador
  return checkDigitsOk(kind, value) ? null : 'check_digit';
}

/** O que o usuário digitou → valor trafegado: sem pontuação, maiúsculo. */
export function normalizeDocument(input) {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

/**
 * Valor trafegado → com máscara (000.000.000-00, AA.AAA.AAA/AAAA-00); parcial enquanto digita. Em
 * `cpf_cnpj`, até 11 dígitos é CPF.
 */
export function maskDocument(value, format = 'cpf_cnpj') {
  if (format === 'phone') return maskPhone(value);
  const v = normalizeDocument(value);
  if (format === 'cpf' || (format === 'cpf_cnpj' && v.length <= 11 && /^\d*$/.test(v))) {
    return v
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return v
    .slice(0, 14)
    .replace(/^(\w{2})(\w)/, '$1.$2')
    .replace(/^(\w{2})\.(\w{3})(\w)/, '$1.$2.$3')
    .replace(/\.(\w{3})(\w)/, '.$1/$2')
    .replace(/(\w{4})(\w)/, '$1-$2');
}

/** Telefone com DDD: (11) 3123-4567 com 10 dígitos, (11) 98123-4567 com 11; parcial enquanto digita. */
function maskPhone(value) {
  const v = value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 2) return v && `(${v}`;
  const [ddd, rest] = [v.slice(0, 2), v.slice(2)];
  const cut = rest.length > 8 ? 5 : 4;
  return rest.length > cut ? `(${ddd}) ${rest.slice(0, cut)}-${rest.slice(cut)}` : `(${ddd}) ${rest}`;
}
