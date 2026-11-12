// Permissão por campo e seção (capabilities.fields): a definição como o usuário a enxerga. O backend já tira da
// leitura o que ele não vê e recusa o que ele não pode mudar; aqui as telas só deixam de oferecer.

import type { C3Client } from './api';
import { conditionFields } from './conditions.mjs';
import { gridInputs, plainInputs } from './actionTypes';
import type { Capabilities, Condition, EntityDef, FormFieldDef } from './types';

/**
 * Campo escondido continua em `fields` (as condições ainda sabem o tipo dele), mas como readOnly: não vai no corpo,
 * e sai de colunas, busca, filtros, ordem, presets que o citam e do formulário. Campo só de leitura fica marcado
 * (`denied`) e aparece travado. Lista with_parent escondida some com a seção; só de leitura, não vai no corpo.
 */
export function applyAccess(def: EntityDef, capabilities: Capabilities): EntityDef {
  const denied = capabilities.fields ?? {};
  const hidden = (name: string) => denied[name] === 'hidden';
  if (Object.keys(denied).length === 0) return def;
  const cites = (c: Condition) => [...conditionFields(c)].some((l) => hidden(l.field));
  const name = (item: FormFieldDef) => (typeof item === 'string' ? item : item.field);
  const list = def.views?.list;
  const form = def.views?.form;
  return {
    ...def,
    fields: def.fields.map((f) => (denied[f.name] ? { ...f, denied: denied[f.name], readOnly: f.readOnly || hidden(f.name) } : f)),
    views: {
      ...def.views,
      list: list && {
        ...list,
        columns: list.columns?.filter((c) => !hidden(typeof c === 'string' ? c : c.field)),
        search: list.search?.filter((s) => !hidden(s)),
        filters: list.filters?.filter((f) => !hidden(typeof f === 'string' ? f : f.field)),
        presets: list.presets?.filter((p) => !(p.where && cites(p.where)) && !Object.keys(p.defaults ?? {}).some(hidden)),
        defaultSort: list.defaultSort?.filter((s) => !hidden(s.field))
      },
      form: form && {
        sections: form.sections
          .filter((s) => !(s.related && hidden(s.related.entity)))
          .map((s) => ({
            ...s,
            rows: s.rows?.map((row) => row.filter((item) => !hidden(name(item)))).filter((row) => row.length > 0),
            related: s.related && (denied[s.related.entity] ? { ...s.related, denied: denied[s.related.entity] } : s.related)
          }))
          .filter((s) => !s.rows || s.rows.length > 0 || s.related || s.component)
      }
    }
  };
}

/** Entidades que a definição cita: alvo de reference (também no input das ações) e filhas das seções `related`. */
export function referencedEntities(def: EntityDef): string[] {
  const inputs = (def.actions ?? []).flatMap((a) => [...plainInputs(a), ...gridInputs(a).flatMap((g) => g.fields)]);
  const fields = [...def.fields, ...(def.params?.fields ?? []), ...inputs];
  const refs = fields.flatMap((f) => (f.type === 'reference' && f.entity ? [f.entity] : []));
  const children = (def.views?.form?.sections ?? []).flatMap((s) => (s.related ? [s.related.entity] : []));
  return [...new Set([...refs, ...children])].filter((n) => n !== def.name);
}

/**
 * Metadados das entidades, cada uma já como o usuário a enxerga, mais as que elas citam (filhas e alvos de
 * reference), de forma transitiva: quem monta `EntityForm` fora da shell passa só a entidade da tela. Uma citada
 * que o backend recusa (sem permissão, fora do app) fica de fora em vez de derrubar a tela; as pedidas, não.
 */
export async function loadEntities(client: C3Client, names: string[]) {
  const toEntry = (m: Awaited<ReturnType<C3Client['entity']>>) =>
    [
      m.data.name,
      { def: { ...applyAccess(m.data, m.capabilities), paramDefaults: m.paramDefaults }, capabilities: m.capabilities }
    ] as const;
  const loaded = new Map((await Promise.all(names.map((e) => client.entity(e)))).map(toEntry));
  const tried = new Set(names);
  let pending = [...loaded.values()].flatMap((e) => referencedEntities(e.def)).filter((n) => !tried.has(n));
  while (pending.length > 0) {
    const batch = [...new Set(pending)];
    batch.forEach((n) => tried.add(n));
    const results = await Promise.allSettled(batch.map((e) => client.entity(e)));
    const found = results.flatMap((r) => (r.status === 'fulfilled' ? [toEntry(r.value)] : []));
    found.forEach(([name, entry]) => loaded.set(name, entry));
    pending = found.flatMap(([, e]) => referencedEntities(e.def)).filter((n) => !tried.has(n));
  }
  return Object.fromEntries(loaded);
}
