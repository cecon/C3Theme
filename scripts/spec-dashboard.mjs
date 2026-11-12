// Regras do painel (app.json pages[].dashboard) que o JSON Schema não expressa sozinho.

import { checkAlertCompare, checkListTabs } from './spec-dashboard-list.mjs';

const DATES = new Set(['date', 'datetime']);
const GROUPABLE = new Set(['enum', 'boolean', 'reference', ...DATES]);
const SUMMABLE = new Set(['integer', 'decimal']);

/**
 * Cada widget lê entidade de app.entities, com preset, campos e filtro que existem e servem para o que pedem. Filtros do
 * painel têm nome único, e o `bind` de cada widget liga um filtro que existe a um campo do tipo certo.
 */
export function checkDashboards(app, entities, checkCondition, errors) {
  for (const page of app.pages ?? []) {
    const filters = new Map();
    for (const f of page.dashboard?.filters ?? []) {
      const where = `app.json página '${page.path}' filtro '${f.name}'`;
      if (filters.has(f.name)) errors.push(`${where}: nome repetido`);
      filters.set(f.name, f);
      if (f.type === 'period' && f.options && f.default && !f.options.includes(f.default))
        errors.push(`${where}: default '${f.default}' fora de options`);
      if (f.type === 'reference' && (!app.entities?.includes(f.entity) || !entities.get(f.entity)))
        errors.push(`${where}: entidade '${f.entity}' fora de app.entities`);
    }
    for (const [i, w] of (page.dashboard?.widgets ?? []).entries()) {
      const where = `app.json página '${page.path}' widget ${i + 1} (${w.type})`;
      if (w.type.startsWith('summary-')) {
        if (!w.source && !page.dashboard.source) errors.push(`${where}: source é obrigatório no widget ou no painel`);
        continue;
      }
      const entity = entities.get(w.entity)?.entity;
      if (!app.entities?.includes(w.entity) || !entity) {
        errors.push(`${where}: entidade '${w.entity}' fora de app.entities`);
        continue;
      }
      const fields = new Map((entity.fields ?? []).map((f) => [f.name, f]));
      const field = (name, what) => {
        const f = fields.get(name);
        if (!f || f.writeOnly || f.type === 'file') errors.push(`${where} ${what}: '${name}' não existe ou não dá para mostrar`);
        return f;
      };
      if (w.preset && !(entity.views?.list?.presets ?? []).some((p) => p.id === w.preset))
        errors.push(`${where}: preset '${w.preset}' não existe em ${w.entity}.views.list.presets`);
      if (w.where) checkCondition(w.where, fields, `${where} where`, true);
      checkAlertCompare(w, entity, fields, where, checkCondition, errors);
      for (const [name, target] of Object.entries(w.bind ?? {})) {
        const f = filters.get(name);
        const g = fields.get(target);
        if (!f) errors.push(`${where} bind: filtro '${name}' não existe em dashboard.filters`);
        else if (!g) errors.push(`${where} bind.${name}: campo '${target}' não existe em ${w.entity}`);
        else if (f.type === 'period' && !DATES.has(g.type)) errors.push(`${where} bind.${name}: período liga-se a campo date ou datetime`);
        else if (f.type === 'reference' && (g.type !== 'reference' || g.entity !== f.entity))
          errors.push(`${where} bind.${name}: '${target}' precisa ser reference para ${f.entity}`);
      }
      const measure = (m, what) => {
        const sum = m?.startsWith('sum:') && m.slice(4);
        if (sum && !SUMMABLE.has(field(sum, what)?.type ?? 'integer'))
          errors.push(`${where} ${what}: '${sum}' precisa ser integer ou decimal`);
      };
      measure(w.measure, 'measure');
      if (w.type === 'kpi') {
        for (const k of ['part', 'whole']) if (w.progress?.[k]) checkCondition(w.progress[k], fields, `${where} progress.${k}`, true);
      }
      if (w.type === 'chart') {
        for (const [n, s] of (w.series ?? []).entries()) {
          measure(s.measure, `series[${n}].measure`);
          if (s.where) checkCondition(s.where, fields, `${where} series[${n}].where`, true);
        }
        if ((w.series || w.ranges || w.axisScale) && w.chart !== 'area')
          errors.push(`${where}: series, ranges e axisScale só valem em chart 'area'`);
        const g = field(w.groupBy, 'groupBy');
        if (g && !GROUPABLE.has(g.type)) errors.push(`${where} groupBy: '${g.name}' precisa ser enum, boolean, reference ou data`);
        const isDate = g && DATES.has(g.type);
        if (w.interval && !isDate) errors.push(`${where}: interval só vale com groupBy de data`);
        if ((w.chart === 'line' || w.chart === 'area') && g && !isDate) errors.push(`${where}: chart '${w.chart}' exige groupBy de data`);
      }
      if (w.type === 'heatmap') {
        const g = field(w.groupBy, 'groupBy');
        if (g && !DATES.has(g.type)) errors.push(`${where} groupBy: heatmap precisa de campo date ou datetime`);
      }
      if (w.type === 'ranking') {
        const g = field(w.groupBy, 'groupBy');
        if (g && !GROUPABLE.has(g.type)) errors.push(`${where} groupBy: '${g.name}' precisa ser enum, boolean, reference ou data`);
        if (w.flag) checkCondition(w.flag.where, fields, `${where} flag.where`, true);
        if (w.action) {
          const target = g?.type === 'reference' ? entities.get(g.entity)?.entity : undefined;
          if (!target) errors.push(`${where} action: groupBy precisa ser reference para uma entidade do app`);
          else if (!(target.actions ?? []).some((a) => a.name === w.action && a.target !== 'list' && !a.input && !a.confirm && !a.returns))
            errors.push(`${where} action: '${w.action}' não é ação de registro de ${g.entity} sem input, confirm nem arquivo`);
        }
      }
      if (w.type === 'feed') {
        const k = field(w.kind, 'kind');
        if (k && k.type !== 'enum') errors.push(`${where} kind: '${k.name}' precisa ser enum`);
        const t = field(w.time, 'time');
        if (t && !DATES.has(t.type)) errors.push(`${where} time: '${t.name}' precisa ser date ou datetime`);
        if (w.text) field(w.text, 'text');
        const values = new Set((k?.options ?? []).map((o) => String(o.value)));
        for (const v of Object.keys(w.icons ?? {})) if (k && !values.has(v)) errors.push(`${where} icons: '${v}' não é opção de ${k.name}`);
      }
      if (w.type === 'list') {
        for (const name of w.columns ?? []) field(name, 'columns');
        for (const key of (w.sort ?? '').split(',').filter(Boolean)) {
          const name = key.replace(/^-/, '');
          if (name !== 'id') field(name, 'sort');
        }
        if (!w.columns && !entity.titleField) errors.push(`${where}: sem columns, a entidade precisa de titleField`);
        checkListTabs(app, entities, w, entity, where, checkCondition, errors);
      }
    }
  }
}
