// A shell inteira (<C3Shell>) a partir de um app.json, sem backend: o transporte responde o GET /_meta/app com o JSON
// da história (ou o 503 de um proxy). Serve às telas que só a shell monta: fora do ar, "em breve", 500, 404 e os
// estados da página (contagem da `statesEntity`, permissão negada e conexão).

import { useState } from 'react';
import { Chart, Wallet } from 'iconsax-reactjs';

import { C3Shell, type AppDef, type C3Fetch, type ConnectivityPort } from '@c3theme/engine';

export interface ShellJsonProps {
  /** O app.json servido em GET /_meta/app. */
  app: AppDef;
  /** Rota aberta (vai depois do `#`). */
  route?: string;
  /** Simula um proxy fora do ar: 503 em /_meta/* com este Retry-After (segundos), sem corpo JSON. */
  proxy503?: string;
  /** Contagem da `statesEntity` (pages[].states): o total, um status de erro, `network` (sem rede) ou `pending` (não chega). */
  count?: number | { status: number } | 'network' | 'pending';
  /** O que a porta `connectivity` diria: `false` mostra o offline declarado da página. */
  online?: boolean;
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

/** Página com `permission: "negada"`: o /_meta/app diz que o usuário não abre. */
const denied = (app: AppDef) => Object.fromEntries((app.pages ?? []).filter((p) => p.permission === 'negada').map((p) => [p.path, false]));

/** Tela que quebra ao abrir: mostra o 500 dentro do layout. */
function Quebra(): never {
  throw new Error('Tela de exemplo que quebra de propósito.');
}

/** A porta de conexão fixa da história. */
const connectivity = (online: boolean): ConnectivityPort => ({ online: () => online, subscribe: () => () => {} });

/** Contagem da página: o total, a falha pedida ou o pedido que não chega ao servidor. */
function countReply(count: NonNullable<ShellJsonProps['count']>): Promise<Response> {
  if (count === 'pending') return new Promise(() => {});
  if (count === 'network') return Promise.reject(new TypeError('Failed to fetch'));
  if (typeof count === 'number') return Promise.resolve(json({ data: [{ key: null, value: count }] }));
  return Promise.resolve(json({ error: { code: 'x', message: 'Falha da história.' } }, count.status));
}

/** Página registrada que só aparece quando a contagem tem registro. */
function Caixa() {
  return <p>Vendas do dia abertas no caixa.</p>;
}

export default function ShellJson({ app, route = '/', proxy503, count, online = true }: ShellJsonProps) {
  // a rota vai no hash antes de a shell criar o roteador
  useState(() => window.history.replaceState(null, '', `#${route}`));
  const transport: C3Fetch = async (url) => {
    if (proxy503 !== undefined) return new Response('<h1>Fora do ar</h1>', { status: 503, headers: { 'retry-after': proxy503 } });
    if (url.endsWith('/_meta/app')) return json({ data: app, pages: denied(app) });
    if (count !== undefined && url.includes('/_aggregate')) return countReply(count);
    return json({ error: { code: 'not_found', message: 'Sem backend na história.' } }, 404);
  };
  return (
    <C3Shell
      key={JSON.stringify([app, route, proxy503, count, online])}
      apiUrl="/api"
      router="hash"
      transport={transport}
      connectivity={connectivity(online)}
      components={{ Quebra, Caixa }}
      icons={{ Chart, Wallet }}
    />
  );
}
