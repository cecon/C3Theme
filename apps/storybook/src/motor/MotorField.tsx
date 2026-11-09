// Um campo como o formulário do motor desenha: o FieldInput lê a definição do campo na spec (tipo, rótulo, limites,
// moeda, obrigatório) e escolhe o componente do @c3theme/ui. A história só diz qual campo e qual valor.

import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';

import { FieldInput, useEntity } from '@c3theme/engine';

export interface MotorFieldProps {
  /** Entidade da spec do Storybook. */
  entity: string;
  /** Campo dessa entidade. */
  field: string;
  /** Valor no formato trafegado (decimal em texto com ponto, data ISO, reference `{ id, title }`). */
  value?: unknown;
  /** Erro como o servidor devolve na validação (`errors[campo][0].message`). */
  error?: string;
  /** Registro já gravado: campo só de escrita vazio mantém a senha. */
  existing?: boolean;
  onChange?: (value: unknown) => void;
}

export default function MotorField({ entity, field, value = null, error, existing, onChange }: MotorFieldProps) {
  const def = useEntity(entity).def.fields.find((f) => f.name === field)!;
  const [current, setCurrent] = useState(value);
  useEffect(() => setCurrent(value), [value]);
  return (
    <Box sx={{ maxWidth: 420 }}>
      <FieldInput
        field={def}
        value={current}
        error={error}
        required={def.required}
        readOnly={def.readOnly}
        existing={existing}
        entity={entity}
        onChange={(next) => {
          setCurrent(next);
          onChange?.(next);
        }}
      />
    </Box>
  );
}
