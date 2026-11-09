import { describe, expect, it } from 'vitest';

import { planEngineApp } from './plan.mjs';
import { planSeedApp } from './seed.mjs';

const templates = {
  files: (group) => [[`${group}.txt`, `${group} {{name}} {{title}} {{api}} {{apiDir}} {{apiDev}} {{hooksFile}}{{rustEntityStep}}`]]
};

describe('planEngineApp', () => {
  it('rust: front em apps/, backend em crates/<nome>-api com spec e migrations', () => {
    const plan = planEngineApp({ name: 'crm', title: 'CRM', backend: 'rust' }, templates);
    expect(plan.dirs).toEqual(['apps/crm', 'crates/crm-api']);
    expect(plan.files.map((f) => f.path)).toEqual([
      'apps/crm/web.txt',
      'crates/crm-api/rust.txt',
      'crates/crm-api/spec/spec.txt',
      'crates/crm-api/migrations/migrations.txt'
    ]);
    expect(plan.files[0].content).toContain('web crm CRM crm-api crates/crm-api cargo run -p crm-api src/main.rs');
    expect(plan.files[0].content).toContain('.entity(include_str!');
    expect(plan.next.join('\n')).toContain('cargo run -p crm-api');
  });

  it('node: backend em apps/<nome>-api, hooks em src/hooks.ts', () => {
    const plan = planEngineApp({ name: 'crm', title: 'CRM', backend: 'node' }, templates);
    expect(plan.dirs).toEqual(['apps/crm', 'apps/crm-api']);
    expect(plan.files[1]).toEqual({
      path: 'apps/crm-api/node.txt',
      content: 'node crm CRM crm-api apps/crm-api pnpm --filter @c3theme/crm-api dev src/hooks.ts'
    });
    expect(plan.next[0]).toBe('pnpm install');
  });

  it('recusa backend desconhecido', () => {
    expect(() => planEngineApp({ name: 'crm', title: 'CRM', backend: 'go' }, templates)).toThrow('backend desconhecido');
  });
});

describe('planSeedApp', () => {
  it('copia o seed e troca nome, título e chave', () => {
    const plan = planSeedApp({ name: 'site', title: "D'Ávila <&>" });
    expect(plan).toMatchObject({ from: 'apps/seed', to: 'apps/site' });
    const [pkg, config, html] = plan.edits.map(([, fn]) => fn);
    expect(pkg('"name": "@c3theme/seed"')).toBe('"name": "@c3theme/site"');
    expect(config("export const APP_NAME = 'C3Theme'; 'c3theme-seed-config'")).toBe(
      "export const APP_NAME = 'D\\'Ávila <&>'; 'c3theme-site-config'"
    );
    expect(html('<title>C3Theme</title>')).toBe("<title>D'Ávila &lt;&amp;&gt;</title>");
  });
});
