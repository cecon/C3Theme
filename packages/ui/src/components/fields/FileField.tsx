import { useRef, useState } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, DocumentUpload } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import { withHint } from './HintButton';
import type { BaseFieldProps } from './types';
import { decodedSize, fileProblem, formatKb } from './values';
import type { FileValue } from './values';

export interface FileFieldProps extends BaseFieldProps<FileValue | null> {
  /** Extensões aceitas, com ponto (".pfx"). Vazio: qualquer uma. */
  accept?: string[];
  /** Tamanho máximo em bytes; padrão 1 MB. */
  maxSize?: number;
  /** Baixa o arquivo já gravado (sem `data`): o nome vira link. */
  onDownload?: () => void;
}

/**
 * Arquivo inteiro no valor: `{ name, contentType, data }` com `data` em base64. Confere extensão e tamanho antes de
 * ler; o backend confere de novo. Para arquivo grande, use upload próprio: base64 cresce um terço.
 */
export default function FileField(props: FileFieldProps) {
  const { label, hint, value: file, onChange, error, helperText, required, disabled, readOnly, fullWidth = true, sx } = props;
  const { accept = [], maxSize = 1 << 20, onDownload } = props;
  const t = useUiText();
  const { locale } = useIntl();
  const input = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState<string>();
  const locked = readOnly || disabled;

  const pick = (f: File | undefined) => {
    if (input.current) input.current.value = '';
    if (!f) return;
    const problem = fileProblem(f, accept, maxSize);
    if (problem === 'type') return setLocal(t('c3.file.type', { accept: accept.join(', ') }));
    if (problem === 'large') return setLocal(t('c3.file.large', { size: formatKb(maxSize, locale) }));
    if (problem === 'empty') return setLocal(t('c3.file.empty'));
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setLocal(undefined);
      onChange({ name: f.name, ...(f.type ? { contentType: f.type } : {}), data: url.slice(url.indexOf(',') + 1) });
    };
    reader.onerror = () => setLocal(t('c3.file.read'));
    reader.readAsDataURL(f);
  };

  const helper = error ?? local ?? helperText;
  return (
    <FormControl error={Boolean(error ?? local)} required={required} disabled={disabled} fullWidth={fullWidth} sx={sx}>
      <FormLabel sx={{ mb: 1 }}>{withHint(label, hint)}</FormLabel>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minHeight: 40 }}>
        {!locked && (
          <Button variant="outlined" startIcon={<DocumentUpload size={18} />} onClick={() => input.current?.click()}>
            {file ? t('c3.file.replace') : t('c3.file.choose')}
          </Button>
        )}
        {file ? (
          <>
            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {onDownload && !file.data ? (
                <Link component="button" type="button" variant="body2" onClick={onDownload}>
                  {file.name}
                </Link>
              ) : (
                file.name
              )}{' '}
              <Typography component="span" variant="caption" color="text.secondary">
                {formatKb(file.size ?? decodedSize(file.data ?? ''), locale)}
              </Typography>
            </Typography>
            {!locked && (
              <IconButton size="small" aria-label={t('c3.file.remove')} onClick={() => onChange(null)}>
                <CloseCircle size={18} />
              </IconButton>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {locked ? '—' : t('c3.file.hint', { accept: accept.join(', ') || t('c3.file.any'), size: formatKb(maxSize, locale) })}
          </Typography>
        )}
      </Stack>
      <input ref={input} type="file" hidden accept={accept.join(',') || undefined} onChange={(e) => pick(e.target.files?.[0])} />
      {helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>
  );
}
