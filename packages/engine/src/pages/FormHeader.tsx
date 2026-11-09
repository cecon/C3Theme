import type { ReactNode } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/** Título do registro (e a filial dona) com os botões à direita. */
export default function FormHeader({ title, owner, children }: { title: string; owner?: string; children?: ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
      <Stack>
        <Typography variant="h4">{title}</Typography>
        {owner && (
          <Typography variant="body2" color="text.secondary">
            {owner}
          </Typography>
        )}
      </Stack>
      {children && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {children}
        </Stack>
      )}
    </Stack>
  );
}

/** Cancelar e gravar. No rodapé (`actions: "footer"`), alinhados à direita e, no celular, gravar em cima. */
export function EditButtons({
  submit,
  saving,
  onCancel,
  footer
}: {
  submit: string;
  saving: boolean;
  onCancel: () => void;
  footer?: boolean;
}) {
  const buttons = (
    <>
      <Button color={footer ? 'inherit' : 'primary'} onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="contained" loading={saving}>
        {submit}
      </Button>
    </>
  );
  if (!footer) return buttons;
  return (
    <Stack direction={{ xs: 'column-reverse', sm: 'row' }} sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
      {buttons}
    </Stack>
  );
}
