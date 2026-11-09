import { describe, expect, it } from 'vitest';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

import { fcLocale } from './fcLocale';

describe('fcLocale', () => {
  it('segue o locale do app', () => {
    expect(fcLocale('pt-BR')).toBe(ptBrLocale);
    expect(fcLocale('en-US')).toBe('en-US');
    expect(fcLocale(undefined)).toBeUndefined();
  });
});
