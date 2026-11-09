import { describe, expect, it } from 'vitest';

import { parseArgs, titleOf } from './args.mjs';

describe('parseArgs', () => {
  it('padrão: motor com backend rust e título do nome', () => {
    expect(parseArgs(['portal-clientes'])).toEqual({
      name: 'portal-clientes',
      title: 'Portal Clientes',
      backend: 'rust',
      withoutEngine: false
    });
  });

  it('lê --title, --backend e --sem-motor em qualquer ordem', () => {
    expect(parseArgs(['--backend', 'node', 'crm', '--title', ' Meu CRM '])).toMatchObject({
      name: 'crm',
      title: 'Meu CRM',
      backend: 'node'
    });
    expect(parseArgs(['site', '--sem-motor'])).toMatchObject({ name: 'site', withoutEngine: true });
  });

  it.each([
    [[], 'kebab-case'],
    [['Portal'], 'kebab-case'],
    [['a--b'], 'kebab-case'],
    [['crm-api'], '-api'],
    [['crm', 'outro'], 'nome repetido'],
    [['crm', '--backend', 'go'], 'rust ou node'],
    [['crm', '--backend'], 'precisa de um valor'],
    [['crm', '--title', '--backend'], 'precisa de um valor'],
    [['crm', '--xyz'], 'desconhecida'],
    [['crm', '--sem-motor', '--backend', 'node'], 'não tem backend'],
    [['crm', '--title', '   '], '--title'],
    [['crm', '--title', 'a{{b}}'], '--title'],
    [['crm', '--title', 'linha\nnova'], '--title'],
    [['crm', '--title', 'x'.repeat(81)], '--title']
  ])('recusa %j', (argv, msg) => {
    const r = parseArgs(argv);
    expect('error' in r && r.error).toContain(msg);
  });

  it('titleOf capitaliza cada parte', () => {
    expect(titleOf('a-b2-c')).toBe('A B2 C');
  });
});
