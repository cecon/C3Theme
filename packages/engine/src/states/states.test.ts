// Classificação do erro de uma rota nos estados declarados (#99, #101).
import { describe, expect, it } from 'vitest';

import { ApiError } from '../apiError';
import { stateOfError } from './states';

describe('stateOfError', () => {
  it('403 é sem permissão, status 0 é offline e o resto é erro', () => {
    expect(stateOfError(new ApiError(403, 'forbidden', 'x'))).toBe('forbidden');
    expect(stateOfError(new ApiError(0, 'network', 'x'))).toBe('offline');
    expect(stateOfError(new ApiError(500, 'internal', 'x'))).toBe('error');
    expect(stateOfError(new ApiError(404, 'not_found', 'x'))).toBe('error');
    expect(stateOfError(new Error('x'))).toBe('error');
    expect(stateOfError(null)).toBe('error');
  });
});
