// Leitura do openapi.json para a página `apiDocs` (#33): as rotas agrupadas por tag, com os `$ref` resolvidos e a
// busca por caminho ou resumo. Sem React.

export const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
export type Method = (typeof METHODS)[number];

export interface ApiParam {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  description?: string;
  schema?: unknown;
  example?: unknown;
}

export interface ApiOperation {
  id: string;
  method: Method;
  path: string;
  summary?: string;
  description?: string;
  params: ApiParam[];
  body?: { schema?: unknown; example?: unknown; required: boolean };
  responses: { status: string; description?: string; schema?: unknown; example?: unknown }[];
}

export interface ApiGroup {
  tag: string;
  description?: string;
  operations: ApiOperation[];
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});

/** Segue `$ref: "#/components/..."` no próprio documento, até a profundidade 8 (ciclo vira `{ $ref }`). */
export function resolveRefs(doc: unknown, value: unknown, depth = 0): unknown {
  if (Array.isArray(value)) return value.map((v) => resolveRefs(doc, v, depth));
  if (!value || typeof value !== 'object') return value;
  const ref = (value as Json).$ref;
  if (typeof ref === 'string' && ref.startsWith('#/')) {
    if (depth >= 8) return { $ref: ref };
    const target = ref
      .slice(2)
      .split('/')
      .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
      .reduce<unknown>((at, key) => obj(at)[key], doc);
    return target === undefined ? { $ref: ref } : resolveRefs(doc, target, depth + 1);
  }
  return Object.fromEntries(Object.entries(value as Json).map(([k, v]) => [k, resolveRefs(doc, v, depth)]));
}

const jsonContent = (content: unknown) => {
  const c = obj(content);
  const media = obj(c['application/json'] ?? Object.values(c)[0]);
  const examples = Object.values(obj(media.examples)).map((e) => obj(e).value);
  return { schema: media.schema, example: media.example ?? examples[0] ?? obj(media.schema).example };
};

function operation(doc: unknown, path: string, method: Method, raw: Json, shared: unknown[]): ApiOperation {
  const params = [...shared, ...((raw.parameters as unknown[]) ?? [])]
    .map((p) => obj(resolveRefs(doc, p)))
    .filter((p) => typeof p.name === 'string')
    .map((p) => ({
      name: String(p.name),
      in: (p.in as ApiParam['in']) ?? 'query',
      required: p.in === 'path' || p.required === true,
      description: p.description as string | undefined,
      schema: p.schema,
      example: p.example ?? obj(p.schema).example
    }));
  const body = raw.requestBody ? obj(resolveRefs(doc, raw.requestBody)) : undefined;
  const responses = Object.entries(obj(raw.responses)).map(([status, r]) => {
    const res = obj(resolveRefs(doc, r));
    return { status, description: res.description as string | undefined, ...jsonContent(res.content) };
  });
  return {
    id: String(raw.operationId ?? `${method} ${path}`),
    method,
    path,
    summary: raw.summary as string | undefined,
    description: raw.description as string | undefined,
    params,
    body: body && { ...jsonContent(body.content), required: body.required === true },
    responses
  };
}

/** Rotas por tag, na ordem de `tags` do documento; rota sem tag cai em "Outras". */
export function groupOperations(doc: unknown): ApiGroup[] {
  const groups = new Map<string, ApiGroup>();
  for (const t of (obj(doc).tags as unknown[]) ?? [])
    if (typeof obj(t).name === 'string')
      groups.set(String(obj(t).name), { tag: String(obj(t).name), description: obj(t).description as string, operations: [] });
  for (const [path, item] of Object.entries(obj(obj(doc).paths))) {
    const shared = (obj(item).parameters as unknown[]) ?? [];
    for (const method of METHODS) {
      const raw = obj(item)[method];
      if (!raw) continue;
      const op = operation(doc, path, method, obj(raw), shared);
      for (const tag of (obj(raw).tags as string[] | undefined) ?? ['Outras']) {
        if (!groups.has(tag)) groups.set(tag, { tag, operations: [] });
        groups.get(tag)!.operations.push(op);
      }
    }
  }
  return [...groups.values()].filter((g) => g.operations.length);
}

/** Busca por caminho, resumo ou id, sem acento e sem caixa; grupo sem rota que bate some. */
export function filterGroups(groups: ApiGroup[], q: string): ApiGroup[] {
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const term = fold(q.trim());
  if (!term) return groups;
  return groups
    .map((g) => ({
      ...g,
      operations: g.operations.filter((o) => fold(`${o.method} ${o.path} ${o.summary ?? ''} ${o.id}`).includes(term))
    }))
    .filter((g) => g.operations.length);
}

/** Caminho com os parâmetros de rota trocados e a query montada; parâmetro vazio fica de fora. */
export function buildUrl(op: ApiOperation, values: Record<string, string>): string {
  const path = op.path.replace(/\{([^}]+)\}/g, (_, name: string) => encodeURIComponent(values[name] ?? ''));
  const q = new URLSearchParams();
  for (const p of op.params) if (p.in === 'query' && values[p.name]) q.set(p.name, values[p.name]);
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}
