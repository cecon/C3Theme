import { useIntl } from 'react-intl';

import { useText } from '../context';
import { displayValue, findOption } from '../format';
import type { FormLead } from '../pages/FormHeader';
import type { EntityDef, WireRecord } from '../types';
import RecordImage from '../widgets/RecordImage';

/** Cabeçalho do registro gravado (`views.form.header`, #13): a imagem ou avatar e as linhas de `subtitle` e `caption`. */
export default function useRecordLead(def: EntityDef, record: WireRecord | undefined): FormLead | undefined {
  const text = useText();
  const { locale } = useIntl();
  const h = def.views?.form?.header;
  if (!h || !record) return undefined;
  const show = (name: string) => {
    const f = def.fields.find((x) => x.name === name);
    return f ? displayValue(f, record[name], locale, (v) => text(findOption(f, v)?.label, v)) : '';
  };
  const caption = (h.caption ?? []).map(show).filter(Boolean).join(' · ');
  return {
    image: h.image ? <RecordImage def={def} record={record} image={h.image} size={56} /> : undefined,
    lines: [h.subtitle ? show(h.subtitle) : '', caption].filter(Boolean)
  };
}
