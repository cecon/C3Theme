// Reprova arquivo de código com mais de 300 linhas (regra do projeto): passou disso, divida por responsabilidade.
// Só confere código (CODE_EXT): JSON/YAML da spec, Markdown e lockfiles ficam de fora.
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

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((f) => CODE_EXT.test(f));
const errors = files
  .map((file) => [file, countLines(file)])
  .filter(([, lines]) => lines > MAX)
  .map(([file, lines]) => `${file}: ${lines} linhas (máximo ${MAX}). Divida por responsabilidade.`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`check-lines: ok (${files.length} arquivos de código, nenhum acima de ${MAX} linhas).`);
