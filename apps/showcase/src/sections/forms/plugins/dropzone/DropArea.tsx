import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

// third-party
import { DocumentUpload } from 'iconsax-reactjs';
import type { DropzoneState } from 'react-dropzone';

import { SoftAvatar } from '@c3theme/ui';

interface DropAreaProps {
  dz: DropzoneState;
  hint: string;
  label?: string;
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

/** Área tracejada que aceita arquivos arrastados ou abre o seletor ao clicar (ou Enter/Espaço). */
export default function DropArea({ dz, hint, label = 'Arraste arquivos aqui ou clique para escolher', children, sx }: DropAreaProps) {
  const { getRootProps, getInputProps, isDragActive } = dz;
  // a recusa só vale enquanto algo está sendo arrastado por cima
  const isDragReject = isDragActive && dz.isDragReject;
  const tone = isDragReject ? 'error' : 'primary';
  return (
    <Box
      {...getRootProps()}
      aria-label={label}
      sx={[
        (theme) => ({
          position: 'relative',
          border: '1.5px dashed',
          borderColor: isDragActive ? `${tone}.main` : 'text.disabled',
          borderRadius: 3,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color .15s, background-color .15s',
          bgcolor: isDragActive ? `rgb(${theme.vars.palette[tone].mainChannel} / 0.08)` : 'transparent',
          '&:hover, &:focus-visible': { borderColor: 'primary.main', bgcolor: `rgb(${theme.vars.palette.primary.mainChannel} / 0.04)` }
        }),
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      <input {...getInputProps()} />
      {children ?? (
        <>
          <SoftAvatar tone={isDragReject ? 'danger' : 'primary'} size="lg" sx={{ mx: 'auto', mb: 1.5 }}>
            <DocumentUpload size={26} />
          </SoftAvatar>
          <Typography variant="subtitle1">
            {isDragReject ? 'Tipo de arquivo não aceito' : isDragActive ? 'Solte para adicionar' : label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        </>
      )}
    </Box>
  );
}
