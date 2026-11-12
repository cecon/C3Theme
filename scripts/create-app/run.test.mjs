// Gera de verdade, numa pasta temporária com o template do repositório, e valida a spec gerada.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { run } from './run.mjs';

const repo = path.resolve(import.meta.dirname, '../..');
let root;
let out;
const io = () => ({ root, log: (s) => out.push(s), error: (s) => out.push(s) });

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'create-app-'));
  fs.cpSync(path.join(repo, 'templates'), path.join(root, 'templates'), { recursive: true });
  out = [];
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

describe('run', () => {
  it.each(['rust', 'node'])('gera o app pelo motor com backend %s e a spec passa no validador', (backend) => {
    const dir = backend === 'rust' ? 'crates/crm-api' : 'apps/crm-api';
    expect(run(['crm', '--backend', backend, '--title', 'CRM "da Ana"'], io())).toBe(0);
    expect(JSON.parse(read(`${dir}/spec/app.json`)).name).toBe('CRM "da Ana"');
    expect(read('apps/crm/src/App.tsx')).toContain('<C3Shell');
    expect(read('apps/crm/index.html')).toContain('<title>CRM &quot;da Ana&quot;</title>');
    expect(read('apps/crm/README.md')).toContain(`${dir}/spec/`);
    expect(fs.existsSync(path.join(root, dir, 'migrations/0001_contact.sql'))).toBe(true);
    expect(out.join('\n')).toContain(`backend ${backend}`);
    // o $schema aponta para spec/v0 do repositório, três níveis acima de <dir>/spec
    execFileSync('node', [path.join(repo, 'scripts/validate-spec.mjs'), path.join(root, dir, 'spec')], { cwd: repo, stdio: 'pipe' });
    expect(JSON.parse(read(`${dir}/spec/app.json`)).$schema).toBe('../../../spec/v0/app.schema.json');
  });

  it('o rust usa o crate com o nome do app e cita a entidade', () => {
    run(['crm'], io());
    expect(read('crates/crm-api/Cargo.toml')).toContain('name = "crm-api"');
    expect(read('crates/crm-api/src/main.rs')).toContain('include_str!("../spec/contact.json")');
  });

  it('não sobrescreve: recusa se o front ou o backend já existem', () => {
    fs.mkdirSync(path.join(root, 'crates/crm-api'), { recursive: true });
    expect(run(['crm'], io())).toBe(1);
    expect(out).toEqual(['crates/crm-api já existe']);
    expect(fs.existsSync(path.join(root, 'apps/crm'))).toBe(false);
  });

  it('--sem-motor saiu: recusa sem criar nada', () => {
    expect(run(['site', '--sem-motor'], io())).toBe(1);
    expect(out[0]).toContain('ADR 0003');
    expect(fs.existsSync(path.join(root, 'apps/site'))).toBe(false);
  });

  it('argumento inválido mostra o erro e o uso', () => {
    expect(run(['Crm'], io())).toBe(1);
    expect(out[0]).toContain('uso: pnpm create-app');
  });
});
