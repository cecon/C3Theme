import { describe, expect, it } from 'vitest';

import { escaperFor, render } from './render.mjs';

const t = 'Ação "A" & <b> \\';

describe('render', () => {
  it('escapa pelo tipo do arquivo', () => {
    expect(JSON.parse(`"${render('{{t}}', { t }, 'a.json')}"`)).toBe(t);
    expect(render('{{t}}', { t }, 'index.html')).toBe('Ação &quot;A&quot; &amp; &lt;b&gt; \\');
    expect(render('{{t}}', { t }, 'README.md')).toBe(t);
    expect(render('"{{t}}"', { t }, 'Cargo.toml')).toBe('"Ação \\"A\\" & <b> \\\\"');
    expect(escaperFor('x.ts')('"')).toBe('\\"');
  });

  it('troca todos os marcadores e reprova o que não tem valor', () => {
    expect(render('{{a}}-{{b}}-{{a}}', { a: '1', b: '2' }, 'x.ts')).toBe('1-2-1');
    expect(() => render('{{zz}}', {}, 'x.ts')).toThrow('x.ts: marcador sem valor: {{zz}}');
  });
});
