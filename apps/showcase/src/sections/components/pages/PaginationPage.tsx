import { useState } from 'react';

// material-ui
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowLeft, ArrowRight } from 'iconsax-reactjs';

import { ScrollX } from '@c3theme/ui';
import { CITIES, integer } from '../data';
import Example, { ExamplePage } from '../Example';

const COLORS = ['primary', 'secondary', 'standard'] as const;

const PrevIcon = () => <ArrowLeft size={16} />;
const NextIcon = () => <ArrowRight size={16} />;

function ControlledDemo() {
  const [page, setPage] = useState(1);
  const perPage = 4;
  const total = Math.ceil(CITIES.length / perPage);
  const slice = CITIES.slice((page - 1) * perPage, page * perPage);
  return (
    <Stack spacing={2}>
      <List dense sx={{ border: 1, borderColor: 'divider', borderRadius: 2, minHeight: 4 * 48 }}>
        {slice.map((c) => (
          <ListItem key={c.name}>
            <ListItemText primary={`${c.name} – ${c.uf}`} secondary={`${integer.format(c.population)} habitantes`} />
          </ListItem>
        ))}
      </List>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Página {page} de {total}
        </Typography>
        <Pagination count={total} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
      </Stack>
    </Stack>
  );
}

function TableDemo() {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(5);
  const visible = CITIES.slice(page * rows, page * rows + rows);
  return (
    <>
      <ScrollX>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cidade</TableCell>
              <TableCell>UF</TableCell>
              <TableCell>Região</TableCell>
              <TableCell align="right">População</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((c) => (
              <TableRow key={c.name} hover>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.uf}</TableCell>
                <TableCell>{c.region}</TableCell>
                <TableCell align="right">{integer.format(c.population)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollX>
      <TablePagination
        component="div"
        count={CITIES.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rows}
        onRowsPerPageChange={(e) => {
          setRows(Number(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
}

export default function PaginationPage() {
  return (
    <ExamplePage intro="A paginação divide listas longas em páginas. Em tabelas, use TablePagination, que já vem traduzida pelo tema.">
      <Example
        title="Básica"
        code={`<Pagination count={10} />
<Pagination count={10} color="primary" />
<Pagination count={10} disabled />`}
      >
        <Stack spacing={2}>
          <Pagination count={10} />
          {COLORS.slice(0, 2).map((c) => (
            <Pagination key={c} count={10} color={c} />
          ))}
          <Pagination count={10} disabled />
        </Stack>
      </Example>

      <Example title="Contornada" code={`<Pagination count={10} variant="outlined" color="primary" />`}>
        <Stack spacing={2}>
          {COLORS.map((c) => (
            <Pagination key={c} count={10} variant="outlined" color={c} defaultPage={3} />
          ))}
        </Stack>
      </Example>

      <Example
        title="Formatos"
        code={`<Pagination count={10} shape="rounded" />
<Pagination count={10} shape="circular" variant="outlined" />`}
      >
        <Stack spacing={2}>
          <Pagination count={10} shape="rounded" color="primary" />
          <Pagination count={10} shape="rounded" variant="outlined" />
          <Pagination count={10} shape="circular" variant="outlined" color="primary" />
        </Stack>
      </Example>

      <Example
        title="Tamanhos"
        code={`<Pagination count={10} size="small" />
<Pagination count={10} size="large" />`}
      >
        <Stack spacing={2}>
          <Pagination count={10} size="small" color="primary" />
          <Pagination count={10} color="primary" />
          <Pagination count={10} size="large" color="primary" />
        </Stack>
      </Example>

      <Example
        title="Botões"
        description="Primeira/última página e ícones próprios."
        code={`<Pagination count={10} showFirstButton showLastButton />
<Pagination count={10} hidePrevButton hideNextButton />
<Pagination renderItem={(item) => <PaginationItem slots={{ previous: ArrowLeft, next: ArrowRight }} {...item} />} />`}
      >
        <Stack spacing={2}>
          <Pagination count={10} showFirstButton showLastButton color="primary" />
          <Pagination count={10} hidePrevButton hideNextButton />
          <Pagination count={10} renderItem={(item) => <PaginationItem slots={{ previous: PrevIcon, next: NextIcon }} {...item} />} />
        </Stack>
      </Example>

      <Example
        title="Faixas"
        description="Quantas páginas ficam visíveis em volta da atual e nas pontas."
        code={`<Pagination count={11} defaultPage={6} siblingCount={0} />
<Pagination count={11} defaultPage={6} boundaryCount={2} />`}
      >
        <Stack spacing={2}>
          <Pagination count={11} defaultPage={6} siblingCount={0} />
          <Pagination count={11} defaultPage={6} />
          <Pagination count={11} defaultPage={6} siblingCount={0} boundaryCount={2} />
          <Pagination count={11} defaultPage={6} boundaryCount={2} />
        </Stack>
      </Example>

      <Example title="Controlada com conteúdo" code={`<Pagination count={total} page={pagina} onChange={(_, p) => setPagina(p)} />`}>
        <ControlledDemo />
      </Example>

      <Example
        title="Em tabelas"
        description="TablePagination com linhas por página."
        code={`<TablePagination component="div" count={total} page={pagina} onPageChange={...}
  rowsPerPage={linhas} onRowsPerPageChange={...} rowsPerPageOptions={[5, 10, 25]} />`}
      >
        <TableDemo />
      </Example>
    </ExamplePage>
  );
}
