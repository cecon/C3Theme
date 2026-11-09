// material-ui
import Grid from '@mui/material/Grid';

// third-party
import { ColumnDef } from '@tanstack/react-table';

import { Panel } from '@c3theme/ui';
import { colunasPessoa, CsvButton, TableView, exportarCsv, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  colunasPessoa.nome,
  colunasPessoa.departamento,
  colunasPessoa.cidade,
  colunasPessoa.salario,
  colunasPessoa.situacao
];
const COLUNAS_RODAPE: ColumnDef<Pessoa>[] = [
  { ...colunasPessoa.nome, footer: 'Total' },
  colunasPessoa.cargo,
  {
    ...colunasPessoa.idade,
    footer: ({ table }) =>
      `média ${Math.round(table.getRowModel().rows.reduce((a, r) => a + r.original.idade, 0) / Math.max(1, table.getRowModel().rows.length))}`
  },
  colunasPessoa.salario
];

function Exemplo({
  titulo,
  subtitulo,
  dados,
  colunas,
  striped,
  footer,
  arquivo
}: {
  titulo: string;
  subtitulo: string;
  dados: Pessoa[];
  colunas: ColumnDef<Pessoa>[];
  striped?: boolean;
  footer?: boolean;
  arquivo: string;
}) {
  const table = useDataTable({ data: dados, columns: colunas, enableSorting: false });
  return (
    <Panel flush title={titulo} subtitle={subtitulo} action={<CsvButton compacto onExport={() => exportarCsv(table, arquivo)} />}>
      <TableView table={table} striped={striped} showFooter={footer} minWidth={720} ariaLabel={titulo} />
    </Panel>
  );
}

export default function DadosBasica() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Exemplo
          titulo="Tabela básica"
          subtitulo="Colunas definidas uma vez e renderizadas pelo componente comum"
          dados={PESSOAS.slice(0, 6)}
          colunas={COLUNAS}
          arquivo="basica"
        />
      </Grid>
      <Grid size={12}>
        <Exemplo
          titulo="Linhas zebradas"
          subtitulo="Fundo alternado para facilitar a leitura"
          dados={PESSOAS.slice(6, 12)}
          colunas={COLUNAS}
          striped
          arquivo="zebrada"
        />
      </Grid>
      <Grid size={12}>
        <Exemplo
          titulo="Com rodapé"
          subtitulo="Totais calculados a partir das linhas"
          dados={PESSOAS.slice(12, 18)}
          colunas={COLUNAS_RODAPE}
          footer
          arquivo="com-rodape"
        />
      </Grid>
    </Grid>
  );
}
