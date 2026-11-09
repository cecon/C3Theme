// Backend de {{title}} no @c3theme/engine-node. As telas são os JSONs de spec/ (app.json e uma entidade por
// arquivo); o banco é das migrations/; as regras de negócio ficam em src/hooks.ts.
// Variáveis: DATABASE_URL (padrão {{name}}.db), PORT (padrão 3001).

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

import { buildEngine, engineListener } from '@c3theme/engine-node';
import { BetterSqliteStore } from '@c3theme/engine-node/better-sqlite3';

import { appHooks } from './hooks';
import { migrate } from './migrate';

const ROOT = new URL('..', import.meta.url).pathname;
const spec = (name: string) => readFileSync(join(ROOT, 'spec', `${name}.json`), 'utf8');

const file = (process.env.DATABASE_URL ?? '{{name}}.db').replace(/^sqlite:\/\//, '');
const port = Number(process.env.PORT ?? 3001);

const store = new BetterSqliteStore(file);
migrate(store.database, join(ROOT, 'migrations'));

// o app.json lista as entidades; cada uma é spec/<nome>.json. O motor confere spec x banco aqui e recusa subir se
// não baterem.
const app = spec('app');
const entities = (JSON.parse(app) as { entities: string[] }).entities.map(spec);
const engine = await buildEngine({ store, app, entities, hooks: appHooks });

createServer(engineListener(engine, { prefix: '/api' })).listen(port, '127.0.0.1', () =>
  console.log(`{{api}} ouvindo em http://127.0.0.1:${port}/api`)
);
