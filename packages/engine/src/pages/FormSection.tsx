// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { Panel } from '@c3theme/ui';
import { useEngine, useText } from '../context';
import { fieldTypes, sectionVisible } from '../sectionVisibility';
import FieldInput from '../widgets/FieldInput';
import WithLookup from '../widgets/WithLookup';
import ChildChecklist from './ChildChecklist';
import ChildRecord from './ChildRecord';
import ChildRows from './ChildRows';
import RelatedSection from './RelatedSection';
import SummaryLines from './SummaryLines';
import type { Embedded } from './EntityForm';
import type { LookupButton } from '../hooks/useLookups';
import type { EntityDef, FieldDef, FormSection as Section, WireRecord } from '../types';

/** O que uma seção precisa do formulário que a contém. */
export interface SectionContext {
  def: EntityDef;
  record: WireRecord;
  errors: Record<string, string>;
  editing: boolean;
  /** Id do registro; ausente no novo. */
  id?: string;
  /** Há alteração não gravada no formulário. */
  dirty?: boolean;
  embedded?: Embedded;
  visible: (f: FieldDef) => boolean;
  required: (f: FieldDef) => boolean;
  /** Campo travado na alteração (`createOnly`, `readOnlyWhen` sobre o gravado). */
  locked: (f: FieldDef) => boolean;
  change: (name: string, value: unknown) => void;
  /** Troca a lista de uma filha with_parent. */
  onRows: (entity: string, rows: WireRecord[]) => void;
  /** Botão de consulta (`lookups` com trigger 'button') ao lado do campo, se houver. */
  lookup?: (field: string) => LookupButton | undefined;
}

/** Props da seção custom (`component` na seção): o formulário inteiro, o id gravado e se há alteração pendente. */
export interface CustomSectionProps {
  entity: EntityDef;
  record: WireRecord;
  onChange: (name: string, value: unknown) => void;
  editing: boolean;
  errors: Record<string, string>;
  /** Id do registro gravado; ausente no novo (ainda não dá para ler filhos nem chamar ação). */
  id?: string;
  /** Há alteração não gravada: o que a seção ler do servidor pode estar atrás da tela. */
  dirty: boolean;
}

/** Linhas de campos que aparecem: sem os escondidos por condição e sem os fixos do diálogo. */
function shownRows(s: Section, ctx: SectionContext) {
  return (s.rows ?? []).map((row) =>
    row
      .map((item) => (typeof item === 'string' ? { field: item } : item))
      .map((item) => ({ ...item, def: ctx.def.fields.find((f) => f.name === item.field)! }))
      .filter((item) => item.def && ctx.visible(item.def) && !(ctx.embedded && item.field in ctx.embedded.fixed))
  );
}

/** Se a seção mostra algo agora; uma aba some quando nenhuma seção dela aparece. */
export function sectionShown(s: Section, ctx: SectionContext, components: Record<string, unknown>): boolean {
  if (!sectionVisible(s, ctx.record, fieldTypes(ctx.def))) return false;
  if (s.related?.save === 'with_parent') return true;
  // filhos com CRUD próprio precisam do id do pai; dentro de um diálogo não aninha outra lista
  if (s.related) return ctx.id !== undefined && !ctx.embedded;
  if (s.component) return Boolean(components[s.component]);
  return Boolean(s.summary?.length) || shownRows(s, ctx).some((r) => r.length > 0);
}

/** `fill`: a seção divide a linha com outra (`width`) e estica até a altura da vizinha. */
export default function FormSection({ section: s, ctx, fill }: { section: Section; ctx: SectionContext; fill?: boolean }) {
  const { components } = useEngine();
  const text = useText();
  if (!sectionShown(s, ctx, components)) return null;
  const { def, record, errors, editing } = ctx;

  if (s.related?.save === 'with_parent') {
    const rows = (record[s.related.entity] as WireRecord[] | undefined) ?? [];
    // lista de marcar sobre as opções; uma linha só: os campos da filha direto na seção; senão, a grade
    const Rows = s.related.display === 'checklist' ? ChildChecklist : s.related.maxItems === 1 ? ChildRecord : ChildRows;
    return (
      <Rows
        related={s.related}
        title={s.title}
        rows={rows}
        onChange={(v) => ctx.onRows(s.related!.entity, v)}
        errors={errors}
        editing={editing && !s.related.denied}
      />
    );
  }
  if (s.related) return <RelatedSection parentId={ctx.id!} related={s.related} title={s.title} />;
  if (s.component) {
    const Custom = components[s.component];
    const props: CustomSectionProps = { entity: def, record, onChange: ctx.change, editing, errors, id: ctx.id, dirty: Boolean(ctx.dirty) };
    return <Custom {...props} />;
  }
  const rows = shownRows(s, ctx);
  return (
    <Panel title={s.title ? text(s.title) : undefined} sx={fill ? { height: '100%' } : undefined}>
      {s.description && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {text(s.description)}
        </Typography>
      )}
      <Grid container spacing={2.5}>
        {rows.flatMap((row) =>
          row.map((item) => (
            <Grid key={item.field} size={{ xs: 12, sm: row.length > 1 ? 6 : 12, md: 12 / row.length }}>
              <WithLookup button={ctx.lookup?.(item.field)}>
                <FieldInput
                  field={item.def}
                  value={record[item.field]}
                  onChange={(v) => ctx.change(item.field, v)}
                  error={errors[item.field]}
                  required={editing && ctx.required(item.def)}
                  readOnly={!editing}
                  locked={editing && ctx.locked(item.def)}
                  record={record}
                  component={item.component}
                  existing={ctx.id !== undefined}
                  entity={def.name}
                />
              </WithLookup>
            </Grid>
          ))
        )}
      </Grid>
      {s.summary && <SummaryLines lines={s.summary} record={record} />}
    </Panel>
  );
}
