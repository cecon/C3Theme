import { describe, expect, it } from 'vitest';

import {
  approveTool,
  changedArgs,
  declineTool,
  inferType,
  isToolProposal,
  parseDraft,
  readDrafts,
  toDraft,
  toolAllows,
  toolFields,
  toolResult,
  type ArgField,
  type ToolProposal
} from './hitl';

const proposal: ToolProposal = {
  tool: { name: 'enviar_email', label: 'Enviar e-mail' },
  args: { para: 'ana@x.com', copias: 2, urgente: false, corpo: 'linha 1\nlinha 2', anexos: ['a.pdf'] }
};

describe('inferType', () => {
  it('sai do valor', () => {
    expect(inferType(1)).toBe('number');
    expect(inferType(true)).toBe('boolean');
    expect(inferType('curto')).toBe('string');
    expect(inferType('a\nb')).toBe('text');
    expect(inferType('x'.repeat(81))).toBe('text');
    expect(inferType('x'.repeat(80))).toBe('string');
    expect(inferType(null)).toBe('json');
    expect(inferType({ a: 1 })).toBe('json');
  });
});

describe('toolFields', () => {
  it('usa os declarados', () => {
    const fields: ArgField[] = [{ name: 'para', type: 'string' }];
    expect(toolFields({ ...proposal, fields })).toBe(fields);
  });
  it('infere um por argumento, na ordem', () => {
    expect(toolFields(proposal).map((f) => [f.name, f.type])).toEqual([
      ['para', 'string'],
      ['copias', 'number'],
      ['urgente', 'boolean'],
      ['corpo', 'text'],
      ['anexos', 'json']
    ]);
  });
});

