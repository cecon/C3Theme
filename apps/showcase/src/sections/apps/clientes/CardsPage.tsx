import { MouseEvent, ReactNode, useMemo, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Add, Call, DocumentDownload, Edit, Location, More, SearchNormal1, Sms, Trash } from 'iconsax-reactjs';

import { MessagePage, SoftAvatar, StatusChip } from '@c3theme/ui';
import { Customer, formatPhone, initials, STATUS } from './data';
import { exportCustomers, searchText } from './customerSearch';
import { useCustomers } from './store';
import useCustomerDialogs from './useCustomerDialogs';

const SORTS = {
  nome: { label: 'Nome (A-Z)', fn: (a: Customer, b: Customer) => a.nome.localeCompare(b.nome, 'pt-BR') },
  recentes: { label: 'Mais recentes', fn: (a: Customer, b: Customer) => b.desde.localeCompare(a.desde) },
  gasto: { label: 'Maior gasto', fn: (a: Customer, b: Customer) => b.totalGasto - a.totalGasto },
  idade: { label: 'Idade', fn: (a: Customer, b: Customer) => a.idade - b.idade },
  cidade: { label: 'Cidade', fn: (a: Customer, b: Customer) => a.cidade.localeCompare(b.cidade, 'pt-BR') }
};
type SortKey = keyof typeof SORTS;

const PAGE_SIZE = 9;

function ContactLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <Stack direction="row" sx={{ gap: 1, alignItems: 'center', color: 'text.secondary', minWidth: 0 }}>
      {icon}
      <Typography variant="body2" noWrap>
        {text}
      </Typography>
    </Stack>
  );
}

interface CardProps {
  customer: Customer;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CustomerCard({ customer: c, onView, onEdit, onDelete }: CardProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const status = STATUS[c.status];
  const close = () => setAnchor(null);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, height: 1, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" sx={{ gap: 1.5, p: 2.5, alignItems: 'center' }}>
        <SoftAvatar size="lg" src={c.foto} alt={c.nome} tone={(['primary', 'info', 'success', 'warning'] as const)[c.id % 4]}>
          {initials(c.nome)}
        </SoftAvatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {c.nome}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {c.cargo}
          </Typography>
        </Box>
        <IconButton aria-label={`Ações de ${c.nome}`} onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}>
          <More size={18} style={{ transform: 'rotate(90deg)' }} />
        </IconButton>
        <Menu
          anchorEl={anchor}
          open={!!anchor}
          onClose={close}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem
            onClick={() => {
              close();
              onEdit();
            }}
          >
            <ListItemIcon>
              <Edit size={18} />
            </ListItemIcon>
            Editar
          </MenuItem>
          <MenuItem
            onClick={() => {
              close();
              onDelete();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <Trash size={18} />
            </ListItemIcon>
            Excluir
          </MenuItem>
        </Menu>
      </Stack>
      <Divider />
      <Stack sx={{ p: 2.5, gap: 1.25, flex: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {c.sobre || 'Sem observações.'}
        </Typography>
        <ContactLine icon={<Sms size={16} />} text={c.email} />
        <ContactLine icon={<Call size={16} />} text={formatPhone(c.telefone)} />
        <ContactLine icon={<Location size={16} />} text={`${c.cidade} - ${c.uf}`} />
        <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
          {c.interesses.map((i) => (
            <Chip key={i} label={i} size="small" variant="outlined" />
          ))}
        </Stack>
      </Stack>
      <Divider />
      <Stack direction="row" sx={{ px: 2.5, py: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusChip label={status.label} tone={status.tone} />
        <Button size="small" onClick={onView}>
          Ver detalhes
        </Button>
      </Stack>
    </Paper>
  );
}

export default function ClientesCardsPage() {
  const { customers } = useCustomers();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('nome');
  const [page, setPage] = useState(1);
  const { dialogs, create, edit, view, askDelete } = useCustomerDialogs();

  const list = useMemo(() => {
    const q = search.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    return customers.filter((c) => !q || searchText(c).includes(q)).sort(SORTS[sort].fn);
  }, [customers, search, sort]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <Stack sx={{ gap: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1.5, justifyContent: 'space-between', alignItems: { md: 'center' } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5 }}>
          <TextField
            label="Buscar"
            size="small"
            placeholder="Nome, e-mail, cidade ou CPF"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: { sm: 320 } }}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar clientes' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchNormal1 size={18} />
                  </InputAdornment>
                )
              }
            }}
          />
          <TextField
            select
            size="small"
            label="Ordenar por"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            sx={{ minWidth: 180 }}
          >
            {Object.entries(SORTS).map(([key, s]) => (
              <MenuItem key={key} value={key}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button
            color="secondary"
            variant="outlined"
            startIcon={<DocumentDownload size={18} />}
            onClick={() => exportCustomers(list)}
            disabled={!list.length}
          >
            Exportar CSV
          </Button>
          <Button variant="contained" startIcon={<Add size={18} />} onClick={create}>
            Novo cliente
          </Button>
        </Stack>
      </Stack>

      {visible.length === 0 ? (
        <MessagePage title="Nenhum cliente encontrado" description="Tente outro termo de busca ou cadastre um novo cliente." />
      ) : (
        <Grid container spacing={3}>
          {visible.map((c) => (
            <Grid key={c.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <CustomerCard customer={c} onView={() => view(c)} onEdit={() => edit(c)} onDelete={() => askDelete([c])} />
            </Grid>
          ))}
        </Grid>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {list.length
            ? `Mostrando ${(current - 1) * PAGE_SIZE + 1}–${(current - 1) * PAGE_SIZE + visible.length} de ${list.length}`
            : 'Nenhum resultado'}
        </Typography>
        <Pagination count={pages} page={current} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
      </Stack>
      {dialogs}
    </Stack>
  );
}
