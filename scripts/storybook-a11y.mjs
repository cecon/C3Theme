#!/usr/bin/env node
// Roda o axe em todas as histórias do Storybook já construído (apps/storybook/dist), no claro e no escuro.
// Reprova com a lista dos achados; é o que segura o `a11y.test: 'error'` do preview no CI.
// Uso: pnpm build:storybook && pnpm a11y:storybook [trecho-do-id]
// playwright e axe-core ficam com versão exata no package.json: versão nova do axe traz regra nova e mudaria o
// resultado do CI sem ninguém mexer no código; a do playwright casa com o Chromium do `playwright install`.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';

import { chromium } from 'playwright';

const root = resolve('apps/storybook/dist');
const only = process.argv[2];
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
// Antes de ler, a página precisa assentar: o tema troca de modo com transição de cor (lida no meio, dá falso achado de
// contraste) e o addon-a11y do próprio Storybook roda o axe dele ao montar a história (dois `axe.run` ao mesmo tempo
// quebram). Espera as duas coisas por condição, com um piso de SETTLE_MS e um teto de SETTLE_MAX_MS; nada é repetido:
// o achado que aparece com a página assentada é real.
const SETTLE_MS = Number(process.env.A11Y_SETTLE_MS) || 900;
const SETTLE_MAX_MS = 10_000;

/** Espera não haver transição CSS em andamento (as animações infinitas, como spinner, não contam). */
async function settle(page) {
  await page.waitForTimeout(SETTLE_MS);
  await page
    .waitForFunction(
      () => !globalThis.document.getAnimations().some((a) => a instanceof globalThis.CSSTransition && a.playState === 'running'),
      null,
      {
        timeout: SETTLE_MAX_MS,
        polling: 50
      }
    )
    .catch(() => console.warn('  transição de cor não terminou em 10 s; lendo assim mesmo'));
}

if (!existsSync(join(root, 'index.json'))) {
  console.error('Storybook não construído: rode `pnpm build:storybook` antes.');
  process.exit(1);
}

const server = createServer((req, res) => {
  let file = join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) return res.writeHead(404).end();
  res.setHeader('content-type', TYPES[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, ok));
const base = `http://localhost:${server.address().port}`;

const index = JSON.parse(readFileSync(join(root, 'index.json'), 'utf8'));
const ids = Object.values(index.entries)
  .filter((e) => e.type === 'story' && (!only || e.id.includes(only)))
  .map((e) => e.id);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const found = [];
for (const mode of ['light', 'dark']) {
  for (const id of ids) {
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=mode:${mode}`);
    await settle(page);
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async (maxMs) => {
      // o axe do addon pode estar no meio de uma leitura: espera ela acabar e começa a nossa no mesmo tique
      const until = Date.now() + maxMs;
      while (globalThis.axe._running) {
        if (Date.now() > until) throw new Error('o axe do Storybook não terminou');
        await new Promise((r) => setTimeout(r, 50));
      }
      const result = await globalThis.axe.run(
        { include: ['body'], exclude: ['#storybook-docs'] },
        { resultTypes: ['violations'], rules: { region: { enabled: false } } }
      );
      return result.violations.map((v) => ({
        rule: v.id,
        targets: v.nodes.map((n) => n.target.join(' ')),
        summary: v.nodes[0]?.failureSummary
      }));
    }, SETTLE_MAX_MS);
    for (const v of violations) found.push({ mode, id, ...v });
  }
}
await browser.close();
server.close();

if (found.length) {
  for (const f of found)
    console.error(`✗ ${f.mode} ${f.id} [${f.rule}] ${f.targets.join(', ')}\n    ${f.summary?.split('\n').join('\n    ')}`);
  console.error(`\n${found.length} achado(s) do axe em ${ids.length} histórias.`);
  process.exit(1);
}
console.log(`axe: nenhum achado em ${ids.length} histórias (claro e escuro).`);
