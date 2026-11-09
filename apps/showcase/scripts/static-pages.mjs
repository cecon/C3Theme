// Depois do build: uma cópia do index.html por tela do menu, com título e prévia de compartilhamento da tela,
// mais 404.html, sitemap.xml e robots.txt. O GitHub Pages não conhece as rotas do SPA; sem isso toda tela
// interna responde HTTP 404 (o 404.html devolve o app), e buscadores e prévias de link (WhatsApp, LinkedIn) a ignoram.
// Uso: node scripts/static-pages.mjs https://cecon.github.io/C3Theme/

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const site = (process.argv[2] || process.env.SITE_URL || '').replace(/\/?$/, '/');
if (!/^https?:\/\//.test(site)) throw new Error('informe o endereço público do site, ex.: https://cecon.github.io/C3Theme/');

// lê o menu pelo próprio Vite (TSX, JSON, pacotes do workspace pelo fonte) sem montar o app
const vite = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
  ssr: { resolve: { conditions: ['c3theme-source'] } }
});
let menu, pageTitle, BRAND;
try {
  ({ menu } = await vite.ssrLoadModule('/src/sections/index.ts'));
  ({ pageTitle } = await vite.ssrLoadModule('@c3theme/ui'));
  ({ BRAND } = await vite.ssrLoadModule('/src/brand.ts'));
} finally {
  await vite.close();
}

const urls = [];
const walk = (items) =>
  items.forEach((i) => {
    if (i.url && !i.external) urls.push(i.url);
    if (i.children) walk(i.children);
  });
menu.forEach((g) => walk(g.items));

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const template = await readFile(join(dist, 'index.html'), 'utf8');
const homeTitle = template.match(/<title>(.*?)<\/title>/)[1];

/** Título, og:title, og:url e endereços absolutos (og:image precisa de URL completa). */
function page(path, title) {
  const url = site + path.replace(/^\//, '');
  return template
    .replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${escape(title)}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
    .replace(/(content=")og\.png"/g, `$1${site}og.png"`);
}

const unique = [...new Set(urls)];
for (const path of unique) {
  // tela.html, não tela/index.html: o Pages serve /tela direto, sem redirecionar para /tela/
  const file = join(dist, `${path}.html`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, page(path, pageTitle(menu, path, '', BRAND.name)));
}
await writeFile(join(dist, 'index.html'), page('/', homeTitle));
await writeFile(join(dist, '404.html'), page('/', homeTitle));
await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', ...unique]
    .map((p) => `  <url><loc>${site}${p.replace(/^\//, '')}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site}sitemap.xml\n`);
console.log(`${unique.length} telas com página própria, sitemap.xml e robots.txt em ${site}`);
