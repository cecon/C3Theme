// material-ui
import Typography from '@mui/material/Typography';

// third-party
import { ColumnDef } from '@tanstack/react-table';

import { Pessoa, Situacao } from '../data';
import { formatarData, formatarMoeda } from '../format';
import { PessoaCell, ProgressoCell, SituacaoChip } from './cells';
import { equalsFilter, textFilter } from '@c3theme/ui/table';
import type { ColMeta } from '@c3theme/ui/table';

/** Monta o `meta` de uma coluna com o tipo desta área. */
export const meta = (m: ColMeta): ColMeta => m;

const media = (valor: unknown) => (typeof valor === 'number' ? Math.round(valor) : '');

/** Colunas da base de pessoas, prontas para combinar em cada exemplo. */
export const colunasPessoa = {
  id: {
    accessorKey: 'id',
    header: '#',
    size: 64,
    meta: meta({ label: 'Código', filterVariant: 'range' }),
    enableGrouping: false,
    cell: ({ getValue }) => (
      <Typography variant="body2" color="text.secondary">
        {getValue<number>()}
      </Typography>
    )
  },
  nome: {
    accessorKey: 'nome',
    header: 'Nome',
    size: 260,
    meta: meta({ label: 'Nome' }),
    filterFn: textFilter,
    enableGrouping: false,
    cell: ({ row }) => <PessoaCell id={row.original.id} nome={row.original.nome} email={row.original.email} />,
    footer: ({ table }) => `${table.getFilteredRowModel().rows.length} pessoas`
  },
  nomeSimples: {
    id: 'nomeSimples',
    accessorKey: 'nome',
    header: 'Nome',
    size: 200,
    meta: meta({ label: 'Nome' }),
    filterFn: textFilter,
    enableGrouping: false
  },
  email: {
    accessorKey: 'email',
    header: 'E-mail',
    size: 260,
    meta: meta({ label: 'E-mail' }),
    filterFn: textFilter,
    enableGrouping: false
  },
  cpf: {
    accessorKey: 'cpf',
    header: 'CPF',
    size: 150,
    meta: meta({ label: 'CPF' }),
    filterFn: textFilter,
    enableGrouping: false,
    cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{getValue<string>()}</span>
  },
  telefone: {
    accessorKey: 'telefone',
    header: 'Telefone',
    size: 160,
    meta: meta({ label: 'Telefone' }),
    filterFn: textFilter,
    enableGrouping: false
  },
  cidade: {
    accessorKey: 'cidade',
    header: 'Cidade',
    size: 180,
    meta: meta({ label: 'Cidade' }),
    filterFn: textFilter,
    cell: ({ row }) => <span style={{ whiteSpace: 'nowrap' }}>{`${row.original.cidade} – ${row.original.uf}`}</span>
  },
  uf: { accessorKey: 'uf', header: 'UF', size: 80, meta: meta({ label: 'UF', filterVariant: 'select' }), filterFn: equalsFilter },
  departamento: {
    accessorKey: 'departamento',
    header: 'Departamento',
    size: 160,
    meta: meta({ label: 'Departamento', filterVariant: 'select' }),
    filterFn: equalsFilter
  },
  cargo: { accessorKey: 'cargo', header: 'Cargo', size: 200, meta: meta({ label: 'Cargo' }), filterFn: textFilter },
  idade: {
    accessorKey: 'idade',
    header: 'Idade',
    size: 90,
    meta: meta({ label: 'Idade', filterVariant: 'range', align: 'right' }),
    filterFn: 'inNumberRange',
    aggregationFn: 'mean',
    aggregatedCell: ({ getValue }) => `média ${media(getValue())}`
  },
  salario: {
    accessorKey: 'salario',
    header: 'Salário',
    size: 130,
    meta: meta({ label: 'Salário', filterVariant: 'range', align: 'right' }),
    filterFn: 'inNumberRange',
    aggregationFn: 'sum',
    cell: ({ getValue }) => formatarMoeda(getValue<number>()),
    aggregatedCell: ({ getValue }) => <strong>{formatarMoeda(Number(getValue()))}</strong>,
    footer: ({ table }) => formatarMoeda(table.getFilteredRowModel().rows.reduce((acc, r) => acc + r.original.salario, 0))
  },
  situacao: {
    accessorKey: 'situacao',
    header: 'Situação',
    size: 130,
    meta: meta({ label: 'Situação', filterVariant: 'select' }),
    filterFn: equalsFilter,
    cell: ({ getValue }) => <SituacaoChip situacao={getValue<Situacao>()} />
  },
  admissao: {
    accessorKey: 'admissao',
    header: 'Admissão',
    size: 120,
    meta: meta({ label: 'Admissão', csv: (v) => formatarData(String(v)) }),
    enableColumnFilter: false,
    enableGrouping: false,
    cell: ({ getValue }) => formatarData(getValue<string>())
  },
  progresso: {
    accessorKey: 'progresso',
    header: 'Meta',
    size: 150,
    meta: meta({ label: 'Meta do trimestre', filterVariant: 'range' }),
    filterFn: 'inNumberRange',
    aggregationFn: 'mean',
    enableGrouping: false,
    cell: ({ getValue }) => <ProgressoCell valor={getValue<number>()} />,
    aggregatedCell: ({ getValue }) => <ProgressoCell valor={Math.round(Number(getValue()))} />
  }
} satisfies Record<string, ColumnDef<Pessoa>>;

/** Conjunto padrão usado na maioria dos exemplos. */
export const COLUNAS_PADRAO: ColumnDef<Pessoa>[] = [
  colunasPessoa.nome,
  colunasPessoa.departamento,
  colunasPessoa.cargo,
  colunasPessoa.cidade,
  colunasPessoa.idade,
  colunasPessoa.salario,
  colunasPessoa.situacao,
  colunasPessoa.admissao
];
