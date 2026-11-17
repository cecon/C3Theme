import TextField from '@mui/material/TextField';
import type { SidebarSearchDef } from './types';

/** Campo de busca do cabeçalho da lista: Escape limpa; o filtro e o anúncio do resultado ficam com o controlador. */
export default function SidebarSearch({ def, value, onChange }: { def: SidebarSearchDef; value: string; onChange: (q: string) => void }) {
  return (
    <TextField
      type="search"
      size="small"
      fullWidth
      value={value}
      placeholder={def.placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && value) {
          e.preventDefault();
          e.stopPropagation();
          onChange('');
        }
      }}
      slotProps={{ htmlInput: { 'aria-label': def.label } }}
      sx={{ mt: 1 }}
    />
  );
}
