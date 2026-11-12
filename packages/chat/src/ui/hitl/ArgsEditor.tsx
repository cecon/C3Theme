// material-ui
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';

import type { ArgField, Parsed } from '../../core/hitl';
import type { ChatMessageId } from '../text';
import { useChatText } from '../text';
import { monoFont } from './sx';

export type Drafts = Record<string, string | boolean>;
type ArgError = Exclude<Parsed, { ok: true }>['error'];

export interface ArgsEditorProps {
  fields: ArgField[];
  drafts: Drafts;
  errors: Partial<Record<string, ArgError>>;
  onChange: (name: string, value: string | boolean) => void;
  disabled?: boolean;
}

const ERROR_TEXT: Record<ArgError, ChatMessageId> = {
  required: 'c3.chat.arg.required',
  number: 'c3.chat.arg.number',
  json: 'c3.chat.arg.json',
  option: 'c3.chat.arg.option'
};

/** Os argumentos da ferramenta como campos: texto, várias linhas, número, sim/não, opções e JSON. */
export default function ArgsEditor({ fields, drafts, errors, onChange, disabled }: ArgsEditorProps) {
  const t = useChatText();
  return (
    <Stack spacing={1.5}>
      {fields.map((f) => {
        const label = f.label ?? f.name;
        const value = drafts[f.name];
        const error = errors[f.name];
        const off = disabled || f.readOnly;
        if (f.type === 'boolean')
          return (
            <FormControlLabel
              key={f.name}
              label={label}
              disabled={off}
              control={<Switch checked={value === true} onChange={(e) => onChange(f.name, e.target.checked)} />}
            />
          );
        return (
          <TextField
            key={f.name}
            size="small"
            label={label}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(f.name, e.target.value)}
            disabled={off}
            required={f.required}
            error={!!error}
            helperText={error ? t(ERROR_TEXT[error]) : undefined}
            select={f.type === 'enum'}
            multiline={f.type === 'text' || f.type === 'json'}
            minRows={f.type === 'json' ? 3 : undefined}
            slotProps={{
              htmlInput: { inputMode: f.type === 'number' ? 'decimal' : undefined, spellCheck: f.type !== 'json' },
              input: f.type === 'json' ? { sx: { fontFamily: monoFont, fontSize: 13 } } : undefined
            }}
          >
            {f.options?.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label ?? o.value}
              </MenuItem>
            ))}
          </TextField>
        );
      })}
    </Stack>
  );
}
