// Build real pelo Vite/Rolldown: mede só os chunks importados estaticamente pela entrada.
// --measure registra a linha de base sem cobrar a separação; sem isso, reprova regressões.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(new URL('../apps/engine-demo/package.json', import.meta.url));
const { build, defaultClientConditions } = await import(pathToFileURL(require.resolve('vite')).href);
const root = fileURLToPath(new URL('../apps/engine-demo', import.meta.url));
const entry = '\0c3-entry-probe';
const fullIcons = process.argv.includes('--full-icons');
const source = `import { C3Shell } from '@c3theme/engine';
import { DeviceLink, QrCode } from '@c3theme/ui';
${fullIcons ? "import icons from '@c3theme/engine/icones-completos';" : ''}
globalThis.c3Probe = { C3Shell, DeviceLink, QrCode${fullIcons ? ', icons' : ''} };`;
const result = await build({
  root,
  configFile: false,
  logLevel: 'error',
  resolve: { conditions: ['c3theme-source', ...defaultClientConditions] },
  plugins: [
    {
      name: 'c3-entry-probe',
      resolveId(id, importer) {
        if (id === entry) return id;
        if (importer === entry) return this.resolve(id, `${root}/src/probe.tsx`);
      },
      load: (id) => (id === entry ? source : undefined)
    }
  ],
  build: { write: false, sourcemap: true, minify: false, rolldownOptions: { input: entry } }
});
const chunks = result.output.filter((item) => item.type === 'chunk');
const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
const initial = new Set();
function visit(chunk) {
  if (initial.has(chunk)) return;
  initial.add(chunk);
  for (const name of chunk.imports) if (byName.has(name)) visit(byName.get(name));
}
chunks.filter((chunk) => chunk.isEntry).forEach(visit);
const sources = [...initial].flatMap((chunk) => chunk.map?.sources ?? []);
const modules = [...initial].flatMap((chunk) => Object.entries(chunk.modules));
const sizeOf = (needle) => modules.filter(([id]) => id.includes(needle)).reduce((sum, [, mod]) => sum + mod.renderedLength, 0);
const report = {
  initialBytes: [...initial].reduce((sum, chunk) => sum + Buffer.byteLength(chunk.code), 0),
  iconsaxBytes: sizeOf('iconsax-reactjs'),
  dragAndDropBytes: sizeOf('@hello-pangea/dnd'),
  qrBytes: sizeOf('qrcode-generator'),
  chunks: chunks.length
};
console.log(JSON.stringify(report, null, 2));
if (!process.argv.includes('--measure')) {
  assert(!sources.some((id) => id.includes('@hello-pangea/dnd')), 'DnD na entrada');
  assert(!sources.some((id) => id.includes('qrcode-generator')), 'Gerador de QR na entrada');
  const allSources = chunks.flatMap((chunk) => chunk.map?.sources ?? []);
  assert(
    allSources.some((id) => id.includes('@hello-pangea/dnd')),
    'Chunk do quadro ausente'
  );
  assert(
    allSources.some((id) => id.includes('qrcode-generator')),
    'Chunk do QR ausente'
  );
  // Só os ícones usados pelos componentes, não os milhares do catálogo da spec.
  if (fullIcons) assert(report.iconsaxBytes > 1_000_000, 'Opt-in do catálogo completo não funciona');
  else {
    assert(!sources.some((id) => id.endsWith('/icones-completos.ts')), 'Catálogo opcional na entrada');
    assert(report.iconsaxBytes < 1_000_000, 'Catálogo inteiro de ícones na entrada');
  }
}
