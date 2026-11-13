// Linha de configuração da spec (#119): liga o `SettingsRow` do @c3theme/ui ao controle declarado e devolve o valor
// mudado para o modal. Nenhum ajuste é escrito aqui; a linha é dado do app.json.

import type { ComponentType } from 'react';

import { SettingsAction, SettingsRow, SettingsSelect, SettingsSlider, SettingsSwitch } from '@c3theme/ui';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { useSettingsRow } from '@c3theme/ui';

import type { SettingsControlDef, SettingsRowDef } from '../settingsTypes';
import type { Text } from '../types';

/** O que a linha precisa do modal: tradução, valor atual, mudança e ação. */
export interface SettingsRowBinding {
  text: (value: Text | undefined, fallback?: string) => string;
  value: string | number | boolean | null | undefined;
  onChange: (value: string | number | boolean) => void;
  onAction: (action: string) => void;
  openPage: (page: string) => void;
  component: ComponentType<Record<string, unknown>> | undefined;
}

function Controle({ control, binding }: { control: SettingsControlDef; binding: SettingsRowBinding }) {
  const row = useSettingsRow();
  switch (control.type) {
    case 'switch':
      return <SettingsSwitch checked={binding.value === true} onChange={(checked) => binding.onChange(checked)} />;
    case 'select':
      return (
        <SettingsSelect
          value={typeof binding.value === 'string' ? binding.value : (control.value ?? '')}
          options={control.options.map((option) => ({ value: option.value, label: binding.text(option.label, option.value) }))}
          onChange={(value) => binding.onChange(value)}
        />
      );
    case 'slider': {
      const value = typeof binding.value === 'number' ? binding.value : (control.value ?? control.min);
      return (
        <SettingsSlider
          value={value}
          min={control.min}
          max={control.max}
          {...(control.step === undefined ? {} : { step: control.step })}
          {...(control.unit === undefined ? {} : { unit: control.unit })}
          onChange={(novo) => binding.onChange(novo)}
        />
      );
    }
    case 'action': {
      const acao = control.action ?? (typeof control.label === 'string' ? control.label : control.label.id);
      return <SettingsAction onClick={() => binding.onAction(acao)}>{binding.text(control.label)}</SettingsAction>;
    }
    case 'page':
      return <SettingsAction onClick={() => binding.openPage(control.page)}>{binding.text(control.label)}</SettingsAction>;
    case 'text':
      if (control.readOnly === false)
        return (
          <TextField
            size="small"
            value={binding.value ?? ''}
            onChange={(e) => binding.onChange(e.target.value)}
            slotProps={{ htmlInput: { 'aria-labelledby': row.labelId, 'aria-describedby': row.descriptionId } }}
          />
        );
      return <Typography variant="body2">{binding.value === null || binding.value === undefined ? '' : String(binding.value)}</Typography>;
    case 'custom': {
      const Componente = binding.component;
      return Componente === undefined ? null : <Componente {...(control.config ?? {})} />;
    }
  }
}

/** A linha com o controle à direita; a descrição e o rótulo vêm da spec, traduzidos. */
export default function SettingsRowControl({ def, binding }: { def: SettingsRowDef; binding: SettingsRowBinding }) {
  const readOnly = 'readOnly' in def.control && def.control.readOnly === true;
  const guarded = {
    ...binding,
    onChange: (value: string | number | boolean) => {
      if (!readOnly) binding.onChange(value);
    },
    onAction: (action: string) => {
      if (!readOnly) binding.onAction(action);
    },
    openPage: (page: string) => {
      if (!readOnly) binding.openPage(page);
    }
  };
  return (
    <SettingsRow
      disabled={readOnly}
      label={binding.text(def.title)}
      {...(def.description === undefined ? {} : { description: binding.text(def.description) })}
    >
      <Controle control={def.control} binding={guarded} />
    </SettingsRow>
  );
}
