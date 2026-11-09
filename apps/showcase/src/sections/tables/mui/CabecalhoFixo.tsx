import { useMemo, useState } from 'react';

// material-ui
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';

import { Panel, tableEdgesSx } from '@c3theme/ui';
import { CsvButton, SituacaoChip } from '../components';
import { Pessoa, PESSOAS } from '../data';
import { baixarCsv, formatarData, formatarMoeda } from '../format';
import MuiSortHead, { ColunaMui, proximaOrdem } from './MuiSortHead';
import { ordenar, Sentido } from './shared';

const COLUNAS: ColunaMui<Pessoa>[] = [
  { chave: 'id', rotulo: '#' },
  { chave: 'nome', rotulo: 'Nome' },
  { chave: 'cpf', rotulo: 'CPF' },
  { chave: 'telefone', rotulo: 'Telefone' },
  { chave: 'cidade', rotulo: 'Cidade' },
  { chave: 'admissao', rotulo: 'Admissão' },
  { chave: 'salario', rotulo: 'Salário', align: 'right' },
  { chave: 'situacao', rotulo: 'Situação' }
];

export default function MuiCabecalhoFixo() {
  const [ordem, setOrdem] = useState<{ chave: keyof Pessoa & string; sentido: Sentido }>({ chave: 'id', sentido: 'asc' });
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(25);
  const ordenadas = useMemo(() => ordenar(PESSOAS, ordem.chave, ordem.sentido), [ordem]);
  const visiveis = ordenadas.slice(pagina * porPagina, pagina * porPagina + porPagina);

  const exportar = () => {
    baixarCsv(
      'cabecalho-fixo',
      COLUNAS.map((c) => c.rotulo),
      ordenadas.map((p) => [p.id, p.nome, p.cpf, p.telefone, `${p.cidade} - ${p.uf}`, formatarData(p.admissao), p.salario, p.situacao])
    );
    return ordenadas.length;
  };

  return (
    <Panel
      flush
      title="Cabeçalho fixo"
      subtitle="Role a tabela: os títulos das colunas ficam visíveis"
      action={<CsvButton compacto onExport={exportar} />}
    >
      {/* stickyHeader do MUI + altura máxima no contêiner */}
      <TableContainer sx={{ maxHeight: 460 }}>
        <Table stickyHeader aria-label="Tabela com cabeçalho fixo" sx={[{ minWidth: 960 }, tableEdgesSx()]}>
          <MuiSortHead colunas={COLUNAS} ordem={ordem} onOrdenar={(chave) => setOrdem((o) => proximaOrdem(o, chave))} />
          <TableBody>
            {visiveis.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ color: 'text.secondary' }}>{p.id}</TableCell>
                <TableCell>{p.nome}</TableCell>
                <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{p.cpf}</TableCell>
                <TableCell>{p.telefone}</TableCell>
                <TableCell>
                  {p.cidade} – {p.uf}
                </TableCell>
                <TableCell>{formatarData(p.admissao)}</TableCell>
                <TableCell align="right">{formatarMoeda(p.salario)}</TableCell>
                <TableCell>
                  <SituacaoChip situacao={p.situacao} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={ordenadas.length}
        page={pagina}
        rowsPerPage={porPagina}
        rowsPerPageOptions={[25, 50, 100]}
        onPageChange={(_, p) => setPagina(p)}
        onRowsPerPageChange={(e) => {
          setPorPagina(Number(e.target.value));
          setPagina(0);
        }}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />
    </Panel>
  );
}
