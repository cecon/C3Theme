import { describe, expect, it } from 'vitest';

import {
  addDays,
  datePattern,
  datePlaceholder,
  formatIsoDate,
  maskDate,
  maskTime,
  monthGrid,
  parseDateText,
  parseTimeText
} from './dateText';

const BR = datePattern('pt-BR');
const US = datePattern('en-US');

describe('datePattern', () => {
  it('segue o idioma do app, não o do navegador', () => {
    expect(BR).toEqual({ order: ['day', 'month', 'year'], sep: '/' });
    expect(US).toEqual({ order: ['month', 'day', 'year'], sep: '/' });
    expect(datePattern('de-DE').sep).toBe('.');
  });

  it('monta a máscara com as letras do idioma', () => {
    expect(datePlaceholder(BR, 'dma')).toBe('dd/mm/aaaa');
    expect(datePlaceholder(US, 'dmy')).toBe('mm/dd/yyyy');
  });
});

describe('formatIsoDate e parseDateText', () => {
  it('ida e volta em pt-BR e en-US', () => {
    expect(formatIsoDate('2026-10-31', BR)).toBe('31/10/2026');
    expect(formatIsoDate('2026-10-31', US)).toBe('10/31/2026');
    expect(parseDateText('31/10/2026', BR)).toBe('2026-10-31');
    expect(parseDateText('10/31/2026', US)).toBe('2026-10-31');
  });

  it('vazio é null; incompleto ou dia que não existe é inválido', () => {
    expect(formatIsoDate(null, BR)).toBe('');
    expect(parseDateText('', BR)).toBeNull();
    expect(parseDateText('31/10', BR)).toBe('invalid');
    expect(parseDateText('31/02/2026', BR)).toBe('invalid');
    expect(parseDateText('29/02/2028', BR)).toBe('2028-02-29');
    expect(parseDateText('00/10/2026', BR)).toBe('invalid');
  });
});

describe('maskDate', () => {
  it('põe a barra sozinha ao digitar', () => {
    expect(maskDate('3', BR, '')).toBe('3');
    expect(maskDate('31', BR, '3')).toBe('31/');
    expect(maskDate('31/1', BR, '31/')).toBe('31/1');
    expect(maskDate('31/10', BR, '31/1')).toBe('31/10/');
    expect(maskDate('31/10/20261', BR, '31/10/2026')).toBe('31/10/2026');
  });

  it('o backspace atravessa a barra', () => {
    expect(maskDate('31', BR, '31/')).toBe('31');
  });

  it('aceita colar com outro separador', () => {
    expect(maskDate('31-10-2026', BR, '')).toBe('31/10/2026');
    expect(maskDate('31102026', BR, '')).toBe('31/10/2026');
  });
});

describe('monthGrid e addDays', () => {
  it('outubro de 2026 começa na quinta e tem 5 semanas', () => {
    const grid = monthGrid(2026, 9);
    expect(grid).toHaveLength(5);
    expect(grid[0].slice(0, 5)).toEqual([null, null, null, null, '2026-10-01']);
    expect(grid[4].filter(Boolean).at(-1)).toBe('2026-10-31');
  });

  it('anda dias atravessando o mês', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('maskTime e parseTimeText', () => {
  it('põe os dois-pontos e valida 24 h', () => {
    expect(maskTime('14', '1')).toBe('14:');
    expect(maskTime('14', '14:')).toBe('14');
    expect(maskTime('1430', '')).toBe('14:30');
    expect(parseTimeText('14:30')).toBe('14:30');
    expect(parseTimeText('')).toBeNull();
    expect(parseTimeText('14:')).toBe('invalid');
    expect(parseTimeText('24:00')).toBe('invalid');
    expect(parseTimeText('09:60')).toBe('invalid');
  });
});
