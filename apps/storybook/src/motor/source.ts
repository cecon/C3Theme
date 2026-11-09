// O painel Code das histórias pelo motor mostra o JSON da spec, não o JSX: é o que quem usa o motor escreve.

import type { AppDef } from '@c3theme/engine';

import { APP, ENTITIES } from './spec';

/** Tag da história que usa o componente direto, sem o motor: lacuna anotada, não exemplo a seguir. O CSF só aceita a tag
 * escrita literal na história, então ela repete 'uso-direto'. */
const DIRECT = 'uso-direto';

/** O arquivo como está, sem o `$schema` (caminho do repositório). */
function pretty(doc: object) {
  const { $schema: _s, ...rest } = doc as Record<string, unknown>;
  return JSON.stringify(rest, null, 2);
}

export const entityDef = (name: string) => {
  const def = ENTITIES.find((e) => e.name === name);
  if (!def) throw new Error(`entidade '${name}' fora da spec do Storybook`);
  return def;
};

export const fieldDef = (entity: string, field: string) => {
  const def = entityDef(entity).fields.find((f) => f.name === field);
  if (!def) throw new Error(`campo '${entity}.${field}' fora da spec do Storybook`);
  return def;
};

export const pageDef = (path: string) => {
  const page = APP.pages?.find((p) => p.path === path);
  if (!page) throw new Error(`página '${path}' fora do app.json do Storybook`);
  return page;
};

type Ctx = { args: Record<string, unknown>; tags: string[]; parameters: { motor?: { entity?: string } } };

/**
 * `parameters.docs.source` que troca o JSX pelo JSON: da página (`args.page`), do campo (`args.field`) ou da entidade (`args.entity`, ou
 * `parameters.motor.entity` quando os args são do componente direto). A história com a tag `uso-direto` (o motor não
 * alcança) continua mostrando o JSX.
 */
export const jsonSource = {
  transform: (code: string, { args, tags, parameters }: Ctx) => {
    if (tags.includes(DIRECT)) return code;
    if (args.page) return pretty(pageDef(String(args.page)));
    const entity = String(parameters.motor?.entity ?? args.entity);
    return pretty(args.field ? fieldDef(entity, String(args.field)) : entityDef(entity));
  }
};

type Orientation = NonNullable<AppDef['layout']['orientation']>;

/** O app.json da spec com outra orientação do menu: a única chave que muda entre as histórias da shell. */
export const appWith = (orientation: Orientation): AppDef => ({ ...APP, layout: { ...APP.layout, orientation } });

/** `parameters.docs.source` das histórias da shell: o app.json com a orientação da história (`args.orientation`). */
export const appSource = {
  transform: (_code: string, { args }: Ctx) => pretty(appWith((args.orientation as Orientation | undefined) ?? 'vertical'))
};
