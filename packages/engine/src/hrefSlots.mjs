// Os `{campo}` do endereço de uma coluna (`columns[].href`, #69). Em JS puro: a shell e o `pnpm spec:check` usam o mesmo.

/** Um `{campo}` do modelo. */
export const HREF_SLOT = /\{([a-z][a-z0-9_]*)\}/g;

/** Os campos citados no modelo, na ordem (`{produto_id}` → `produto_id`). */
export const hrefFields = (template) => [...template.matchAll(HREF_SLOT)].map((m) => m[1]);