describe('toDraft e parseDraft', () => {
  it('boolean vai e volta', () => {
    const f: ArgField = { name: 'b', type: 'boolean' };
    expect(toDraft(f, true)).toBe(true);
    expect(toDraft(f, 'sim')).toBe(false);
    expect(parseDraft(f, true)).toEqual({ ok: true, value: true });
    expect(parseDraft(f, 'true')).toEqual({ ok: true, value: false });
  });
  it('json indentado e lido de volta', () => {
    const f: ArgField = { name: 'j', type: 'json' };
    expect(toDraft(f, ['a'])).toBe('[\n  "a"\n]');
    expect(toDraft(f, undefined)).toBe('');
    expect(parseDraft(f, '{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
    expect(parseDraft(f, '{a')).toEqual({ ok: false, error: 'json' });
  });
  it('texto e número', () => {
    const n: ArgField = { name: 'n', type: 'number' };
    expect(toDraft(n, 3)).toBe('3');
    expect(toDraft(n, null)).toBe('');
    expect(toDraft(n, undefined)).toBe('');
    expect(parseDraft(n, '2,5')).toEqual({ ok: true, value: 2.5 });
    expect(parseDraft(n, 'dois')).toEqual({ ok: false, error: 'number' });
    expect(parseDraft({ name: 's', type: 'string' }, 'oi')).toEqual({ ok: true, value: 'oi' });
  });
  it('vazio: erro se obrigatório, senão sai', () => {
    expect(parseDraft({ name: 's', type: 'string', required: true }, '  ')).toEqual({ ok: false, error: 'required' });
    expect(parseDraft({ name: 's', type: 'string' }, '')).toEqual({ ok: true, value: undefined });
  });
  it('enum só aceita as opções', () => {
    const f: ArgField = { name: 'e', type: 'enum', options: [{ value: 'a' }] };
    expect(parseDraft(f, 'a')).toEqual({ ok: true, value: 'a' });
    expect(parseDraft(f, 'b')).toEqual({ ok: false, error: 'option' });
    expect(parseDraft({ name: 'e', type: 'enum' }, 'a')).toEqual({ ok: false, error: 'option' });
  });
});

describe('readDrafts', () => {
  const p: ToolProposal = {
    tool: { name: 't' },
    args: { id: '7', qtd: 1, obs: 'x' },
    fields: [
      { name: 'id', type: 'string', readOnly: true },
      { name: 'qtd', type: 'number', required: true },
      { name: 'obs', type: 'string' }
    ]
  };
  it('aplica o rascunho e tira o vazio', () => {
    expect(readDrafts(p, { id: '9', qtd: '3', obs: '' })).toEqual({ args: { id: '7', qtd: 3 }, errors: {} });
  });
  it('campo fora do rascunho fica como veio', () => {
    expect(readDrafts(p, {}).args).toEqual(p.args);
  });
  it('junta os erros por campo', () => {
    expect(readDrafts(p, { qtd: '' }).errors).toEqual({ qtd: 'required' });
  });
});

describe('changedArgs', () => {
  it('compara pelo JSON, nos dois lados', () => {
    expect(changedArgs({ a: { x: 1 }, b: 1 }, { a: { x: 1 }, b: 2, c: 3 })).toEqual(['b', 'c']);
    expect(changedArgs({ a: 1 }, {})).toEqual(['a']);
  });
});

describe('toolAllows', () => {
  it('padrões', () => {
    expect(toolAllows(proposal)).toEqual({ edit: true, respond: true, always: false });
  });
  it('desliga e liga', () => {
    expect(toolAllows({ ...proposal, allow: { edit: false, respond: false, always: true } })).toEqual({
      edit: false,
      respond: false,
      always: true
    });
  });
  it('risco alto nunca tem sempre permitir', () => {
    expect(toolAllows({ ...proposal, risk: 'high', allow: { always: true } }).always).toBe(false);
  });
});

describe('respostas', () => {
  it('aprovar diz o que mudou', () => {
    expect(approveTool(proposal, { ...proposal.args, copias: 3 })).toEqual({
      action: 'accept',
      values: { args: { ...proposal.args, copias: 3 }, edited: ['copias'] }
    });
  });
  it('sempre permitir só quando oferecido', () => {
    expect(approveTool(proposal, proposal.args, true).values).not.toHaveProperty('always');
    const p = { ...proposal, allow: { always: true } };
    expect(approveTool(p, p.args, true).values).toMatchObject({ always: true });
  });
  it('recusar leva o motivo aparado', () => {
    expect(declineTool('  outro dia ')).toEqual({ action: 'decline', values: { reason: 'outro dia' } });
    expect(declineTool('  ')).toEqual({ action: 'decline' });
    expect(declineTool()).toEqual({ action: 'decline' });
  });
});

describe('toolResult', () => {
  const part = (result: unknown) => ({ id: 'p', kind: 'c3.tool', payload: proposal, result });
  it('lê o resultado', () => {
    expect(toolResult(part({ args: { a: 1 }, edited: ['a', 2], always: true, reason: 'r' }))).toEqual({
      args: { a: 1 },
      edited: ['a'],
      always: true,
      reason: 'r'
    });
  });
  it('preenche o que faltar', () => {
    expect(toolResult(part({}))).toEqual({ args: {}, edited: [], always: undefined, reason: undefined });
    expect(toolResult(part('x'))).toBeUndefined();
    expect(toolResult(part(null))).toBeUndefined();
    expect(toolResult(part([]))).toBeUndefined();
  });
});

describe('isToolProposal', () => {
  it('confere o formato', () => {
    expect(isToolProposal(proposal)).toBe(true);
    expect(isToolProposal({ ...proposal, fields: [{ name: 'a', type: 'string' }] })).toBe(true);
    expect(isToolProposal({ ...proposal, fields: [{}] })).toBe(false);
    expect(isToolProposal({ ...proposal, fields: 'x' })).toBe(false);
    expect(isToolProposal({ tool: { name: '' }, args: {} })).toBe(false);
    expect(isToolProposal({ tool: { name: 1 }, args: {} })).toBe(false);
    expect(isToolProposal({ tool: 'x', args: {} })).toBe(false);
    expect(isToolProposal({ tool: { name: 'a' }, args: [] })).toBe(false);
    expect(isToolProposal(null)).toBe(false);
  });
});
