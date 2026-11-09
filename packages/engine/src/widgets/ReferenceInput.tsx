import { useEffect, useMemo, useState } from 'react';

import { SearchSelectField } from '@c3theme/ui';

import { resolveFilter } from '../conditions.mjs';
import { useEngine, useText } from '../context';
import EntityDialog from '../pages/EntityDialog';
import type { FieldInputProps } from './FieldInput';
import type { Condition, RefValue } from '../types';

/**
 * `SearchSelectField` que busca pelo título da entidade referenciada. Se o usuário pode criar registros dela,
 * a última opção abre o formulário num diálogo, já com o texto digitado, e o registro gravado vira o valor.
 * Com `filter` no campo, só aparecem as opções que valem para o formulário atual (o backend confere de novo).
 * `noCreate` tira o "Cadastrar" (filtro do painel escolhe, não cadastra); `size` como no campo de texto.
 */
export default function ReferenceInput(
  props: FieldInputProps & { label: string; helper?: string; hint?: string; noCreate?: boolean; size?: 'small' | 'medium' }
) {
  const { field, value, onChange, error, required, label, helper, hint, record, noCreate, size } = props;
  const { client, entities } = useEngine();
  const text = useText();
  const target = entities[field.entity!]?.def;
  const canCreate = !noCreate && Boolean(entities[field.entity!]?.capabilities.create);
  const [creating, setCreating] = useState(false);
  const titleField = target?.titleField ?? target?.fields.find((f) => ['string', 'text', 'email'].includes(f.type))?.name;
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<RefValue[]>([]);
  const [loading, setLoading] = useState(false);
  const current = (value && typeof value === 'object' ? value : null) as RefValue | null;
  // filtro do campo com as variáveis do formulário; a chave em texto evita buscar de novo a cada render
  const filterKey = JSON.stringify(field.filter ? resolveFilter(field.filter, record ?? {}) : null);
  const filter = useMemo(() => JSON.parse(filterKey) as Condition | null, [filterKey]);

  useEffect(() => {
    if (!target || !titleField) return;
    let active = true;
    setLoading(true);
    // o campo já espera a digitação parar antes de chamar onSearch
    client
      .list(target.name, {
        pageSize: 25,
        sort: titleField,
        where: and([filter, input ? { field: titleField, op: 'contains', value: input } : null])
      })
      .then((r) => active && setOptions(r.data.map((d) => ({ id: d.id!, title: String(d[titleField] ?? d.id) }))))
      .catch(() => active && setOptions([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [client, target, titleField, input, filter]);

  const singular = target ? text(target.label.singular).toLowerCase() : '';
  const noAccess = text({ id: 'c3.reference.noAccess', defaultMessage: 'Registro sem acesso' });
  const toOption = (r: RefValue) => ({ value: r.id, label: r.title ?? noAccess });

  return (
    <>
      <SearchSelectField<string>
        {...{ label, error, required, hint, size }}
        helperText={helper}
        value={current?.id ?? null}
        selected={current ? [toOption(current)] : []}
        options={options.map(toOption)}
        loading={loading}
        onSearch={setInput}
        onChange={(_, o) => onChange(o ? { id: o.value, title: o.label } : null)}
        onCreate={canCreate ? () => setCreating(true) : undefined}
        createLabel={(typed) => (typed ? `Cadastrar ${singular} “${typed}”` : `Cadastrar ${singular}`)}
      />
      {canCreate && target && (
        <EntityDialog
          open={creating ? {} : null}
          entity={target.name}
          initial={titleField && input.trim() ? { [titleField]: input.trim() } : undefined}
          onClose={(_, saved) => {
            setCreating(false);
            if (saved) onChange({ id: saved.id!, title: String((titleField && saved[titleField]) ?? saved.id) });
          }}
        />
      )}
    </>
  );
}

const and = (parts: (Condition | null)[]): Condition | undefined => {
  const kept = parts.filter((p): p is Condition => p !== null);
  return kept.length > 1 ? { and: kept } : kept[0];
};
