// Regras de `lookups` (consultar e preencher) que o JSON Schema não expressa sozinho.

/** Origem é string ou reference que dá para ler; `with` são campos legíveis, sem file e sem a origem; cada destino é campo gravável e diferente da origem; nomes sem repetir. */
export function checkLookups(entity, fields, file, errors) {
  const names = new Set();
  for (const l of entity.lookups ?? []) {
    const where = `${file} lookup '${l.name}'`;
    if (names.has(l.name)) errors.push(`${where}: nome repetido`);
    names.add(l.name);
    const src = fields.get(l.field);
    if (!src || !['string', 'reference'].includes(src.type) || src.writeOnly)
      errors.push(`${where}: field '${l.field}' precisa ser campo string ou reference que não seja writeOnly`);
    for (const name of l.with ?? []) {
      const f = fields.get(name);
      if (!f || f.writeOnly || f.type === 'file' || name === l.field)
        errors.push(`${where}: with '${name}' precisa ser campo legível, não file e diferente da origem`);
    }
    for (const name of l.fills) {
      const f = fields.get(name);
      if (!f) errors.push(`${where}: fills cita campo inexistente '${name}'`);
      else if (name === l.field) errors.push(`${where}: '${name}' não pode preencher a si mesmo`);
      else if (f.readOnly || f.writeOnly || f.type === 'file')
        errors.push(`${where}: '${name}' é readOnly, writeOnly ou file e não pode ser preenchido`);
    }
  }
}
