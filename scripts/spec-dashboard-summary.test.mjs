import { describe, expect, it } from 'vitest';

import { checkSummaryWidget } from './spec-dashboard-summary.mjs';

const run = (dashboard, w) => {
  const errors = [];
  checkSummaryWidget(dashboard, w, 'w', errors);
  return errors;
};

describe('checkSummaryWidget (#108)', () => {
  it('exige source no widget ou no painel', () => {
    expect(run({}, { type: 'meter' })).toEqual(['w: sem source; declare dashboard.source ou o source do widget']);
    expect(run({ source: { path: '/uso' } }, { type: 'meter' })).toEqual([]);
    expect(run({}, { type: 'share', source: { path: '/uso' } })).toEqual([]);
  });

  it('recusa id de ação repetido no status', () => {
    const actions = [{ id: 'baixar' }, { id: 'baixar' }, { id: 'instalar' }];
    expect(run({ source: { path: '/a' } }, { type: 'status', actions })).toEqual(["w actions: id 'baixar' repetido"]);
  });
});
