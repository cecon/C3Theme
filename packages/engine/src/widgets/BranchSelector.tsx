import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown2, Shop, TickCircle } from 'iconsax-reactjs';

import { branchLabel, useOrg } from '../context';

/** Acima disso o menu ganha busca: rede de posto pode ter dezenas de filiais. */
const SEARCH_FROM = 8;

/**
 * Filial ativa no header: onde se grava. Agrupada por empresa. Só aparece se o usuário
 * acessa mais de uma filial.
 */
export default function BranchSelector() {
  const org = useOrg();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');
  if (!org || org.context.branches.length < 2) return null;

  const { branch, company } = branchLabel(org, org.active);
  const needle = search.trim().toLowerCase();
  const match = (title: string) => !needle || title.toLowerCase().includes(needle);
  const groups = org.context.companies
    .map((c) => ({
      company: c,
      branches: org.context.branches.filter((b) => b.company === c.id && (match(b.title) || match(c.title)))
    }))
    .filter((g) => g.branches.length > 0);

  const close = () => {
    setAnchor(null);
    setSearch('');
  };

  return (
    <>
      <Button
        color="secondary"
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<Shop size={18} />}
        endIcon={<ArrowDown2 size={14} />}
        aria-label="Filial ativa"
        sx={{ flexShrink: 0, textAlign: 'left', ml: 1 }}
      >
        <Box sx={{ lineHeight: 1.2, maxWidth: 200 }}>
          <Typography variant="subtitle2" noWrap>
            {branch}
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.75 }}>
            {company}
          </Typography>
        </Box>
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        slotProps={{ paper: { sx: { minWidth: 260, maxHeight: 420 } } }}
        // a busca recebe as teclas; o menu não pula para o item que começa com a letra
        disableAutoFocusItem={org.context.branches.length >= SEARCH_FROM}
      >
        {org.context.branches.length >= SEARCH_FROM && (
          <Box sx={{ px: 1.5, pb: 1 }} onKeyDown={(e) => e.stopPropagation()}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="Buscar filial"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
        )}
        {/* o Menu do MUI não aceita Fragment como filho: subtítulo e itens vão numa lista só */}
        {groups.flatMap((g) => [
          ...(org.context.companies.length > 1
            ? [
                <ListSubheader key={`c-${g.company.id}`} sx={{ lineHeight: '32px' }}>
                  {g.company.title}
                </ListSubheader>
              ]
            : []),
          ...g.branches.map((b) => (
            <MenuItem
              key={b.id}
              selected={b.id === org.active}
              onClick={() => {
                close();
                if (b.id !== org.active) org.setActive(b.id);
              }}
              sx={{ gap: 1, justifyContent: 'space-between' }}
            >
              {b.title}
              {b.id === org.active && <TickCircle size={16} variant="Bold" />}
            </MenuItem>
          ))
        ])}
        {groups.length === 0 && <MenuItem disabled>Nenhuma filial encontrada</MenuItem>}
      </Menu>
    </>
  );
}
