// Reprova arquivo de código com mais de 300 linhas (regra do projeto): passou disso, divida por responsabilidade.
// Só confere código (CODE_EXT): JSON/YAML da spec, Markdown e lockfiles ficam de fora.
//
// Também reprova dois arquivos que só diferem na caixa do nome (Highlight.tsx e highlight.ts): no Windows e no macOS
// o sistema de arquivos não diferencia e o tsc de quem instala pelo git quebra (#42).
//
// Uso: node scripts/check-lines.mjs

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const MAX = 300;
const CODE_EXT = /\.(rs|ts|tsx|mts|js|mjs|cjs|sql|sh|css|html)$/;

const countLines = (file) => {
  const text = readFileSync(file, 'utf8');
  if (text === '') return 0;
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
};

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const files = tracked.filter((f) => CODE_EXT.test(f));
const errors = files
  .map((file) => [file, countLines(file)])
  .filter(([, lines]) => lines > MAX)
  .map(([file, lines]) => `${file}: ${lines} linhas (máximo ${MAX}). Divida por responsabilidade.`);

// mesmo caminho sem caixa, ou mesmo módulo (./highlight acha .ts e .tsx) com caixa diferente: colide fora do Linux
const stem = (f) => f.replace(/\.(ts|tsx|mts|js|mjs|cjs|jsx)$/, '');
const seen = new Map();
for (const file of tracked) {
  for (const key of new Set([file.toLowerCase(), stem(file).toLowerCase()])) {
    const other = seen.get(key);
    const clash = other && other !== file && (other.toLowerCase() === file.toLowerCase() || stem(other) !== stem(file));
    if (clash) errors.push(`${file} e ${other} só diferem na caixa do nome: quebram no Windows. Renomeie um deles.`);
    seen.set(key, file);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`check-lines: ok (${files.length} arquivos de código, nenhum acima de ${MAX} linhas).`);
