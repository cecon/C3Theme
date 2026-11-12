import { describe, expect, it } from 'vitest';

import { ApiError, loadFailure, replyError } from '../apiError';
import { readStatus, retryAfterUntil, statusFromReply, untilTime } from './status';

const NOW = Date.parse('2026-11-12T12:00:00Z');

describe('status do app (#81)', () => {
  it('untilTime: ISO vira ms; vazio ou inválido, undefined', () => {
    expect(untilTime('2026-11-12T12:00:00Z')).toBe(NOW);
    expect(untilTime(undefined)).toBeUndefined();
    expect(untilTime('')).toBeUndefined();
    expect(untilTime('amanhã')).toBeUndefined();
  });

  it('Retry-After em segundos ou data HTTP', () => {
    expect(retryAfterUntil('120', NOW)).toBe('2026-11-12T12:02:00.000Z');
    expect(retryAfterUntil(' 0 ', NOW)).toBe('2026-11-12T12:00:00.000Z');
    expect(retryAfterUntil('Thu, 12 Nov 2026 15:00:00 GMT', NOW)).toBe('2026-11-12T15:00:00.000Z');
    expect(retryAfterUntil(null, NOW)).toBeUndefined();
    expect(retryAfterUntil('  ', NOW)).toBeUndefined();
    expect(retryAfterUntil('logo', NOW)).toBeUndefined();
    // só número inteiro é segundos: data que começa ou termina com dígitos continua data
    expect(retryAfterUntil('12 Nov 2026 15:00:00 GMT', NOW)).toBe('2026-11-12T15:00:00.000Z');
    expect(retryAfterUntil('Thu, 12 Nov 2026 15:00:00 +0000', NOW)).toBe('2026-11-12T15:00:00.000Z');
  });

  it('readStatus guarda só o que é válido', () => {
    expect(readStatus({ mode: 'maintenance' })).toEqual({ mode: 'maintenance' });
    expect(
      readStatus({ mode: 'comingSoon', title: 'Lançamento', message: { id: 'x' }, until: '2026-12-01T09:00:00-03:00', extra: 1 })
    ).toEqual({ mode: 'comingSoon', title: 'Lançamento', message: { id: 'x' }, until: '2026-12-01T09:00:00-03:00' });
    expect(readStatus({ mode: 'maintenance', title: '', message: 3, until: 'logo' })).toEqual({ mode: 'maintenance' });
    // número não é data, mesmo que o Date.parse aceite
    expect(readStatus({ mode: 'maintenance', until: 123 })).toStrictEqual({ mode: 'maintenance' });
    expect(readStatus({ mode: 'maintenance', title: null })).toEqual({ mode: 'maintenance' });
    expect(readStatus({ mode: 'off' })).toBeUndefined();
    expect(readStatus({ mode: 1 })).toBeUndefined();
    expect(readStatus({})).toBeUndefined();
    expect(readStatus(null)).toBeUndefined();
    expect(readStatus('maintenance')).toBeUndefined();
  });

  it('503: o status do corpo, ou manutenção com a previsão do Retry-After', () => {
    const body = { error: { code: 'out_of_service' }, status: { mode: 'comingSoon', until: '2026-12-01T12:00:00Z' } };
    expect(statusFromReply(body, '60', NOW)).toEqual({ mode: 'comingSoon', until: '2026-12-01T12:00:00Z' });
    expect(statusFromReply(null, '60', NOW)).toEqual({ mode: 'maintenance', until: '2026-11-12T12:01:00.000Z' });
    expect(statusFromReply({ status: { mode: 'x' } }, null, NOW)).toEqual({ mode: 'maintenance' });
  });

  it('replyError: 503 de fora do ar leva o status; o da consulta externa e os outros, não', () => {
    const headers = new Headers({ 'retry-after': '30' });
    const off = replyError({ status: 503, headers }, { error: { code: 'out_of_service', message: 'O sistema está em manutenção.' } });
    expect(off.status).toBe(503);
    expect(off.message).toBe('O sistema está em manutenção.');
    expect(off.offline?.mode).toBe('maintenance');
    expect(off.offline?.until).toBeDefined();
    expect(replyError({ status: 503, headers }, null).offline?.mode).toBe('maintenance');
    expect(replyError({ status: 503, headers }, { error: { code: 'unavailable' } }).offline).toBeUndefined();
    const other = replyError({ status: 500, headers }, null);
    expect(other.offline).toBeUndefined();
    expect(other.code).toBe('internal');
    expect(other.message).toBe('Erro 500.');
  });

  it('loadFailure: 503 de fora do ar vira status; o resto, erro', () => {
    const off = Object.assign(new ApiError(503, 'out_of_service', 'x'), { offline: { mode: 'maintenance' as const } });
    expect(loadFailure(off)).toEqual({ offline: { mode: 'maintenance' } });
    const plain = new ApiError(500, 'internal', 'Erro 500.');
    expect(loadFailure(plain)).toEqual({ error: plain });
    const other = new Error('rede');
    expect(loadFailure(other)).toEqual({ error: other });
  });
});
