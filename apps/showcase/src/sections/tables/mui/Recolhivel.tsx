import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { Panel, StatusChip } from '@c3theme/ui';
import { ExpandButton, PessoaCell } from '../components';
import { Pessoa, pedidosDe, PESSOAS, TONS_PEDIDO } from '../data';
import { formatarData, formatarMoeda } from '../format';

function LinhaCliente({ pessoa }: { pessoa: Pessoa }) {
  const [aberta, setAberta] = useState(false);
  const pedidos = pedidosDe(pessoa.id);
  const total = pedidos.filter((p) => p.situacao !== 'Cancelado').reduce((acc, p) => acc + p.quantidade * p.valorUnitario, 0);

  return (
    <>
      <TableRow hover sx={{ '& > td': { borderBottom: aberta ? 0 : undefined } }}>
        <TableCell sx={{ width: 56, pl: 1.5 }}>
          <ExpandButton
            open={aberta}
            onClick={() => setAberta((v) => !v)}
            label={aberta ? `Recolher pedidos de ${pessoa.nome}` : `Ver pedidos de ${pessoa.nome}`}
          />
        </TableCell>
        <TableCell>
          <PessoaCell id={pessoa.id} nome={pessoa.nome} email={pessoa.email} />
        </TableCell>
        <TableCell>
          {pessoa.cidade} – {pessoa.uf}
        </TableCell>
        <TableCell align="right">{pedidos.length}</TableCell>
        <TableCell align="right" sx={{ pr: 2.5 }}>
          {formatarMoeda(total)}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, ...(aberta ? {} : { borderBottom: 0 }) }}>
          <Collapse in={aberta} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: { xs: 0, sm: 6 } }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Histórico de pedidos
              </Typography>
              <Table size="small" aria-label={`Pedidos de ${pessoa.nome}`}>
                <TableHead>
                  <TableRow>
                    <TableCell>Pedido</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Produto</TableCell>
                    <TableCell align="right">Qtd.</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Situação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedidos.map((p) => (
                    <TableRow key={p.numero}>
                      <TableCell>{p.numero}</TableCell>
                      <TableCell>{formatarData(p.data)}</TableCell>
                      <TableCell>{p.produto}</TableCell>
                      <TableCell align="right">{p.quantidade}</TableCell>
                      <TableCell align="right">{formatarMoeda(p.quantidade * p.valorUnitario)}</TableCell>
                      <TableCell>
                        <StatusChip label={p.situacao} tone={TONS_PEDIDO[p.situacao]} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function MuiRecolhivel() {
  return (
    <Panel flush title="Clientes e pedidos" subtitle="Clique na seta para ver os pedidos de cada cliente">
      <TableContainer>
        <Table aria-label="Tabela com linhas recolhíveis" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 1.5 }} />
              <TableCell>Cliente</TableCell>
              <TableCell>Cidade</TableCell>
              <TableCell align="right">Pedidos</TableCell>
              <TableCell align="right" sx={{ pr: 2.5 }}>
                Total comprado
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PESSOAS.slice(0, 10).map((p) => (
              <LinhaCliente key={p.id} pessoa={p} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Panel>
  );
}
