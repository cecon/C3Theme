import { useEffect, useState } from 'react';

// material-ui
import Typography from '@mui/material/Typography';

import { Panel } from '@c3theme/ui';
import { DataTable } from '@c3theme/ui/table';
import type { ColumnDef, PaginationState, RowSelectionState, SortingState } from '@c3theme/ui/table';
import { colunasPessoa } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  colunasPessoa.nome,
  colunasPessoa.departamento,
  colunasPessoa.cidade,
  colunasPessoa.salario,
  colunasPessoa.situacao
];

/** Backend de mentira: ordena e pagina com atraso, como uma API faria. */
function buscar(sorting: SortingState, { pageIndex, pageSize }: PaginationState) {
  const [ordem] = sorting;
  const linhas = [...PESSOAS];
  if (ordem) {
    const campo = ordem.id as keyof Pessoa;
    const valor = (p: Pessoa) => p[campo] ?? '';
    linhas.sort((a, b) => (valor(a) > valor(b) ? 1 : valor(a) < valor(b) ? -1 : 0) * (ordem.desc ? -1 : 1));
  }
  const pagina = linhas.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  return new Promise<{ rows: Pessoa[]; total: number }>((ok) => setTimeout(() => ok({ rows: pagina, total: linhas.length }), 400));
}

export default function DadosServidor() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [selecao, setSelecao] = useState<RowSelectionState>({});
  const [dados, setDados] = useState<{ rows: Pessoa[]; total: number }>({ rows: [], total: 0 });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    buscar(sorting, pagination).then((r) => {
      if (!ativo) return;
      setDados(r);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [sorting, pagination]);

  const marcadas = Object.keys(selecao).length;
  return (
    <Panel
      flush
      title="Ordenação e paginação no servidor"
      subtitle="DataTable com server: a tela recebe a ordem e a página, busca e devolve linhas e total. A seleção guarda os ids entre páginas."
    >
      <DataTable
        server
        rows={dados.rows}
        total={dados.total}
        columns={COLUNAS}
        getRowId={(p) => String(p.id)}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowSelection={selecao}
        onRowSelectionChange={setSelecao}
        loading={carregando}
        stickyHeader
        maxHeight={480}
        minWidth={820}
        ariaLabel="Colaboradores (servidor)"
      />
      <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, pb: 2 }}>
        {marcadas ? `${marcadas} marcadas em todas as páginas` : 'Nenhuma linha marcada'}
      </Typography>
    </Panel>
  );
}
