// Lê a linha de comando do create-app. Puro: devolve as opções ou o erro, quem chama decide o que fazer.

export const USAGE = `uso: pnpm create-app <nome> [--title "Nome de Exibição"] [--backend rust|node]

  <nome> em kebab-case, ex.: portal-clientes. Padrão do backend: rust.`;

const BACKENDS = ['rust', 'node'];

/** Saiu com o ADR 0003 (issue #74): não há app sem o motor. Erro próprio para quem tem o comando antigo salvo. */
const SEM_MOTOR = '--sem-motor saiu (ADR 0003): todo app sai do motor; rode sem ele';

/** @returns {{ name: string, title: string, backend: 'rust' | 'node' } | { error: string }} */
export function parseArgs(argv) {
  const opts = { name: undefined, title: undefined, backend: 'rust' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--title' || a === '--backend') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) return { error: `${a} precisa de um valor` };
      opts[a.slice(2)] = v;
    } else if (a === '--sem-motor') return { error: SEM_MOTOR };
    else if (a.startsWith('--')) return { error: `opção desconhecida: ${a}` };
    else if (opts.name === undefined) opts.name = a;
    else return { error: `nome repetido: ${a}` };
  }
  if (!opts.name || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(opts.name))
    return { error: 'o nome é obrigatório, em kebab-case (ex.: portal-clientes)' };
  if (opts.name.endsWith('-api')) return { error: 'o nome não pode terminar em -api: o backend já ganha esse sufixo' };
  if (!BACKENDS.includes(opts.backend)) return { error: `--backend é rust ou node, não ${opts.backend}` };
  const title = opts.title ?? titleOf(opts.name);
  // eslint-disable-next-line no-control-regex
  if (!title.trim() || title.length > 80 || /[\u0000-\u001f{}]/.test(title))
    return { error: '--title precisa ter de 1 a 80 caracteres, sem chaves nem quebra de linha' };
  return { ...opts, title: title.trim() };
}

/** portal-clientes → "Portal Clientes" */
export const titleOf = (name) => name.replace(/(^|-)(\w)/g, (_, sep, c) => (sep ? ' ' : '') + c.toUpperCase());
