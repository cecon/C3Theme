// A shell inteira (<C3Shell>) a partir de um app.json, sem backend: o transporte responde o GET /_meta/app com o JSON
// da história (ou o 503 de um proxy). Serve às telas que só a shell monta: fora do ar, "em breve", 500 e 404.

import { useState } from 'react';
import { Chart, Wallet } from 'iconsax-reactjs';

import { C3Shell, type AppDef, type C3Fetch } from '@c3theme/engine';

export interface ShellJsonProps {
  /** O app.json servido em GET /_meta/app. */
  app: AppDef;
  /** Rota aberta (vai depois do `#`). */
  route?: string;
  /** Simula um proxy fora do ar: 503 em /_meta/* com este Retry-After (segundos), sem corpo JSON. */
  proxy503?: string;
  /** Responde as outras rotas da API (ex.: /_chat); sem resposta, 404. Pode rejeitar para simular falta de rede. */
  api?: (url: string, init?: RequestInit) => Promise<Response> | undefined;
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

/** Tela que quebra ao abrir: mostra o 500 dentro do layout. */
function Quebra(): never {
  throw new Error('Tela de exemplo que quebra de propósito.');
}

export default function ShellJson({ app, route = '/', proxy503, api }: ShellJsonProps) {
  // a rota vai no hash antes de a shell criar o roteador
  useState(() => window.history.replaceState(null, '', `#${route}`));
  const transport: C3Fetch = async (url, init) => {
    if (proxy503 !== undefined) return new Response('<h1>Fora do ar</h1>', { status: 503, headers: { 'retry-after': proxy503 } });
    if (url.endsWith('/_meta/app')) return json({ data: app, pages: {} });
    const answer = api?.(url, init);
    if (answer) return answer;
    return json({ error: { code: 'not_found', message: 'Sem backend na história.' } }, 404);
  };
  return (
    <C3Shell
      key={JSON.stringify([app, route, proxy503])}
      apiUrl="/api"
      router="hash"
      transport={transport}
      components={{ Quebra }}
      icons={{ Chart, Wallet }}
    />
  );
}
