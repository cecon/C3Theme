// Regras da planta (views.map) que o JSON Schema não expressa sozinho.

const GROUPABLE = new Set(['enum', 'reference', 'string', 'integer']);

/**
 * Campos existem e dá para mostrar; `color` é enum com cor em alguma option; grupo é enum, reference, string ou
 * integer; coordenadas são integer; grupos e coordenadas não se misturam.
 */
export function checkMap(entity, fields, file, errors) {
  const map = entity.views?.map;
  if (!map) return;
  const where = `${file} views.map`;
  const field = (name, what) => {
    const f = fields.get(name);
    if (!f || f.writeOnly || f.type === 'file') errors.push(`${where}.${what}: '${name}' não existe ou não dá para mostrar`);
    return f;
  };
  for (const name of map.fields ?? []) field(name, 'fields');
  if (map.color) {
    const c = field(map.color, 'color');
    if (c && (c.type !== 'enum' || !(c.options ?? []).some((o) => o.color)))
      errors.push(`${where}.color: '${map.color}' precisa ser enum com color em alguma option`);
  }
  for (const name of map.groupBy ?? []) {
    const g = field(name, 'groupBy');
    if (g && !GROUPABLE.has(g.type)) errors.push(`${where}.groupBy: '${name}' (${g.type}) não agrupa`);
  }
  for (const [key, name] of Object.entries(map.position ?? {})) {
    const p = field(name, `position.${key}`);
    if (p && p.type !== 'integer') errors.push(`${where}.position.${key}: '${name}' precisa ser integer`);
  }
  if (map.position && map.groupBy) errors.push(`${where}: position e groupBy não se misturam (coordenadas ou caixas)`);
  if (entity.singleton) errors.push(`${file}: singleton não combina com views.map`);
}
