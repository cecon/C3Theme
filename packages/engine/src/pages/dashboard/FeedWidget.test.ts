import { describe, expect, it } from 'vitest';

import { timeAgo } from './FeedWidget';

describe('timeAgo', () => {
  const now = new Date(2026, 10, 6, 15, 0);
  it('minutos, horas, ontem e dias', () => {
    expect(timeAgo(new Date(2026, 10, 6, 14, 48).toISOString(), now)).toBe('há 12 min');
    expect(timeAgo(new Date(2026, 10, 6, 12, 0).toISOString(), now)).toBe('há 3 h');
    expect(timeAgo(new Date(2026, 10, 5, 10, 0).toISOString(), now)).toBe('ontem');
    expect(timeAgo(new Date(2026, 10, 4, 10, 0).toISOString(), now)).toBe('há 2 dias');
  });
});
