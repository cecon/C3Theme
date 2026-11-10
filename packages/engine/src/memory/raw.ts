// Pedido livre (`C3Client.raw`, página `apiDocs`) no adaptador em memória: GET de um arquivo de `files` (o
// openapi.json da vitrine), GET da lista ou do registro pelo próprio cliente; o resto é 501, como no resto do adaptador.

import { ApiError, type C3Client, type RawReply } from '../api';

const reply = (status: number, body: unknown): RawReply => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

export function memoryRaw(client: C3Client, entities: string[], files: Record<string, unknown> = {}) {
  return async (method: string, path: string): Promise<RawReply> => {
    const [route, query = ''] = path.split('?');
    if (method === 'GET' && route in files) return reply(200, files[route]);
    const [entity, id, ...rest] = route.split('/').filter(Boolean).map(decodeURIComponent);
    try {
      if (method !== 'GET' || !entities.includes(entity) || rest.length)
        throw new ApiError(501, 'not_implemented', 'Esta rota precisa do backend do sistema; o adaptador em memória não roda.');
      if (id) return reply(200, { data: await client.get(entity, id) });
      const q = new URLSearchParams(query);
      const where = q.get('where');
      return reply(
        200,
        await client.list(entity, {
          page: Number(q.get('page')) || undefined,
          pageSize: Number(q.get('pageSize')) || undefined,
          sort: q.get('sort') ?? undefined,
          q: q.get('q') ?? undefined,
          where: where ? JSON.parse(where) : undefined
        })
      );
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(400, 'invalid', String(e));
      return reply(err.status, { error: { code: err.code, message: err.message } });
    }
  };
}
