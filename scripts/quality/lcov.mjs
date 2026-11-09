// Leitura de relatórios lcov (vitest/v8 e cargo llvm-cov): por arquivo, quantas vezes cada linha rodou. Puro.
import { isAbsolute, relative } from 'node:path';

/**
 * @param {string} text conteúdo de um lcov.info
 * @param {string} root raiz do repositório: caminho absoluto em SF vira relativo a ela
 * @returns {Map<string, Map<number, number>>}
 */
export function parseLcov(text, root) {
  const files = new Map();
  let current = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('SF:')) {
      const path = line.slice(3);
      const file = (isAbsolute(path) ? relative(root, path) : path).replaceAll('\\', '/');
      current = files.get(file) ?? new Map();
      files.set(file, current);
    } else if (line.startsWith('DA:') && current) {
      const [n, hits] = line.slice(3).split(',');
      const lineNo = Number(n);
      // a mesma linha pode vir mais de uma vez (genéricos no Rust): vale a soma
      current.set(lineNo, (current.get(lineNo) ?? 0) + Number(hits));
    } else if (line === 'end_of_record') {
      current = null;
    }
  }
  return files;
}

/** Junta relatórios (TS e Rust) num só mapa. */
export function mergeLcov(...maps) {
  const merged = new Map();
  for (const map of maps) {
    for (const [file, lines] of map) {
      const target = merged.get(file) ?? new Map();
      for (const [n, hits] of lines) target.set(n, (target.get(n) ?? 0) + hits);
      merged.set(file, target);
    }
  }
  return merged;
}
