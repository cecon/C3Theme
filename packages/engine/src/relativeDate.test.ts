import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { FieldDef } from './types';
import { resolveLeaf } from './relativeDate';

// Os mesmos casos do c3-engine (relative_date_tests.rs): mudar a regra de um lado quebra o outro.
const suite = JSON.parse(readFileSync(new URL('../../../spec/v0/conformance/relative-dates.json', import.meta.url), 'utf8')) as {
  cases: {
    clock: { now: string; utcOffsetMinutes: number; today?: string };
    type: FieldDef['type'];
    op: string;
    value: Record<string, unknown>;
    expected?: string;
    error?: boolean;
    note?: string;
  }[];
};

describe('datas relativas (spec/v0/conformance/relative-dates.json)', () => {
  it.each(suite.cases.map((c) => [`${c.type} ${c.op} ${JSON.stringify(c.value)} ${c.note ?? ''}`, c] as const))('%s', (_, c) => {
    const clock = { now: new Date(c.clock.now), utcOffsetMinutes: c.clock.utcOffsetMinutes, today: c.clock.today };
    const run = () => resolveLeaf({ name: 'campo', type: c.type, label: 'Campo' } as FieldDef, c.op, c.value, clock);
    if (c.error) expect(run).toThrow();
    else expect(run()).toBe(c.expected);
  });
});
