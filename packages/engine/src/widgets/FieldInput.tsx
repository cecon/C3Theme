import { useIntl } from 'react-intl';

// material-ui
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';

import {
  currencySymbol,
  DateField,
  DateTimeField,
  DecimalField,
  FileField,
  FlagsField,
  SelectField,
  SwatchField,
  withHint
} from '@c3theme/ui';
import type { FileValue } from '@c3theme/ui';

import { useEngine, useText } from '../context';
import { fromDay, toDay } from '../calendarForm';
import { datetimeToLocalInput, displayValue, findOption, formatDate, localInputToDatetime, recordOptions } from '../format';
import DocumentInput from './DocumentInput';
import FlowFieldLink from '../pages/flow/FlowFieldLink';
import PasswordInput from './PasswordInput';
import ReferenceInput from './ReferenceInput';
import { saveFile } from '../export';
import type { FieldDef, WireRecord } from '../types';

export interface FieldInputProps {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  /** widget custom escolhido na view ({ field, component }) */
  component?: string;
  /** Registro já gravado: campo só de escrita vazio mantém o valor. */
  existing?: boolean;
  /** Travado na alteração (`createOnly`, `readOnlyWhen`): aparece só leitura, com o aviso. No custom, `readOnly` já vem true. */
  locked?: boolean;
  /** Registro do formulário, para o `filter` de um reference. */
  record?: WireRecord;
  /** Entidade do registro: o arquivo gravado (`file`) baixa por ela. */
  entity?: string;
  /** Início ou fim de um evento de dia inteiro: datetime editado só como data (o fim, inclusivo). */
  allDay?: 'start' | 'end';
  /** Aparência escolhida na view: enum com cores em bolinhas. */
  display?: 'swatches';
}

/** Props que um componente custom de campo recebe. */
export type CustomFieldProps = FieldInputProps & { label: string };

