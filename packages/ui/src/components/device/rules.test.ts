import { describe, expect, it } from 'vitest';

import { findEntry, formatPhone, parseAllowValue } from './allowRules';
import { cleanPairingCode, elapsed, formatPairingCode, spellPairingCode } from './format';
import { qrModules, qrPath } from './qr';

describe('qr', () => {
  it('texto curto vira QR versão 1 (21 módulos) com o padrão de localização no canto', () => {
    const m = qrModules('hello');
    expect(m).toHaveLength(21);
    expect(m.every((row) => row.length === 21)).toBe(true);
    expect(m[0].slice(0, 7)).toEqual([true, true, true, true, true, true, true]);
  });

  it('texto vazio não desenha nada e acentos/emoji entram como UTF-8 (versão maior que o ASCII equivalente)', () => {
    expect(qrModules('')).toEqual([]);
    expect(qrModules('ação 😀'.repeat(3)).length).toBeGreaterThan(qrModules('acao :)'.repeat(3)).length);
  });

  it('o caminho junta módulos vizinhos da linha e soma a margem', () => {
    expect(
      qrPath(
        [
          [true, true, false],
          [false, false, true]
        ],
        4
      )
    ).toBe('M4 4h2v1h-2zM6 5h1v1h-1z');
  });
});

describe('código de pareamento', () => {
  it('limpa, agrupa em 4+4 e soletra', () => {
    expect(cleanPairingCode(' abcd-12 34 ')).toBe('ABCD1234');
    expect(formatPairingCode('abcd1234')).toBe('ABCD-1234');
    expect(formatPairingCode('ABC')).toBe('ABC');
    expect(spellPairingCode('ABCD1234')).toBe('A B C D, 1 2 3 4');
  });
});

describe('elapsed', () => {
  const now = Date.UTC(2026, 10, 9, 12);
  it('escolhe a maior unidade inteira, negativa', () => {
    expect(elapsed(now - 20_000, now)).toEqual({ value: 0, unit: 'second' });
    expect(elapsed(now - 5 * 60_000, now)).toEqual({ value: -5, unit: 'minute' });
    expect(elapsed(now - 3 * 3600_000, now)).toEqual({ value: -3, unit: 'hour' });
    expect(elapsed(now - 50 * 3600_000, now)).toEqual({ value: -2, unit: 'day' });
  });
  it('data no futuro (relógio adiantado) vira agora', () => {
    expect(elapsed(now + 60_000, now)).toEqual({ value: 0, unit: 'second' });
  });
});

describe('parseAllowValue', () => {
  it('telefone com máscara guarda só os dígitos', () => {
    expect(parseAllowValue('+55 (11) 98765-4321')).toEqual({ ok: true, kind: 'contact', value: '5511987654321' });
  });
  it('grupo termina em @g.us, em minúsculas', () => {
    expect(parseAllowValue('120363041234567890@G.US')).toEqual({ ok: true, kind: 'group', value: '120363041234567890@g.us' });
    expect(parseAllowValue('abc@g.us')).toEqual({ ok: false, error: 'invalid' });
  });
  it('recusa vazio, letras e telefone curto ou longo demais', () => {
    expect(parseAllowValue('  ')).toEqual({ ok: false, error: 'empty' });
    expect(parseAllowValue('joão')).toEqual({ ok: false, error: 'invalid' });
    expect(parseAllowValue('987654321')).toEqual({ ok: false, error: 'invalid' });
    expect(parseAllowValue('1234567890123456')).toEqual({ ok: false, error: 'invalid' });
  });
  it('acha duplicado pelo tipo e valor normalizado', () => {
    const entries = [{ id: '1', kind: 'contact' as const, value: '5511987654321', access: 'allowed' as const }];
    expect(findEntry(entries, 'contact', '5511987654321')?.id).toBe('1');
    expect(findEntry(entries, 'group', '5511987654321')).toBeUndefined();
  });
  it('formata telefone do Brasil e deixa o resto com +', () => {
    expect(formatPhone('5511987654321')).toBe('+55 11 98765-4321');
    expect(formatPhone('14155550100')).toBe('+14155550100');
  });
});
