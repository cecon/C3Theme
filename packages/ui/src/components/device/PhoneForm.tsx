import { FormEvent, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { parseAllowValue } from './allowRules';
import { useDeviceText } from './text';

export interface PhoneFormProps {
  defaultPhone?: string;
  onSubmit: (digits: string) => void;
  onBack: () => void;
}

/** Pede o número do celular para o código de pareamento (o aplicativo só gera o código para um número). */
export default function PhoneForm({ defaultPhone = '', onSubmit, onBack }: PhoneFormProps) {
  const t = useDeviceText();
  const [phone, setPhone] = useState(defaultPhone);
  const [touched, setTouched] = useState(false);
  const parsed = parseAllowValue(phone);
  const valid = parsed.ok && parsed.kind === 'contact';

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (parsed.ok && parsed.kind === 'contact') onSubmit(parsed.value);
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={1.5} noValidate>
      <TextField
        autoFocus
        label={t('c3.device.phone')}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onBlur={() => setTouched(true)}
        error={touched && !valid}
        helperText={touched && !valid ? t('c3.device.phone.invalid') : t('c3.device.phone.help')}
        slotProps={{ htmlInput: { inputMode: 'tel', autoComplete: 'tel' } }}
        fullWidth
      />
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained">
          {t('c3.device.requestCode')}
        </Button>
        <Button color="secondary" onClick={onBack}>
          {t('c3.device.useQr')}
        </Button>
      </Stack>
    </Stack>
  );
}
