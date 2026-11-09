// Troca os marcadores {{chave}} de um arquivo do template, escapando o valor pelo tipo do arquivo. Puro.

const html = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const json = (s) => JSON.stringify(s).slice(1, -1);
// TOML, Rust e TS: o valor entra dentro de string ou comentário com aspas duplas
const quoted = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export function escaperFor(path) {
  if (path.endsWith('.json')) return json;
  if (path.endsWith('.html')) return html;
  if (path.endsWith('.md')) return (s) => s;
  return quoted;
}

/**
 * @param {string} content texto do template
 * @param {Record<string, string>} vars valores dos marcadores
 * @param {string} path caminho do arquivo (decide o escape)
 */
export function render(content, vars, path) {
  const escape = escaperFor(path);
  return content.replace(/\{\{(\w+)\}\}/g, (all, key) => {
    if (!(key in vars)) throw new Error(`${path}: marcador sem valor: ${all}`);
    return escape(vars[key]);
  });
}