/** Widget padrão de cada tipo (os campos do @c3theme/ui); a view pode trocar por um componente registrado. */
export default function FieldInput(props: FieldInputProps) {
  const { field, value, onChange, error, required, locked, component } = props;
  const readOnly = props.readOnly || locked;
  const { components, client, entities } = useEngine();
  const text = useText();
  const intl = useIntl();
  const label = text(field.label, field.name);
  const hint = field.hint ? text(field.hint) : undefined;
  const helper = error ?? (field.help ? text(field.help) : undefined);

  if (component) {
    const Custom = components[component];
    // o custom recebe o travamento já somado ao readOnly: quem só olha readOnly também trava
    if (Custom) return <Custom {...props} readOnly={readOnly} label={label} />;
    console.warn(`c3: componente '${component}' não registrado; usando o padrão de ${field.type}`);
  }

  // o grafo do editor de fluxo (views.flow) não é texto para digitar: vira o resumo com o botão do editor, que vale
  // também com o formulário em leitura (o editor confere sozinho se o usuário pode alterar)
  if (props.entity && entities[props.entity]?.def.views?.flow?.field === field.name) {
    return <FlowFieldLink label={label} value={value} entity={props.entity} id={props.record?.id} />;
  }
  if (field.writeOnly) return <PasswordInput {...props} label={withHint(label, hint)} />;
  if (field.format && !readOnly) return <DocumentInput {...props} label={withHint(label, hint)} />;
  const options = (field.options ?? []).map((o) => ({ value: o.value, label: text(o.label, String(o.value)) }));
  if (field.type === 'flags') {
    const bits = options.map((o) => ({ ...o, value: Number(o.value) }));
    return (
      <FlagsField
        {...{ label, hint, error, required, readOnly }}
        helperText={helper}
        options={bits}
        value={Number(value ?? 0)}
        onChange={onChange}
      />
    );
  }
  if (field.type === 'file') {
    const file = (value ?? null) as FileValue | null;
    return (
      <FileField
        {...{ label, hint, error, required, readOnly }}
        helperText={helper}
        accept={field.accept}
        maxSize={field.maxSize}
        value={file}
        onChange={onChange}
        onDownload={
          props.entity && props.record?.id ? () => saveFile(client, props.entity!, String(props.record!.id), field.name, file!) : undefined
        }
      />
    );
  }
  if (props.allDay) {
    const day = toDay(value, props.allDay);
    if (readOnly)
      return (
        <TextField label={label} value={day ? formatDate(day, intl.locale) : '—'} fullWidth slotProps={{ input: { readOnly: true } }} />
      );
    return (
      <DateField
        {...{ label, hint, required, error, helperText: helper }}
        value={day}
        onChange={(d) => onChange(fromDay(d, props.allDay!))}
      />
    );
  }
  if (field.type === 'enum' && props.display === 'swatches') {
    const swatches = (field.options ?? []).map((o) => ({
      value: o.value,
      label: text(o.label, String(o.value)),
      tone: o.color ?? 'neutral'
    }));
    return (
      <SwatchField
        {...{ label, hint, error, required, readOnly }}
        helperText={helper}
        options={swatches}
        value={(value ?? null) as string | number | null}
        onChange={onChange}
      />
    );
  }
  // opções que o próprio registro traz (`optionsFrom`); sem lista, segue o texto livre
  const fromRecord = recordOptions(field, props.record);
  if (fromRecord && !readOnly)
    return (
      <SelectField
        {...{ label, hint, required, error }}
        helperText={helper}
        options={fromRecord}
        value={(value ?? null) as string | null}
        onChange={onChange}
      />
    );
  if (readOnly) {
    const listed = fromRecord?.find((o) => o.value === value)?.label;
    const shown = listed ?? displayValue(field, value, intl.locale, (v) => text(findOption(field, v)?.label, v));
    return (
      <TextField
        label={withHint(label, hint)}
        value={shown || '—'}
        fullWidth
        multiline={field.type === 'text'}
        slotProps={{ input: { readOnly: true } }}
        variant="outlined"
        error={Boolean(locked && error)}
        helperText={
          locked
            ? (error ??
              (field.denied
                ? text({ id: 'c3.field.denied', defaultMessage: 'Você não tem permissão para alterar.' })
                : text({ id: 'c3.field.locked', defaultMessage: 'Não pode mais ser alterado.' })))
            : undefined
        }
      />
    );
  }

  const common = { label: withHint(label, hint), required, fullWidth: true, error: Boolean(error), helperText: helper };
  const base = { label, hint, required, error, helperText: helper };
  const str = (value ?? '') as string;

  switch (field.type) {
    case 'boolean':
      return (
        <FormControl error={Boolean(error)}>
          <FormControlLabel
            control={<Switch checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />}
            label={withHint(label, hint)}
          />
          {helper && <FormHelperText>{helper}</FormHelperText>}
        </FormControl>
      );
    case 'enum':
      return <SelectField {...base} options={options} value={(value ?? null) as string | number | null} onChange={onChange} />;
    case 'reference':
      return <ReferenceInput {...props} label={label} helper={helper} hint={hint} />;
    case 'text':
      return (
        <TextField
          {...common}
          multiline
          minRows={3}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{ htmlInput: { maxLength: field.maxLength } }}
        />
      );
    case 'integer':
      return (
        <TextField
          {...common}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          slotProps={{
            htmlInput: { step: 1, min: field.min, max: field.max },
            input: { endAdornment: field.unit ? <InputAdornment position="end">{field.unit}</InputAdornment> : undefined }
          }}
        />
      );
    case 'decimal':
      // decimal trafega como string: o usuário digita com vírgula ou ponto, a spec recebe ponto
      return (
        <DecimalField
          {...base}
          scale={field.scale}
          prefix={field.currency ? currencySymbol(field.currency, intl.locale) : undefined}
          suffix={field.unit}
          allowNegative={field.min === undefined || field.min < 0}
          value={(value ?? null) as string | null}
          onChange={onChange}
        />
      );
    case 'date':
      return <DateField {...base} value={(value ?? null) as string | null} onChange={onChange} />;
    case 'datetime':
      // a spec trafega UTC; o campo mostra e edita no fuso de quem usa
      return (
        <DateTimeField
          {...base}
          value={str ? datetimeToLocalInput(str) : null}
          onChange={(v) => onChange(v ? localInputToDatetime(v) : null)}
        />
      );
    case 'email':
      return (
        <TextField
          {...common}
          type="email"
          value={str}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{ htmlInput: { maxLength: field.maxLength } }}
        />
      );
    default:
      return (
        <TextField
          {...common}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{ htmlInput: { maxLength: field.maxLength } }}
        />
      );
  }
}
