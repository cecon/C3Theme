import { useEffect, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { FormSkeleton, PanelSkeleton, StatusChip, TableSkeletonRows } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

const ROWS = [
  { name: 'Posto Alfa Centro', city: 'Curitiba', status: 'Ativo', total: '18.420,00' },
  { name: 'Auto Posto Beta', city: 'Londrina', status: 'Em análise', total: '9.310,50' },
  { name: 'Rede Gama', city: 'Maringá', status: 'Ativo', total: '27.004,90' }
];

/** Liga `loading` por `ms` a cada clique, como uma busca na rede. */
function useFakeLoad(ms: number) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [loading, ms]);
  return [loading, () => setLoading(true)] as const;
}

function TableDemo() {
  const [loading, reload] = useFakeLoad(1500);
  return (
    <Stack spacing={2}>
      <Table size="small" aria-busy={loading || undefined}>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Cidade</TableCell>
            <TableCell>Situação</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableSkeletonRows rows={3} columns={['text', 'text', 'chip', 'number']} />
          ) : (
            ROWS.map((r) => (
              <TableRow key={r.name}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.city}</TableCell>
                <TableCell>
                  <StatusChip tone={r.status === 'Ativo' ? 'success' : 'warning'} label={r.status} />
                </TableCell>
                <TableCell align="right">{r.total}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Button sx={{ alignSelf: 'flex-start' }} onClick={reload} disabled={loading}>
        Recarregar
      </Button>
    </Stack>
  );
}

export default function SkeletonPage() {
  return (
    <ExamplePage
      intro={
        <Typography color="text.secondary">
          Placeholders com o formato do conteúdo que vai chegar, no lugar de um spinner. Só aparecem depois de 200 ms (carregamento rápido
          não pisca), ficam parados com "reduzir movimento" ligado no sistema e avisam o leitor de tela com "Carregando…".
        </Typography>
      }
    >
      <Example
        title="Linhas de tabela (TableSkeletonRows)"
        description="O cabeçalho real fica na tela; cada coluna tem o formato do valor: texto, chip ou número à direita."
        code={`<TableBody>
  {loading ? <TableSkeletonRows rows={3} columns={['text', 'text', 'chip', 'number']} /> : linhas}
</TableBody>`}
        wide
      >
        <TableDemo />
      </Example>

      <Example
        title="Formulário (FormSkeleton)"
        description="Seções, campos por linha e abas. O motor monta os blocos sozinho a partir da spec."
        code={`<FormSkeleton blocks={[
  { title: true, lines: [1, 2, 2] },
  { tabs: 2 },
  { title: true, lines: [2, 1] },
  { title: true, table: 3 }
]} />`}
        wide
      >
        <FormSkeleton
          delay={0}
          blocks={[{ title: true, lines: [1, 2, 2] }, { tabs: 2 }, { title: true, lines: [2, 1] }, { title: true, table: 3 }]}
        />
      </Example>

      <Example
        title="Painel (PanelSkeleton)"
        description="Card de painel ou seção personalizada: linhas de texto ou um bloco do tamanho do gráfico."
        code={`<PanelSkeleton lines={3} />
<PanelSkeleton height={180} />`}
      >
        <Stack spacing={2.5}>
          <PanelSkeleton delay={0} lines={3} />
          <PanelSkeleton delay={0} height={180} />
        </Stack>
      </Example>
    </ExamplePage>
  );
}
