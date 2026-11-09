// O que o create-app gera, sem tocar no disco (o domínio). O template entra por uma porta:
// `templates.files(grupo)` devolve [caminho relativo, conteúdo][] de templates/create-app/<grupo>.

import { render } from './render.mjs';

const BACKENDS = {
  node: {
    dir: (name) => `apps/${name}-api`,
    hooksFile: 'src/hooks.ts',
    dev: (name) => `pnpm --filter @c3theme/${name}-api dev`,
    rustEntityStep: ''
  },
  rust: {
    dir: (name) => `crates/${name}-api`,
    hooksFile: 'src/main.rs',
    dev: (name) => `cargo run -p ${name}-api`,
    rustEntityStep: '\n   No Rust, acrescente também a linha `.entity(include_str!("../spec/<entidade>.json"))` em `src/main.rs`.'
  }
};

/**
 * App montado pelo motor: front em apps/<nome> (só a C3Shell) e backend em <dir do backend> com spec/ e migrations/.
 * @param {{ name: string, title: string, backend: 'rust' | 'node' }} opts
 * @param {{ files(group: string): [string, string][] }} templates
 * @returns {{ dirs: string[], files: { path: string, content: string }[], next: string[] }}
 */
export function planEngineApp({ name, title, backend }, templates) {
  const b = BACKENDS[backend];
  if (!b) throw new Error(`backend desconhecido: ${backend}`);
  const web = `apps/${name}`;
  const api = b.dir(name);
  const vars = {
    name,
    title,
    api: `${name}-api`,
    apiDir: api,
    hooksFile: b.hooksFile,
    apiDev: b.dev(name),
    rustEntityStep: b.rustEntityStep
  };
  const groups = [
    ['web', web],
    [backend, api],
    ['spec', `${api}/spec`],
    ['migrations', `${api}/migrations`]
  ];
  const files = groups.flatMap(([group, to]) =>
    templates.files(group).map(([rel, content]) => {
      const path = `${to}/${rel}`;
      return { path, content: render(content, vars, path) };
    })
  );
  const install =
    backend === 'node' ? ['pnpm install'] : ['pnpm install', `# o Cargo.lock ganha o crate ${name}-api na primeira compilação`];
  return {
    dirs: [web, api],
    files,
    next: [
      ...install,
      `${b.dev(name)}   # terminal 1: API em http://127.0.0.1:3001/api`,
      `pnpm --filter @c3theme/${name} dev   # terminal 2: shell em http://localhost:5173`,
      `node scripts/validate-spec.mjs ${api}/spec   # depois de mexer nas telas`
    ]
  };
}
