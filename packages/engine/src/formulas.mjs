// Fórmulas de exibição da spec v0 (spec/README.md, "Fórmula"): conta que a shell mostra enquanto o usuário
// digita (total do item, resumo da fatura). Só soma, subtrai, multiplica e divide números e campos, com
// parênteses, e soma uma conta sobre as linhas de uma lista with_parent: `sum(fatura_item, quantidade * preco)`.
// Não grava nada: o valor gravado (o total da fatura) é regra do backend. Fica em .mjs para o pnpm spec:check
// conferir os campos citados com o mesmo parser.

const TOKEN = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|([-+*/(),]))/y;

function tokenize(src) {
  const out = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < src.length) {
    if (/^\s*$/.test(src.slice(TOKEN.lastIndex))) break;
    const at = TOKEN.lastIndex;
    const m = TOKEN.exec(src);
    if (!m) throw new Error(`fórmula '${src}': caractere inesperado na posição ${at + 1}`);
    out.push(m[1] !== undefined ? { num: Number(m[1]) } : m[2] !== undefined ? { id: m[2] } : { op: m[3] });
  }
  return out;
}

/** Lê a fórmula; erro de sintaxe lança, com a fórmula na mensagem. */
export function parseFormula(src) {
  const toks = tokenize(String(src));
  let i = 0;
  const fail = (why) => {
    throw new Error(`fórmula '${src}': ${why}`);
  };
  const peek = (op) => toks[i]?.op === op;
  const expect = (op) => (peek(op) ? i++ : fail(`esperava '${op}'`));

  const factor = () => {
    const t = toks[i++];
    if (!t) return fail('terminou no meio');
    if (t.num !== undefined) return { num: t.num };
    if (t.op === '-') return { neg: factor() };
    if (t.op === '(') {
      const e = expr();
      expect(')');
      return e;
    }
    if (t.id === 'sum' && peek('(')) {
      i++;
      const list = toks[i++];
      if (list?.id === undefined) fail('sum precisa do nome da lista');
      expect(',');
      const of = expr();
      expect(')');
      return { sum: list.id, of };
    }
    if (t.id !== undefined) return { ref: t.id };
    return fail(`'${t.op}' fora do lugar`);
  };
  const term = () => {
    let left = factor();
    while (peek('*') || peek('/')) left = { op: toks[i++].op, left, right: factor() };
    return left;
  };
  const expr = () => {
    let left = term();
    while (peek('+') || peek('-')) left = { op: toks[i++].op, left, right: term() };
    return left;
  };
  const ast = expr();
  if (i < toks.length) fail('sobrou texto no fim');
  return ast;
}

const num = (v) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
};

/**
 * Valor da fórmula sobre o registro. Nome citado vale, nesta ordem, o de `vars` (linhas anteriores do resumo) e o
 * campo do registro; vazio ou não numérico vale 0, e divisão por zero dá 0, para o resumo nunca mostrar NaN.
 */
export function evalFormula(ast, record, vars = {}) {
  if ('num' in ast) return ast.num;
  if ('neg' in ast) return -evalFormula(ast.neg, record, vars);
  if ('ref' in ast) return ast.ref in vars ? vars[ast.ref] : num(record[ast.ref]);
  if ('sum' in ast) {
    const rows = Array.isArray(record[ast.sum]) ? record[ast.sum] : [];
    return rows.reduce((acc, row) => acc + evalFormula(ast.of, row), 0);
  }
  const a = evalFormula(ast.left, record, vars);
  const b = evalFormula(ast.right, record, vars);
  if (ast.op === '+') return a + b;
  if (ast.op === '-') return a - b;
  if (ast.op === '*') return a * b;
  return b === 0 ? 0 : a / b;
}

/** Nomes que a fórmula cita: `own` no registro e, em `lists`, os de cada `sum(lista, ...)`. */
export function formulaRefs(ast) {
  const own = new Set();
  const lists = {};
  const walk = (n, into) => {
    if ('ref' in n) into.add(n.ref);
    else if ('neg' in n) walk(n.neg, into);
    else if ('sum' in n) walk(n.of, (lists[n.sum] ??= new Set()));
    else if ('op' in n) {
      walk(n.left, into);
      walk(n.right, into);
    }
  };
  walk(ast, own);
  return { own: [...own], lists: Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, [...v]])) };
}
