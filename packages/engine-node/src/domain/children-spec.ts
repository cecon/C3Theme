// Filhos gravados junto com o pai: seção `related` com `"save": "with_parent"`. A filha continua sendo uma entidade
// (campos, validação, tabela própria), mas só se grava pelo pai: a lista vem no corpo dele e entra na mesma gravação.

import { type Access, isFreeAccess, parseAccess } from './access';
import { type Condition, parseCondition } from './condition';
import { type Entity, fieldOf } from './entity';
import { type Rec, isObject } from './types';

/** Padrão e teto de linhas por pai: acima disso, a seção `related` comum (paginada, CRUD próprio). */
export const DEFAULT_MAX = 200;
export const MAX_ITEMS = 500;

export interface Child {
  /** Nome da entidade filha: chave da lista no corpo e na leitura do pai. */
  key: string;
  /** A filha com a coluna do pai como `readOnly`: o motor preenche, o cliente nunca manda. */
  entity: Entity;
  fk: string;
  min: number;
  max: number;
  /** ORDER BY da lista (alias `t`), sempre terminando no id. */
  order: string;
  /** Lista de marcar (`display: checklist`): o reference com a opção marcada; não repete. */
  option?: string;
  /** `visibleWhen` da seção, sobre o registro do pai: escondida, a lista vale vazia. */
  visibleWhen?: Condition;
  access: Access;
}

export class Children {
  private readonly byParent = new Map<string, Child[]>();
  private readonly parents = new Map<string, string>();

  of(parent: string): Child[] {
    return this.byParent.get(parent) ?? [];
  }

  /** Filha que só se grava pelo pai: o CRUD direto dela responde 403. */
  parentOf(entity: string): string | undefined {
    return this.parents.get(entity);
  }

  add(parent: string, child: Child): void {
    const other = this.parents.get(child.key);
    if (other !== undefined) throw new Error(`${child.key}: já é gravada junto com '${other}'; uma filha tem um pai só`);
    this.parents.set(child.key, parent);
    this.byParent.set(parent, [...this.of(parent), child]);
  }
}

const sectionsOf = (e: Entity): unknown[] => {
  const views = isObject(e.raw.views) ? e.raw.views : {};
  const form = isObject(views.form) ? views.form : {};
  return Array.isArray(form.sections) ? form.sections : [];
};

export function parseChildren(entities: Map<string, Entity>): Children {
  const out = new Children();
  for (const name of [...entities.keys()].sort()) {
    const parent = entities.get(name)!;
    for (const section of sectionsOf(parent)) {
      if (!isObject(section) || !isObject(section.related)) continue;
      const related = section.related;
      if (related.save !== 'with_parent') {
        checkSeparately(name, related);
        continue;
      }
      const child = parseOne(parent, related, entities);
      child.access = parseAccess(section.access);
      if (section.visibleWhen !== undefined && section.visibleWhen !== null) {
        try {
          child.visibleWhen = parseCondition(section.visibleWhen, parent);
        } catch (e) {
          throw new Error(`${name}: related '${child.key}' visibleWhen: ${(e as Error).message}`, { cause: e });
        }
      }
      out.add(name, child);
    }
  }
  return out;
}

/** Chaves que só existem em `with_parent`: numa seção `separately` o motor não teria como cumpri-las. */
function checkSeparately(parent: string, related: Rec): void {
  const display = related.display !== undefined && related.display !== 'table';
  const k = ['minItems', 'maxItems', 'option', 'groupBy'].find((x) => related[x] !== undefined) ?? (display ? 'display' : undefined);
  if (k !== undefined) throw new Error(`${parent}: related '${String(related.entity ?? '')}': '${k}' só vale com save 'with_parent'`);
}

function parseOne(parent: Entity, related: Rec, entities: Map<string, Entity>): Child {
  const get = (k: string) => (typeof related[k] === 'string' ? (related[k] as string) : '');
  const [key, fk] = [get('entity'), get('field')];
  const label = `${parent.name}: related '${key}'`;
  const original = entities.get(key);
  if (!original) throw new Error(`${label}: entidade desconhecida`);
  const entity: Entity = { ...original, fields: original.fields.map((f) => ({ ...f })) };
  if (entity.fields.some((f) => !isFreeAccess(f.access)) || entity.raw.rowAccess !== undefined)
    throw new Error(`${label}: filha with_parent ainda não aceita access nos campos nem rowAccess`);
  if (entity.scope !== parent.scope) throw new Error(`${label}: a filha precisa ter o mesmo scope do pai`);
  const f = entity.fields.find((x) => x.name === fk);
  if (!f || f.type !== 'reference' || f.reference !== parent.name)
    throw new Error(`${label}: '${fk}' precisa ser reference para '${parent.name}'`);
  f.readOnly = true;
  const num = (k: string, d: number) => (typeof related[k] === 'number' && (related[k] as number) >= 0 ? (related[k] as number) : d);
  const [min, max] = [num('minItems', 0), num('maxItems', DEFAULT_MAX)];
  if (max > MAX_ITEMS || min > max) throw new Error(`${label}: minItems/maxItems fora da faixa (0 <= min <= max <= ${MAX_ITEMS})`);
  const order: string[] = [];
  for (const part of get('sort').split(',').filter(Boolean)) {
    const desc = part.startsWith('-');
    const n = desc ? part.slice(1) : part;
    if (!fieldOf(entity, n)) throw new Error(`${label}: sort cita campo inexistente '${n}'`);
    order.push(`t."${n}" IS NULL, t."${n}" ${desc ? 'DESC' : 'ASC'}`);
  }
  order.push('t."id" ASC');
  return {
    key,
    entity,
    fk,
    min,
    max,
    order: order.join(', '),
    option: parseOption(label, entity, fk, related, entities),
    access: { view: [], edit: [] }
  };
}

/** `display: checklist`: `option` é um reference da filha (fora a do pai); `groupBy` é campo da entidade das opções. */
function parseOption(label: string, entity: Entity, fk: string, related: Rec, entities: Map<string, Entity>): string | undefined {
  const get = (k: string) => (typeof related[k] === 'string' ? (related[k] as string) : undefined);
  if (get('display') !== 'checklist') {
    if (get('option') !== undefined || get('groupBy') !== undefined)
      throw new Error(`${label}: option/groupBy só valem com display 'checklist'`);
    return undefined;
  }
  const opt = get('option') ?? '';
  const f = fieldOf(entity, opt);
  const target = f && opt !== fk && f.type === 'reference' ? f.reference : undefined;
  if (target === undefined) throw new Error(`${label}: checklist precisa de 'option', um reference da filha que não seja '${fk}'`);
  const group = get('groupBy');
  if (group !== undefined && !(entities.get(target) && fieldOf(entities.get(target)!, group)))
    throw new Error(`${label}: groupBy '${group}' não é campo de '${target}'`);
  return opt;
}
