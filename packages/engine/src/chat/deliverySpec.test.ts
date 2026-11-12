import { readFileSync, readdirSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

const schema = JSON.parse(readFileSync(new URL('../../../../spec/v0/app.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
for (const file of readdirSync(new URL('../../../../spec/v0', import.meta.url)).filter((name) => name.endsWith('.schema.json'))) {
  ajv.addSchema(JSON.parse(readFileSync(new URL(`../../../../spec/v0/${file}`, import.meta.url), 'utf8')));
}
const validate = ajv.compile({ $ref: `${schema.$id}#/$defs/chat` });

describe('contrato opcional de entrega na conversa', () => {
  it('mantém a spec anterior e aceita os quatro estados com motivo ausente, nulo ou texto', () => {
    expect(validate({})).toBe(true);
    for (const situacao of ['enviada', 'entregue', 'lida', 'falhou']) {
      for (const motivo of [undefined, null, 'Canal desconectado']) {
        expect(validate({ entregaDaUltimaMensagem: { situacao, ...(motivo !== undefined && { motivo }) } })).toBe(true);
      }
    }
  });

  it('rejeita campo desconhecido, situação desconhecida e motivo fora do contrato', () => {
    for (const entregaDaUltimaMensagem of [
      {},
      { situacao: 'sending' },
      { situacao: 'falhou', motivo: 123 },
      { situacao: 'lida', extra: true }
    ]) {
      expect(validate({ entregaDaUltimaMensagem })).toBe(false);
    }
  });
});
