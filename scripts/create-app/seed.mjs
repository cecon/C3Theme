// Exceção do ADR 0001: app sem backend do motor (portal, landing), copiado do apps/seed. Puro: diz o que copiar e
// o que trocar; o adaptador de disco faz.

export const WITHOUT_ENGINE_WARNING = `⚠ --sem-motor é exceção (docs/adr/0001-motor-dsl-caminho-padrao.md): só para app sem tela de negócio,
  como portal ou landing. Cadastro, lista, formulário e painel saem do motor: rode sem --sem-motor.`;

/**
 * @param {{ name: string, title: string }} opts
 * @returns {{ from: string, to: string, edits: [string, (s: string) => string][], next: string[] }}
 */
export function planSeedApp({ name, title }) {
  const lit = title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const html = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return {
    from: 'apps/seed',
    to: `apps/${name}`,
    edits: [
      ['package.json', (s) => s.replace('"name": "@c3theme/seed"', `"name": "@c3theme/${name}"`)],
      [
        'src/config.ts',
        (s) =>
          s
            .replace("export const APP_NAME = 'C3Theme';", `export const APP_NAME = '${lit}';`)
            .replace("'c3theme-seed-config'", `'c3theme-${name}-config'`)
      ],
      ['index.html', (s) => s.replace('<title>C3Theme</title>', `<title>${html}</title>`)]
    ],
    next: ['pnpm install', `pnpm --filter @c3theme/${name} dev`]
  };
}
