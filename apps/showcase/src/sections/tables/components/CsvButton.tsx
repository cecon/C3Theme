// material-ui
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { DocumentDownload } from 'iconsax-reactjs';

import { notify } from '@c3theme/ui';

interface CsvButtonProps {
  /** Gera o arquivo e devolve quantas linhas saíram. */
  onExport: () => number;
  /** Só o ícone (cabeçalho de Panel, toolbar no celular). */
  compacto?: boolean;
}

/** Botão "Exportar CSV": o arquivo é gerado no navegador. */
export default function CsvButton({ onExport, compacto }: CsvButtonProps) {
  const exportar = () => {
    const n = onExport();
    notify(n === 1 ? '1 linha exportada para CSV.' : `${n} linhas exportadas para CSV.`, 'success');
  };
  if (compacto) {
    return (
      <Tooltip title="Exportar CSV">
        <IconButton onClick={exportar} aria-label="Exportar CSV" color="secondary">
          <DocumentDownload size={20} />
        </IconButton>
      </Tooltip>
    );
  }
  return (
    <Button variant="outlined" color="secondary" startIcon={<DocumentDownload size={18} />} onClick={exportar}>
      CSV
    </Button>
  );
}
