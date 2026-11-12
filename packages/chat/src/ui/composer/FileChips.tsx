// material-ui
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

// third-party
import { DocumentText } from 'iconsax-reactjs';

import { useBytesFormat } from '../format';

/** Arquivos anexados na caixa, com tirar. */
export default function FileChips({ files, onRemove }: { files: File[]; onRemove: (file: File) => void }) {
  const bytes = useBytesFormat();
  if (!files.length) return null;
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, px: 0.5, mb: 1 }}>
      {files.map((f) => (
        <Chip
          key={`${f.name}:${f.size}`}
          size="small"
          icon={<DocumentText size={14} />}
          label={`${f.name} · ${bytes(f.size)}`}
          onDelete={() => onRemove(f)}
          variant="outlined"
          sx={{ maxWidth: '100%' }}
        />
      ))}
    </Stack>
  );
}
