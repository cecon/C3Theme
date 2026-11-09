import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Typography from '@mui/material/Typography';

import { Panel } from '@c3theme/ui';
import { DataTable, type RowSelectionState } from '@c3theme/ui/table';
import { COLUNAS, FATURAS, type Fatura } from './dados';

function Tabela(props: {
  dense?: boolean;
  striped?: boolean;
  bordered?: boolean;
  showFilters?: boolean;
  loading?: boolean;
  vazia?: boolean;
}) {
  const { vazia, ...view } = props;
  return (
    <Panel flush title="Faturas">
      <DataTable<Fatura> rows={vazia ? [] : FATURAS} columns={COLUNAS} getRowId={(f) => f.id} ariaLabel="Faturas" {...view} />
    </Panel>
  );
}

/**
 * Uso direto: tabela para tela feita em código. Num sistema C3 a lista vem da spec (veja "Tabela/Lista pelo motor"),
 * que o motor desenha com a tabela dele. Ordena e pagina na tela; com `server`, quem ordena e pagina é o backend. A
 * variação compacta e listrada ainda não existe na spec.
 */
const meta = {
  title: 'Tabela/DataTable (uso direto)',
  tags: ['uso-direto'],
  component: Tabela,
  args: { dense: false, striped: false, bordered: false, showFilters: false, loading: false, vazia: false }
} satisfies Meta<typeof Tabela>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basica: Story = { name: 'Básica' };

export const Compacta: Story = { args: { dense: true, striped: true } };

export const ComFiltros: Story = { name: 'Com filtros por coluna', args: { showFilters: true } };

export const Carregando: Story = { args: { loading: true } };

export const Vazia: Story = { args: { vazia: true } };

export const ComSelecao: Story = {
  name: 'Com seleção',
  render: function Render() {
    const [selection, setSelection] = useState<RowSelectionState>({ 'FT-0002': true });
    const count = Object.keys(selection).length;
    return (
      <Panel flush title="Faturas" action={<Typography variant="body2">{count} marcadas</Typography>}>
        <DataTable<Fatura>
          rows={FATURAS}
          columns={COLUNAS}
          getRowId={(f) => f.id}
          rowSelection={selection}
          onRowSelectionChange={setSelection}
          onRowClick={fn()}
          ariaLabel="Faturas"
        />
      </Panel>
    );
  }
};
