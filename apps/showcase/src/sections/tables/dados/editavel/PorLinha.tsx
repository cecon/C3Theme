// Edição por linha.
import { createContext, useContext, useMemo, useState } from 'react';
import Stack from '@mui/material/Stack';
import { CellContext, ColumnDef, getPaginationRowModel } from '@tanstack/react-table';
import { CloseCircle, Edit2, TickCircle } from 'iconsax-reactjs';
import { notify, Panel, SoftIconButton } from '@c3theme/ui';
import { CsvButton, TablePagination, TableView, exportarCsv, meta, useDataTable } from '../../components';
import { Pessoa, PESSOAS, Situacao } from '../../data';
import { CAMPOS, Editor, ROTULOS, mostrar, validar } from './campos';
import type { Campo, Erros, Rascunho } from './campos';

// ---------- Edição por linha ----------

interface LinhaCtxValor {
  rascunhos: Record<number, Rascunho>;
  erros: Record<number, Erros>;
  alterar: (id: number, campo: Campo, valor: string | number) => void;
  editar: (p: Pessoa) => void;
  salvar: (id: number) => void;
  cancelar: (id: number) => void;
}

const LinhaCtx = createContext<LinhaCtxValor | null>(null);

function CampoLinha({ row, column }: CellContext<Pessoa, unknown>) {
  const ctx = useContext(LinhaCtx);
  const campo = column.id as Campo;
  const rascunho = ctx?.rascunhos[row.original.id];
  if (!ctx || !rascunho) return <>{mostrar(campo, row.original)}</>;
  return (
    <Editor
      campo={campo}
      valor={Number.isNaN(rascunho[campo]) ? '' : rascunho[campo]}
      erro={ctx.erros[row.original.id]?.[campo]}
      onChange={(v) => ctx.alterar(row.original.id, campo, v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') ctx.salvar(row.original.id);
        if (e.key === 'Escape') ctx.cancelar(row.original.id);
      }}
    />
  );
}

function AcoesLinha({ row }: CellContext<Pessoa, unknown>) {
  const ctx = useContext(LinhaCtx);
  if (!ctx) return null;
  const id = row.original.id;
  if (ctx.rascunhos[id]) {
    return (
      <Stack direction="row" sx={{ gap: 0.75, justifyContent: 'center' }}>
        <SoftIconButton size="small" tone="success" aria-label="Salvar linha" onClick={() => ctx.salvar(id)}>
          <TickCircle size={16} />
        </SoftIconButton>
        <SoftIconButton size="small" tone="danger" aria-label="Cancelar edição" onClick={() => ctx.cancelar(id)}>
          <CloseCircle size={16} />
        </SoftIconButton>
      </Stack>
    );
  }
  return (
    <Stack direction="row" sx={{ justifyContent: 'center' }}>
      <SoftIconButton size="small" aria-label={`Editar ${row.original.nome}`} onClick={() => ctx.editar(row.original)}>
        <Edit2 size={16} />
      </SoftIconButton>
    </Stack>
  );
}

const COLUNAS_LINHA: ColumnDef<Pessoa>[] = [
  ...CAMPOS.map((campo): ColumnDef<Pessoa> => ({
    accessorKey: campo,
    header: ROTULOS[campo],
    meta: meta({ label: ROTULOS[campo], align: campo === 'idade' || campo === 'salario' ? 'right' : undefined }),
    cell: CampoLinha
  })),
  { id: 'acoes', header: 'Ações', meta: meta({ align: 'center' }), cell: AcoesLinha, size: 110 }
];

export function EdicaoPorLinha() {
  const [dados, setDados] = useState(() => PESSOAS.slice(30, 60));
  const [rascunhos, setRascunhos] = useState<Record<number, Rascunho>>({});
  const [erros, setErros] = useState<Record<number, Erros>>({});
  const table = useDataTable({
    data: dados,
    columns: COLUNAS_LINHA,
    getRowId: (p) => String(p.id),
    getPaginationRowModel: getPaginationRowModel()
  });

  const valor = useMemo<LinhaCtxValor>(() => {
    const sem = <V,>(obj: Record<number, V>, id: number) => {
      const copia = { ...obj };
      delete copia[id];
      return copia;
    };
    return {
      rascunhos,
      erros,
      editar: (p) =>
        setRascunhos((r) => ({
          ...r,
          [p.id]: { nome: p.nome, email: p.email, departamento: p.departamento, idade: p.idade, salario: p.salario, situacao: p.situacao }
        })),
      alterar: (id, campo, v) => {
        setRascunhos((r) => ({ ...r, [id]: { ...r[id], [campo]: v } }));
        setErros((e) => (e[id]?.[campo] ? { ...e, [id]: { ...e[id], [campo]: undefined } } : e));
      },
      salvar: (id) => {
        const rascunho = rascunhos[id];
        if (!rascunho) return;
        const problemas = validar(rascunho);
        if (Object.keys(problemas).length > 0) {
          setErros((e) => ({ ...e, [id]: problemas }));
          notify('Corrija os campos destacados antes de salvar.', 'warning');
          return;
        }
        setDados((antes) =>
          antes.map((p) => (p.id === id ? { ...p, ...rascunho, nome: rascunho.nome.trim(), situacao: rascunho.situacao as Situacao } : p))
        );
        setRascunhos((r) => sem(r, id));
        setErros((e) => sem(e, id));
        notify('Linha salva.', 'success');
      },
      cancelar: (id) => {
        setRascunhos((r) => sem(r, id));
        setErros((e) => sem(e, id));
      }
    };
  }, [rascunhos, erros]);

  const emEdicao = Object.keys(rascunhos).length;

  return (
    <LinhaCtx.Provider value={valor}>
      <Panel
        flush
        title="Edição por linha"
        subtitle={
          emEdicao > 0
            ? `${emEdicao} linha(s) em edição — valide e salve`
            : 'Use o lápis para editar a linha inteira; os campos são validados ao salvar'
        }
        action={<CsvButton compacto onExport={() => exportarCsv(table, 'edicao-linha')} />}
      >
        <TableView table={table} minWidth={1060} ariaLabel="Tabela com edição por linha" />
        <TablePagination table={table} pageSizes={[5, 10, 20]} jumpTo={false} />
      </Panel>
    </LinhaCtx.Provider>
  );
}
