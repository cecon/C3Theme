// Edição por célula.
import { createContext, useContext, useState } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { CellContext, ColumnDef, getPaginationRowModel } from '@tanstack/react-table';
import { notify, Panel } from '@c3theme/ui';
import { CsvButton, TablePagination, TableView, exportarCsv, meta, useDataTable } from '../../components';
import { Pessoa, PESSOAS } from '../../data';
import { CAMPOS, Editor, ROTULOS, mostrar, validar } from './campos';
import type { Campo } from './campos';

// ---------- Edição por célula ----------

const CelulaCtx = createContext<(id: number, campo: Campo, valor: string | number) => string | undefined>(() => undefined);

function CelulaEditavel({ row, column }: CellContext<Pessoa, unknown>) {
  const salvar = useContext(CelulaCtx);
  const campo = column.id as Campo;
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState<string | number>('');
  const [erro, setErro] = useState<string>();

  const abrir = () => {
    setValor(row.original[campo]);
    setErro(undefined);
    setEditando(true);
  };
  const confirmar = () => {
    const e = salvar(row.original.id, campo, valor);
    if (e) setErro(e);
    else setEditando(false);
  };

  const lista = campo === 'departamento' || campo === 'situacao';

  if (editando) {
    return (
      <Editor
        campo={campo}
        valor={valor}
        erro={erro}
        autoFocus
        onChange={(v) => {
          setValor(v);
          setErro(undefined);
          if (lista) salvar(row.original.id, campo, v);
        }}
        onBlur={lista ? undefined : confirmar}
        onFecharLista={lista ? () => setEditando(false) : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmar();
          if (e.key === 'Escape') setEditando(false);
        }}
      />
    );
  }
  return (
    <Tooltip title="Clique para editar" placement="top-start" enterDelay={600}>
      <Box
        role="button"
        tabIndex={0}
        onClick={abrir}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === 'F2') && abrir()}
        aria-label={`Editar ${ROTULOS[campo]} de ${row.original.nome}`}
        sx={{
          mx: -1,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          cursor: 'text',
          minHeight: 28,
          border: 1,
          borderColor: 'transparent',
          '&:hover, &:focus-visible': { borderColor: 'divider', bgcolor: 'action.hover', outline: 'none' }
        }}
      >
        {mostrar(campo, row.original)}
      </Box>
    </Tooltip>
  );
}

/** Nas listas, a escolha confirma na hora; nos demais, Enter ou sair do campo. */
const COLUNAS_CELULA: ColumnDef<Pessoa>[] = CAMPOS.map((campo) => ({
  accessorKey: campo,
  header: ROTULOS[campo],
  meta: meta({ label: ROTULOS[campo], align: campo === 'idade' || campo === 'salario' ? 'right' : undefined }),
  cell: CelulaEditavel
}));

export function EdicaoPorCelula() {
  const [dados, setDados] = useState(() => PESSOAS.slice(0, 30));
  const table = useDataTable({
    data: dados,
    columns: COLUNAS_CELULA,
    getRowId: (p) => String(p.id),
    getPaginationRowModel: getPaginationRowModel()
  });

  const salvar = (id: number, campo: Campo, valor: string | number) => {
    const atual = dados.find((p) => p.id === id);
    if (!atual) return undefined;
    const novo = { ...atual, [campo]: valor };
    const erro = validar(novo)[campo];
    if (erro) return erro;
    if (atual[campo] !== valor) {
      setDados((antes) => antes.map((p) => (p.id === id ? novo : p)));
      notify(`${ROTULOS[campo]} de ${atual.nome} atualizado.`, 'success');
    }
    return undefined;
  };

  return (
    <CelulaCtx.Provider value={salvar}>
      <Panel
        flush
        title="Edição por célula"
        subtitle="Clique em um valor para editar; Enter salva e Esc cancela"
        action={<CsvButton compacto onExport={() => exportarCsv(table, 'edicao-celula')} />}
      >
        <TableView table={table} minWidth={960} ariaLabel="Tabela com edição por célula" />
        <TablePagination table={table} pageSizes={[5, 10, 20]} jumpTo={false} />
      </Panel>
    </CelulaCtx.Provider>
  );
}
