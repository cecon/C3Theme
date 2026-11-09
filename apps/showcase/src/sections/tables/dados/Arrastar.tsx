import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// third-party
import { DragDropContext, DragUpdate, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { ColumnDef, ColumnOrderState, flexRender, getSortedRowModel } from '@tanstack/react-table';
import { HamburgerMenu, Refresh2 } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';
import { colMeta, colunasPessoa, CsvButton, exportarCsv, SortHeader, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  colunasPessoa.nome,
  colunasPessoa.departamento,
  colunasPessoa.cidade,
  colunasPessoa.salario,
  colunasPessoa.situacao
];
const ORDEM_INICIAL = ['nome', 'departamento', 'cidade', 'salario', 'situacao'];

function mover<T>(lista: T[], de: number, para: number) {
  const nova = [...lista];
  const [item] = nova.splice(de, 1);
  nova.splice(para, 0, item);
  return nova;
}

/** Sombra e fundo do item enquanto é arrastado. */
const arrastando = { bgcolor: 'background.paper', boxShadow: 6, display: 'table', tableLayout: 'fixed' } as const;

function LinhasArrastaveis() {
  const [dados, setDados] = useState(() => PESSOAS.slice(0, 8));
  const colunas: ColumnDef<Pessoa>[] = [{ id: 'alca', header: '', size: 52, enableSorting: false }, ...COLUNAS];
  const table = useDataTable({
    data: dados,
    columns: colunas,
    getRowId: (p) => String(p.id),
    enableSorting: false
  });

  const soltar = ({ source, destination }: DropResult) => {
    if (!destination || destination.index === source.index) return;
    setDados((antes) => mover(antes, source.index, destination.index));
    notify(`Linha movida para a posição ${destination.index + 1}.`, 'info');
  };

  return (
    <Panel
      flush
      title="Arrastar linhas"
      subtitle="Segure a alça para mudar a ordem (ou foque a alça e use espaço + setas)"
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" startIcon={<Refresh2 size={16} />} onClick={() => setDados(PESSOAS.slice(0, 8))}>
            Restaurar
          </Button>
          <CsvButton compacto onExport={() => exportarCsv(table, 'linhas-reordenadas')} />
        </Box>
      }
    >
      <TableContainer>
        <DragDropContext onDragEnd={soltar}>
          <Table
            aria-label="Linhas arrastáveis"
            sx={{ tableLayout: 'fixed', minWidth: 760, '& td:last-of-type, & th:last-of-type': { pr: 2.5 } }}
          >
            <TableHead>
              {table.getHeaderGroups().map((g) => (
                <TableRow key={g.id}>
                  {g.headers.map((h) => (
                    <TableCell key={h.id} align={colMeta(h.column).align} sx={{ width: h.getSize() }}>
                      <SortHeader header={h} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <Droppable droppableId="linhas">
              {(drop) => (
                <TableBody ref={drop.innerRef} {...drop.droppableProps}>
                  {table.getRowModel().rows.map((row, index) => (
                    <Draggable key={row.id} draggableId={row.id} index={index}>
                      {(drag, estado) => (
                        <TableRow ref={drag.innerRef} {...drag.draggableProps} sx={estado.isDragging ? arrastando : undefined}>
                          {row.getVisibleCells().map((cell) =>
                            cell.column.id === 'alca' ? (
                              <TableCell key={cell.id} sx={{ width: cell.column.getSize(), pl: 2 }}>
                                <Box
                                  {...drag.dragHandleProps}
                                  aria-label={`Mover ${row.original.nome}`}
                                  sx={{
                                    display: 'inline-flex',
                                    p: 0.5,
                                    borderRadius: 1,
                                    cursor: 'grab',
                                    color: 'text.secondary',
                                    '&:hover': { bgcolor: 'action.hover' }
                                  }}
                                >
                                  <HamburgerMenu size={18} />
                                </Box>
                              </TableCell>
                            ) : (
                              <TableCell
                                key={cell.id}
                                align={colMeta(cell.column).align}
                                sx={{ width: cell.column.getSize(), overflow: 'hidden' }}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      )}
                    </Draggable>
                  ))}
                  {drop.placeholder}
                </TableBody>
              )}
            </Droppable>
          </Table>
        </DragDropContext>
      </TableContainer>
    </Panel>
  );
}

function ColunasArrastaveis() {
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(ORDEM_INICIAL);
  const table = useDataTable({
    data: PESSOAS.slice(8, 16),
    columns: COLUNAS,
    state: { columnOrder },
    onColumnOrderChange: setColumnOrder,
    getSortedRowModel: getSortedRowModel()
  });

  // posição de destino durante o arraste, para desenhar a barra indicadora
  const [alvo, setAlvo] = useState<{ de: number; para: number } | null>(null);

  const atualizar = ({ source, destination }: DragUpdate) => setAlvo(destination ? { de: source.index, para: destination.index } : null);

  const soltar = ({ source, destination }: DropResult) => {
    setAlvo(null);
    if (!destination || destination.index === source.index) return;
    setColumnOrder((antes) => mover(antes, source.index, destination.index));
  };

  return (
    <Panel
      flush
      title="Arrastar colunas"
      subtitle="Arraste o título de uma coluna para outra posição; clique nele para ordenar"
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" startIcon={<Refresh2 size={16} />} onClick={() => setColumnOrder(ORDEM_INICIAL)}>
            Restaurar
          </Button>
          <CsvButton compacto onExport={() => exportarCsv(table, 'colunas-reordenadas')} />
        </Box>
      }
    >
      <TableContainer>
        <Table aria-label="Colunas arrastáveis" sx={{ tableLayout: 'fixed', minWidth: 760, '& td:first-of-type': { pl: 2.5 } }}>
          <DragDropContext onDragUpdate={atualizar} onDragEnd={soltar}>
            <TableHead>
              {table.getHeaderGroups().map((g) => (
                <Droppable key={g.id} droppableId={`cabecalho-${g.id}`} direction="horizontal">
                  {(drop) => (
                    <TableRow ref={drop.innerRef} {...drop.droppableProps}>
                      {g.headers.map((h, index) => (
                        // a célula fica no lugar; quem se move é o conteúdo dela, então a tabela não se desmonta durante o arraste
                        <TableCell
                          key={h.id}
                          sx={(theme) => ({
                            width: h.getSize(),
                            p: 0,
                            ...(alvo &&
                              alvo.para === index &&
                              alvo.de !== index && {
                                boxShadow: `inset ${alvo.para > alvo.de ? -3 : 3}px 0 0 ${theme.vars.palette.primary.main}`
                              })
                          })}
                        >
                          <Draggable draggableId={h.column.id} index={index}>
                            {(drag, estado) => (
                              <Box
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                // só o título arrastado se move; as células ficam paradas e a barra mostra o destino
                                style={estado.isDragging ? drag.draggableProps.style : { ...drag.draggableProps.style, transform: 'none' }}
                                sx={[
                                  {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: colMeta(h.column).align === 'right' ? 'flex-end' : 'flex-start',
                                    gap: 0.75,
                                    px: 2,
                                    py: 2,
                                    ...(index === 0 && { pl: 2.5 }),
                                    cursor: 'grab',
                                    userSelect: 'none',
                                    borderRadius: 1
                                  },
                                  estado.isDragging && {
                                    bgcolor: 'background.paper',
                                    color: 'primary.main',
                                    boxShadow: 6,
                                    cursor: 'grabbing'
                                  }
                                ]}
                              >
                                <HamburgerMenu size={14} />
                                <SortHeader header={h} />
                              </Box>
                            )}
                          </Draggable>
                        </TableCell>
                      ))}
                      <TableCell aria-hidden sx={{ width: 0, p: 0, border: 0, overflow: 'hidden' }}>
                        {drop.placeholder}
                      </TableCell>
                    </TableRow>
                  )}
                </Droppable>
              ))}
            </TableHead>
          </DragDropContext>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} hover>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} align={colMeta(cell.column).align} sx={{ width: cell.column.getSize(), overflow: 'hidden' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Panel>
  );
}

export default function DadosArrastar() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <LinhasArrastaveis />
      </Grid>
      <Grid size={12}>
        <ColunasArrastaveis />
      </Grid>
    </Grid>
  );
}
