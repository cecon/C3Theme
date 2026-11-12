export function checkAccentColumns(
  entity: { views?: { list?: { columns?: readonly unknown[] } } },
  fields: ReadonlyMap<string, { type: string; writeOnly?: boolean }>,
  file: string,
  errors: string[]
): void;
