import { describe, expect, it } from 'vitest';

import { allFlags, decodedSize, fileProblem, formatDecimal, formatMoney, optionValue, parseDecimal } from './values';

describe('parseDecimal', () => {
  it('aceita vírgula ou ponto e grava com ponto', () => {
    expect(parseDecimal('12,5')).toBe('12.5');
    expect(parseDecimal('12.5')).toBe('12.5');
    expect(parseDecimal(' 1 234 ')).toBe('1234');
  });
  it('vazio é null e lixo é recusado', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('1a')).toBeUndefined();
    expect(parseDecimal('1,2,3')).toBeUndefined();
  });
  it('corta além da escala e recusa separador com escala 0', () => {
    expect(parseDecimal('1,239', 2)).toBe('1.23');
    expect(parseDecimal('1,', 2)).toBe('1.');
    expect(parseDecimal('1,5', 0)).toBeUndefined();
  });
  it('negativo só quando permitido', () => {
    expect(parseDecimal('-3')).toBe('-3');
    expect(parseDecimal('-3', 2, false)).toBeUndefined();
    expect(parseDecimal('-', 2)).toBe('-');
  });
});

describe('formatDecimal', () => {
  it('agrupa milhar e completa a escala', () => {
    expect(formatDecimal('1234.5', 2, 'pt-BR')).toBe('1.234,50');
    expect(formatDecimal('-0.125', 3, 'en-US')).toBe('-0.125');
    expect(formatDecimal('7', 0, 'pt-BR')).toBe('7');
  });
});

describe('formatMoney', () => {
  it('põe o símbolo onde o idioma põe, sem perder casas', () => {
    expect(formatMoney('9568.2', 2, 'BRL', 'pt-BR')).toBe('R$\u00a09.568,20');
    expect(formatMoney('-1234.5', 2, 'USD', 'en-US')).toBe('-$1,234.50');
    expect(formatMoney('-3', 2, 'BRL', 'pt-BR')).toBe('-R$\u00a03,00');
  });
});

describe('flags e arquivo', () => {
  it('soma os bits das opções', () => {
    expect(allFlags([{ value: 1 }, { value: 2 }, { value: 64 }])).toBe(67);
  });
  it('mede o base64 sem decodificar', () => {
    expect(decodedSize(btoa('abcd'))).toBe(4);
    expect(decodedSize(btoa('abcde'))).toBe(5);
  });
  it('confere extensão, tamanho e arquivo vazio', () => {
    expect(fileProblem({ name: 'cert.PFX', size: 10 }, ['.pfx'], 100)).toBeNull();
    expect(fileProblem({ name: 'cert.txt', size: 10 }, ['.pfx'], 100)).toBe('type');
    expect(fileProblem({ name: 'a.pfx', size: 101 }, [], 100)).toBe('large');
    expect(fileProblem({ name: 'a.pfx', size: 0 }, [], 100)).toBe('empty');
  });
});

describe('optionValue', () => {
  const numeros = [{ value: 1 }, { value: 2 }];
  it('acha a opção numérica pelo número (Select do MUI) ou pelo texto (select nativo)', () => {
    expect(optionValue(numeros, 2)).toBe(2);
    expect(optionValue(numeros, '2')).toBe(2);
  });
  it('mantém o texto da opção e dá null no vazio ou no que não existe', () => {
    expect(optionValue([{ value: 'PISTA' }], 'PISTA')).toBe('PISTA');
    expect(optionValue(numeros, '')).toBeNull();
    expect(optionValue(numeros, undefined)).toBeNull();
    expect(optionValue(numeros, 3)).toBeNull();
  });
});
