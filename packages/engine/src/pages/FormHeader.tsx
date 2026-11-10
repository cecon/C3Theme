import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Trash } from 'iconsax-reactjs';

/** Imagem à esquerda do título e linhas embaixo dele (`views.form.header`). */
export interface FormLead {
  image?: ReactNode;
  lines: string[];
}

/** Título do registro (e a filial dona) com os botões à direita; com `lead`, a imagem e as linhas do cabeçalho. */
export default function FormHeader(props: { title: string; owner?: string; lead?: FormLead; children?: ReactNode }) {
  const { title, owner, lead, children } = props;
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
        {lead?.image}
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="h4">{title}</Typography>
          {lead?.lines.map((l, i) => (
            <Typography key={i} variant={i ? 'caption' : 'body1'} color="text.secondary">
              {l}
            </Typography>
          ))}
          {owner && (
            <Typography variant="body2" color="text.secondary">
              {owner}
            </Typography>
          )}
        </Stack>
      </Stack>
      {children && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {children}
        </Stack>
      )}
    </Stack>
  );
}

interface FrameProps {
  /** Num diálogo com `actions: "footer"`: título, conteúdo com divisória e os botões no rodapé do diálogo. */
  dialog: boolean;
  title: string;
  owner?: string;
  lead?: FormLead;
  /** Mostra o cabeçalho com o título na página (no rodapé editando, o título da página já basta). */
  header: boolean;
  /** Botões do cabeçalho (ou, no diálogo, do rodapé). */
  top?: ReactNode;
  /** Botões do fim do formulário. */
  bottom?: ReactNode;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}

/** Moldura do formulário: na página, cabeçalho, seções e rodapé; num diálogo, as partes do próprio diálogo. */
export function FormFrame({ dialog, title, owner, lead, header, top, bottom, onSubmit, children }: FrameProps) {
  const content = useRef<HTMLDivElement>(null);
  // diálogo aberto para digitar: o cursor já vai para o primeiro campo
  useEffect(() => {
    if (dialog && bottom) content.current?.querySelector<HTMLElement>('input:not([type=hidden]), textarea')?.focus();
  }, [dialog]); // eslint-disable-line react-hooks/exhaustive-deps
  if (dialog)
    return (
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'contents' }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers ref={content}>
          <Stack spacing={2.5}>{children}</Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
          {top}
          {bottom}
        </DialogActions>
      </Box>
    );
  return (
    <Stack spacing={2.5} component="form" onSubmit={onSubmit} noValidate>
      {header && (
        <FormHeader title={title} owner={owner} lead={lead}>
          {top}
        </FormHeader>
      )}
      {children}
      {bottom}
    </Stack>
  );
}

interface EditProps {
  submit: string;
  saving: boolean;
  onCancel: () => void;
  /** No fim do formulário da página: alinhados à direita e, no celular, gravar em cima. */
  footer?: boolean;
  /** No rodapé de um diálogo: Excluir à esquerda (registro gravado). */
  onDelete?: () => void;
  dialog?: boolean;
}

/** Cancelar e gravar, no cabeçalho, no fim da página ou no rodapé do diálogo. */
export function EditButtons({ submit, saving, onCancel, footer, onDelete, dialog }: EditProps) {
  const buttons = (
    <>
      {onDelete && (
        <Button color="error" startIcon={<Trash size={18} />} onClick={onDelete} sx={{ mr: 'auto' }}>
          Excluir
        </Button>
      )}
      <Button color={dialog ? 'secondary' : footer ? 'inherit' : 'primary'} onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="contained" loading={saving}>
        {submit}
      </Button>
    </>
  );
  if (!footer || dialog) return buttons;
  return (
    <Stack direction={{ xs: 'column-reverse', sm: 'row' }} sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
      {buttons}
    </Stack>
  );
}
