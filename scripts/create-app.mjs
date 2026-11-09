// Cria um sistema novo montado pelo motor (docs/adr/0001-motor-dsl-caminho-padrao.md): front em apps/<nome> e
// backend Rust (crates/<nome>-api) ou Node (apps/<nome>-api) com as telas em JSON. Template: templates/create-app.
// Uso: pnpm create-app <nome> [--title "Nome"] [--backend rust|node]   (ver scripts/create-app/args.mjs)
import path from 'node:path';

import { run } from './create-app/run.mjs';

process.exit(run(process.argv.slice(2), { root: path.resolve(import.meta.dirname, '..') }));
