// A suíte de conformidade (packages/conformance) em processo, contra o CRM de exemplo sobre o @c3theme/engine-node num
// banco temporário. É a mesma que `pnpm conformance node` roda contra o processo separado; aqui ela entra na
// cobertura do engine-node (o que o contrato exercita no motor conta, inclusive o adaptador HTTP do Node).
import { mkdtempSync, rmSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildSuite } from '@c3theme/conformance/src/suite.mjs';
import { afterAll, describe, it } from 'vitest';

import { exampleServer } from './server';

const dir = mkdtempSync(join(tmpdir(), 'c3-example-node-'));
const example = await exampleServer(join(dir, 'crm.db'));
await new Promise<void>((resolve) => example.server.listen(0, '127.0.0.1', resolve));
const { port } = example.server.address() as AddressInfo;
const { tests } = buildSuite(`http://127.0.0.1:${port}/api`);

afterAll(() => {
  example.close();
  rmSync(dir, { recursive: true, force: true });
});

// em ordem: os testes de uma execução dependem dos dados que os anteriores criaram
describe('conformidade do contrato C3 (engine-node em processo)', () => {
  for (const t of tests) it(`[${t.group}] ${t.name}`, t.fn, 20_000);
});
