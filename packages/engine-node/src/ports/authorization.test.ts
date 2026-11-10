// Cabeçalho C3-Authorization (#48): JSON em base64, UTF-8.
import { describe, expect, it } from 'vitest';

import { authorizationOf } from './authorization';

const ctx = (v?: string) => ({ req: { headers: v === undefined ? {} : { 'c3-authorization': v } } }) as never;

describe('authorizationOf', () => {
  it('lê o objeto e recusa o que não é', () => {
    expect(authorizationOf(ctx('eyJ1c3VhcmlvIjoiYW5hIiwibW90aXZvIjoibGliZXJhw6fDo28ifQ=='))).toEqual({
      usuario: 'ana',
      motivo: 'liberação'
    });
    expect(authorizationOf(ctx())).toBeUndefined();
    expect(authorizationOf(ctx('não é base64'))).toBeUndefined();
    expect(authorizationOf(ctx('WzFd'))).toBeUndefined();
    expect(authorizationOf(ctx('e30x'))).toBeUndefined();
  });
});
