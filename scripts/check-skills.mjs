// Confere as skills do plugin c3 (plugins/c3/skills): frontmatter (name igual ao da pasta, description de até 1024
// caracteres e sem < >), links relativos que apontam para arquivo existente e para um título existente (#âncora), e o
// limite de 300 linhas por arquivo. Os exemplos JSON são validados pelo spec:check.
//
// Uso: node scripts/check-skills.mjs

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve('plugins/c3/skills');
const MAX = 300;
const errors = [];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// âncora como o GitHub gera: minúsculas, sem pontuação (acentos ficam), espaço vira hífen
const slug = (title) =>
  title
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .replace(/ /g, '-');

const anchors = (file) => {
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  return new Set([...text.matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug(m[1])));
};

function checkFrontmatter(file, folder) {
  const text = readFileSync(file, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!fm) return errors.push(`${file}: sem frontmatter`);
  const get = (key) => new RegExp(`^${key}: (.+)$`, 'm').exec(fm[1])?.[1].trim();
  const name = get('name');
  const description = get('description');
  if (name !== folder) errors.push(`${file}: name '${name}' diferente da pasta '${folder}'`);
  if (!description) errors.push(`${file}: sem description`);
  else {
    if (description.length > 1024) errors.push(`${file}: description com ${description.length} caracteres (máximo 1024)`);
    if (/[<>]/.test(description)) errors.push(`${file}: description com < ou >`);
  }
}

function checkLinks(file) {
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^[a-z]+:/i.test(target)) continue;
    const [path, anchor] = target.split('#');
    const dest = path ? resolve(dirname(file), path) : file;
    if (!existsSync(dest)) {
      errors.push(`${file}: link para '${target}' que não existe`);
      continue;
    }
    if (anchor && dest.endsWith('.md') && !anchors(dest).has(decodeURIComponent(anchor)))
      errors.push(`${file}: âncora '#${anchor}' não existe em ${relative(ROOT, dest)}`);
  }
}

const skills = readdirSync(ROOT).filter((d) => statSync(join(ROOT, d)).isDirectory());
for (const folder of skills) {
  const skill = join(ROOT, folder, 'SKILL.md');
  if (!existsSync(skill)) {
    errors.push(`${folder}: sem SKILL.md`);
    continue;
  }
  checkFrontmatter(skill, folder);
}
const files = walk(ROOT);
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n').length - 1;
  if (lines > MAX) errors.push(`${file}: ${lines} linhas (máximo ${MAX})`);
  if (file.endsWith('.md')) checkLinks(file);
}
checkLinks(resolve('plugins/c3/README.md'));

if (errors.length) {
  console.error(`skills: ${errors.length} problema(s)\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`skills: ok (${skills.length} skills, ${files.length} arquivos)`);
