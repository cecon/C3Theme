// Regras do relatório (views.report) que o JSON Schema não expressa sozinho.

const GROUPABLE = new Set(['enum', 'boolean', 'reference', 'string', 'date', 'integer']);
const SUMMABLE = new Set(['integer', 'decimal']);

/**
 * Colunas e grupos existem e dá para mostrar; subtotal é número, está nas colunas e não é a primeira (onde fica o
 * nome do grupo); árvore é pelo reference para a própria entidade e não junta com grupos nem subtotais.
 */
export function checkReport(entity, fields, file, errors) {
  const report = entity.views?.report;
  if (!report) return;
  const where = `${file} views.report`;
  const field = (name, what) => {
    const f = fields.get(name);
    if (!f || f.writeOnly || f.type === 'file') errors.push(`${where}.${what}: '${name}' não existe ou não dá para mostrar`);
    return f;
  };
  for (const name of report.columns) field(name, 'columns');
  for (const name of report.groupBy ?? []) {
    const g = field(name, 'groupBy');
    if (g && !GROUPABLE.has(g.type)) errors.push(`${where}.groupBy: '${name}' (${g.type}) não agrupa`);
    if (report.columns.includes(name)) errors.push(`${where}.groupBy: '${name}' já é o grupo; tire das columns`);
  }
  for (const name of report.subtotals ?? []) {
    const f = field(name, 'subtotals');
    if (f && !SUMMABLE.has(f.type)) errors.push(`${where}.subtotals: '${name}' precisa ser integer ou decimal`);
    if (!report.columns.includes(name)) errors.push(`${where}.subtotals: '${name}' não está nas columns`);
    else if (report.columns[0] === name) errors.push(`${where}.subtotals: '${name}' é a primeira coluna, onde vai o nome do grupo`);
  }
  for (const key of (report.sort ?? '').split(',').filter(Boolean)) {
    const name = key.replace(/^-/, '');
    if (name !== 'id') field(name, 'sort');
  }
  if (report.tree) {
    const p = field(report.tree.parent, 'tree.parent');
    if (p && (p.type !== 'reference' || p.entity !== entity.name))
      errors.push(`${where}.tree.parent: '${p.name}' precisa ser reference para ${entity.name}`);
    if (report.groupBy?.length || report.subtotals?.length)
      errors.push(`${where}: tree não junta com groupBy nem subtotals (os totais por nível vêm do sistema)`);
  }
  if (entity.singleton) errors.push(`${file}: singleton não combina com views.report`);
}
