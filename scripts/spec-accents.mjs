/** Cor por registro só pode ler um campo visível de texto/enum, nunca senha ou arquivo. */
export function checkAccentColumns(entity, fields, file, errors) {
  for (const column of entity.views?.list?.columns ?? []) {
    if (typeof column !== 'object') continue;
    for (const [where, color] of [
      ['color', column.color],
      ['avatar.color', column.avatar?.color]
    ]) {
      if (!color) continue;
      if (where === 'color' && fields.get(column.field)?.type !== 'enum')
        errors.push(`${file} views.list.columns.color: '${column.field}' precisa ser enum para desenhar um selo`);
      if (typeof color !== 'object') continue;
      const field = fields.get(color.field);
      if (!field || field.writeOnly || !['string', 'enum'].includes(field.type))
        errors.push(`${file} views.list.columns.${where}: '${color.field}' precisa ser campo string/enum legível`);
    }
  }
}
