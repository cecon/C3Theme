import { useRef, useState, type DragEvent } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Typography from '@mui/material/Typography';

// third-party
import { DocumentUpload } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import { withHint } from '../fields/HintButton';
import type { BaseFieldProps } from '../fields/types';
import { fileProblem } from '../fields/values';
import type { UploadedFile, Uploader } from './types';
import { formatSize, UploadRow } from './UploadRow';
import useUploads from './useUploads';

export interface UploadFieldProps extends BaseFieldProps<UploadedFile[]> {
  /** Como o arquivo sobe (ex.: `xhrUploader({ url })`). Defina fora do render ou com useMemo. */
  upload: Uploader;
  /** Extensões aceitas, com ponto (".pdf"). Vazio: qualquer uma. */
  accept?: string[];
  /** Tamanho máximo de cada arquivo em bytes. Padrão 20 MB. */
  maxSize?: number;
  /** Quantos arquivos o campo guarda. Padrão: sem limite; 1 vira campo de arquivo único. */
  maxFiles?: number;
  /** Envios simultâneos. Padrão 3. */
  concurrency?: number;
}

/**
 * Anexos que sobem na hora, com barra de progresso, cancelar e tentar de novo. O valor é a lista de referências
 * que o servidor devolveu (`UploadedFile[]`), não o conteúdo: serve para arquivo grande, ao contrário do
 * `FileField` (base64 no próprio valor, até 1 MB).
 */
export default function UploadField(props: UploadFieldProps) {
  const { label, hint, value, onChange, error, helperText, required, disabled, readOnly, fullWidth = true, sx } = props;
  const { upload, accept = [], maxSize = 20 << 20, maxFiles, concurrency } = props;
  const t = useUiText();
  const { locale } = useIntl();
  const input = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState<string>();
  const [over, setOver] = useState(false);
  const latest = useRef(value);
  latest.current = value;
  const single = maxFiles === 1;
  const uploads = useUploads(upload, {
    concurrency,
    onDone: (file, key) => {
      // arquivo único: o novo substitui o anterior quando terminar
      onChange(single ? [file] : [...latest.current, file]);
      uploads.remove(key);
    }
  });
  const locked = readOnly || disabled;
  const pending = uploads.items.filter((i) => i.status !== 'done');

  const pick = (files: File[]) => {
    if (input.current) input.current.value = '';
    if (locked || files.length === 0) return;
    const room = maxFiles === undefined ? Infinity : maxFiles - (single ? 0 : value.length) - pending.length;
    const problems: string[] = [];
    const ok = files.filter((f) => {
      const p = fileProblem(f, accept, maxSize);
      if (p === 'type') problems.push(`${f.name}: ${t('c3.file.type', { accept: accept.join(', ') })}`);
      if (p === 'large') problems.push(`${f.name}: ${t('c3.file.large', { size: formatSize(maxSize, locale) })}`);
      if (p === 'empty') problems.push(`${f.name}: ${t('c3.file.empty')}`);
      return p === null;
    });
    if (ok.length > room) problems.push(t('c3.upload.max', { count: maxFiles! }));
    setLocal(problems.length ? problems.join(' ') : undefined);
    uploads.add(ok.slice(0, Math.max(0, room)));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    pick(Array.from(e.dataTransfer.files));
  };

  const helper = error ?? local ?? helperText;
  const full = maxFiles !== undefined && !single && value.length + pending.length >= maxFiles;
  return (
    <FormControl error={Boolean(error ?? local)} required={required} disabled={disabled} fullWidth={fullWidth} sx={sx}>
      <FormLabel sx={{ mb: 1 }}>{withHint(label, hint)}</FormLabel>
      {!locked && !full && (
        <Box
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click())}
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.75,
            cursor: 'pointer',
            borderRadius: 1,
            border: `1px dashed ${over ? theme.vars.palette.primary.main : theme.vars.palette.divider}`,
            bgcolor: over ? theme.vars.palette.action.hover : theme.vars.palette.background.paper,
            transition: 'border-color .15s, background-color .15s',
            '&:hover, &:focus-visible': { borderColor: theme.vars.palette.primary.main, outline: 'none' }
          })}
        >
          <DocumentUpload size={24} />
          <Box>
            <Typography variant="body2">{t(single ? 'c3.upload.dropOne' : 'c3.upload.drop')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t('c3.upload.hint', { accept: accept.join(', ') || t('c3.file.any'), size: formatSize(maxSize, locale) })}
            </Typography>
          </Box>
        </Box>
      )}
      {(value.length > 0 || pending.length > 0) && (
        <Box sx={{ mt: locked ? 0 : 1 }}>
          {value.map((f) => (
            <UploadRow
              key={f.id}
              name={f.name}
              size={f.size}
              url={f.url}
              locale={locale}
              removeLabel={t('c3.upload.remove', { name: f.name })}
              onRemove={locked ? undefined : () => onChange(value.filter((v) => v.id !== f.id))}
            />
          ))}
          {pending.map((i) => (
            <UploadRow
              key={i.key}
              name={i.file.name}
              size={i.file.size}
              item={i}
              locale={locale}
              removeLabel={t('c3.upload.cancel', { name: i.file.name })}
              onRemove={() => uploads.cancel(i.key)}
              onRetry={() => uploads.retry(i.key)}
            />
          ))}
        </Box>
      )}
      {locked && value.length === 0 && <Typography variant="body2">—</Typography>}
      <input
        ref={input}
        type="file"
        hidden
        multiple={!single}
        accept={accept.join(',') || undefined}
        onChange={(e) => pick(Array.from(e.target.files ?? []))}
      />
      {helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>
  );
}
