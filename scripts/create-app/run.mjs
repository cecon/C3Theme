// Liga a linha de comando ao plano e ao disco. Devolve o código de saída; quem chama dá o process.exit.

import path from 'node:path';

import { USAGE, parseArgs } from './args.mjs';
import { existing, templateDir, writeFiles } from './fs.mjs';
import { planEngineApp } from './plan.mjs';

const steps = (next) => next.map((l) => `  ${l}`).join('\n');

/**
 * @param {string[]} argv argumentos depois do nome do script
 * @param {{ root: string, log?: (s: string) => void, error?: (s: string) => void }} io
 */
export function run(argv, { root, log = console.log, error = console.error }) {
  const opts = parseArgs(argv);
  if ('error' in opts) {
    error(`${opts.error}\n\n${USAGE}`);
    return 1;
  }
  const plan = planEngineApp(opts, templateDir(path.join(root, 'templates', 'create-app')));
  const taken = existing(root, plan.dirs);
  if (taken) {
    error(`${taken} já existe`);
    return 1;
  }
  writeFiles(root, plan.files);
  log(`✔ "${opts.title}" criado pelo motor, backend ${opts.backend}:
  ${plan.dirs[0]}   front: só a C3Shell, sem tela em TS
  ${plan.dirs[1]}   telas em spec/, banco em migrations/

próximos passos:
${steps(plan.next)}`);
  return 0;
}
