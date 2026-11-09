// Linhas novas ou alteradas de um PR, a partir do `git diff -U0`: a base da cobertura do diff e da mutação
// incremental. Puro (só texto); quem chama o git é o git.mjs.

/**
 * Lê um diff unificado e devolve, por arquivo (caminho novo), as linhas do arquivo novo que o PR escreveu.
 * Arquivo apagado não entra; linha só removida não conta (não há o que testar nela).
 * @param {string} diff
 * @returns {Map<string, number[]>}
 */
export function parseChangedLines(diff) {
  const changed = new Map();
  let file = null;
  let next = 0;
  let inHunk = false;
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      inHunk = false;
      continue;
    }
    if (!inHunk && line.startsWith('+++ ')) {
      const path = line.slice(4).trim();
      file = path === '/dev/null' ? null : path.replace(/^b\//, '');
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      next = Number(hunk[1]);
      inHunk = true;
      continue;
    }
    // dentro do trecho, "+++x" é a linha "++x" adicionada, não o cabeçalho
    if (!file || !inHunk) continue;
    if (line.startsWith('+')) {
      if (!changed.has(file)) changed.set(file, []);
      changed.get(file).push(next++);
    } else if (line.startsWith(' ')) {
      next++;
    }
  }
  return changed;
}

/**
 * Junta linhas em faixas contínuas: [3, 4, 5, 9] vira [[3, 5], [9, 9]].
 * @param {number[]} lines
 * @returns {[number, number][]}
 */
export function toRanges(lines) {
  const sorted = [...new Set(lines)].sort((a, b) => a - b);
  const ranges = [];
  for (const n of sorted) {
    const last = ranges.at(-1);
    if (last && n === last[1] + 1) last[1] = n;
    else ranges.push([n, n]);
  }
  return ranges;
}

/**
 * Recorta o diff para um subdiretório e tira o prefixo dos caminhos: o cargo-mutants de um workspace próprio
 * (crates/c3-engine-rusqlite) lê caminhos relativos à raiz dele.
 * @param {string} diff
 * @param {string} prefix por exemplo "crates/c3-engine-rusqlite/"
 */
export function scopeDiff(diff, prefix) {
  const files = diff.split(/^(?=diff --git )/m);
  const strip = (text) => text.replaceAll(`a/${prefix}`, 'a/').replaceAll(`b/${prefix}`, 'b/');
  return files
    .filter((f) => f.includes(`+++ b/${prefix}`))
    .map(strip)
    .join('');
}
