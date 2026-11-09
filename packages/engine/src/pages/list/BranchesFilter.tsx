import { useState } from 'react';

// material-ui
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// third-party
import { Shop } from 'iconsax-reactjs';

import { branchLabel, OrgState } from '../../context';

/**
 * Filiais em exibição (só leitura). Sem escolha explícita, vale a filial ativa; a URL guarda a
 * escolha (`branches=1,2`), então o link compartilhado abre igual.
 */
export default function BranchesFilter({
  org,
  selected,
  explicit,
  onChange
}: {
  org: OrgState;
  selected: string[];
  explicit: boolean;
  onChange: (ids: string[] | undefined) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (org.context.branches.length < 2) return null;
  const first = branchLabel(org, selected[0] ?? org.active).branch;
  const label =
    selected.length === org.context.branches.length
      ? 'Filiais: todas'
      : `Filial: ${first}${selected.length > 1 ? ` +${selected.length - 1}` : ''}`;
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    if (next.length === 0) return; // sempre ao menos uma
    // a ordem do contexto (empresa, filial) deixa a URL estável
    onChange(org.context.branches.map((b) => b.id).filter((x) => next.includes(x)));
  };
  return (
    <>
      <Chip
        icon={<Shop size={16} />}
        label={label}
        color={explicit ? 'primary' : 'default'}
        variant={explicit ? 'filled' : 'outlined'}
        onClick={(e) => setAnchor(e.currentTarget)}
      />
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {org.context.branches.map((b) => (
          <MenuItem key={b.id} dense onClick={() => toggle(b.id)}>
            <Checkbox size="small" checked={selected.includes(b.id)} sx={{ p: 0.5, mr: 1 }} />
            <ListItemText primary={b.title} secondary={branchLabel(org, b.id).company} />
          </MenuItem>
        ))}
        <MenuItem dense onClick={() => onChange(org.context.branches.map((b) => b.id))}>
          <ListItemText primary="Todas as filiais" />
        </MenuItem>
        <MenuItem
          dense
          disabled={!explicit}
          onClick={() => {
            setAnchor(null);
            onChange(undefined);
          }}
        >
          <ListItemText primary="Só a filial ativa" />
        </MenuItem>
      </Menu>
    </>
  );
}
