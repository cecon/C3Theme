// `optionsFrom` (#30): a regra da spec e a conferência do valor contra a lista do próprio registro.
import { describe, expect, it } from 'vitest';

import { parseFields } from './field';
import { inRecordOptions } from './value';

const parse = (value: string, from: string, options: string) =>
  parseFields('t', [{ name: 'options', type: options }, { name: 'value', type: value, optionsFrom: from }], () => true);

describe('optionsFrom', () => {
  it('só em string, apontando para outro campo text', () => {
    expect(parse('string', 'options', 'text')[0][1].optionsFrom).toBe('options');
    for (const [v, f, o] of [
      ['integer', 'options', 'text'],
      ['string', 'options', 'string'],
      ['string', 'value', 'text'],
      ['string', 'nada', 'text']
    ])
      expect(() => parse(v, f, o)).toThrow(/optionsFrom/);
  });

  it('com lista, só um dos value; sem lista, texto livre', () => {
    const field = parse('string', 'options', 'text')[0][1];
    const options = JSON.stringify([{ value: 'A' }, { value: 'B' }]);
    expect(inRecordOptions(field, 'B', { options })).toBe(true);
    expect(inRecordOptions(field, 'C', { options })).toBe(false);
    for (const free of [null, '[]', 'texto']) expect(inRecordOptions(field, 'C', { options: free })).toBe(true);
    expect(inRecordOptions(parse('string', 'options', 'text')[0][0], 'C', { options })).toBe(true);
  });
});
