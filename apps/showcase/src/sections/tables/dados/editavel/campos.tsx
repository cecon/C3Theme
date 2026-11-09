// Campos editáveis: tipos, validação, editor e rótulos.
import { KeyboardEvent } from 'react';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { z } from 'zod';
import { SituacaoChip } from '../../components';
import { DEPARTAMENTOS, Pessoa, SITUACOES } from '../../data';
import { formatarMoeda } from '../../format';

export type Campo = 'nome' | 'email' | 'departamento' | 'idade' | 'salario' | 'situacao';
export type Rascunho = Pick<Pessoa, Campo>;
export type Erros = Partial<Record<Campo, string>>;

const esquema = z.object({
  nome: z.string().trim().min(3, 'Mínimo de 3 letras'),
  email: z.email('E-mail inválido'),
  departamento: z.enum(DEPARTAMENTOS as [string, ...string[]]),
  idade: z.number({ error: 'Informe um número' }).int('Use um número inteiro').min(18, 'Mínimo 18').max(75, 'Máximo 75'),
  salario: z.number({ error: 'Informe um valor' }).min(1518, 'Abaixo do salário mínimo').max(100000, 'Acima do teto'),
  situacao: z.enum(SITUACOES as [string, ...string[]])
});

export function validar(dados: Rascunho): Erros {
  const r = esquema.safeParse(dados);
  if (r.success) return {};
  const erros: Erros = {};
  for (const issue of r.error.issues) {
    const campo = issue.path[0] as Campo;
    erros[campo] ??= issue.message;
  }
  return erros;
}

interface EditorProps {
  campo: Campo;
  valor: string | number;
  erro?: string;
  autoFocus?: boolean;
  onChange: (valor: string | number) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onBlur?: () => void;
  /** Lista já aberta (edição por célula); fechar a lista encerra a edição. */
  onFecharLista?: () => void;
}

/** Campo de edição conforme o tipo da coluna: lista, número ou texto. */
export function Editor({ campo, valor, erro, autoFocus, onChange, onKeyDown, onBlur, onFecharLista }: EditorProps) {
  const lista = campo === 'departamento' ? DEPARTAMENTOS : campo === 'situacao' ? SITUACOES : null;
  const numero = campo === 'idade' || campo === 'salario';
  return (
    <TextField
      size="small"
      fullWidth
      select={!!lista}
      type={numero ? 'number' : 'text'}
      value={valor}
      error={!!erro}
      helperText={erro}
      autoFocus={autoFocus}
      onChange={(e) => onChange(numero ? (e.target.value === '' ? Number.NaN : Number(e.target.value)) : e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      slotProps={{
        htmlInput: { 'aria-label': ROTULOS[campo] },
        formHelperText: { sx: { mx: 0 } },
        select: onFecharLista ? { defaultOpen: true, onClose: onFecharLista } : undefined
      }}
      sx={{ minWidth: numero ? 90 : 140, '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
    >
      {lista?.map((o) => (
        <MenuItem key={o} value={o}>
          {o}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function mostrar(campo: Campo, p: Pessoa) {
  if (campo === 'salario') return formatarMoeda(p.salario);
  if (campo === 'situacao') return <SituacaoChip situacao={p.situacao} />;
  return p[campo];
}

export const ROTULOS: Record<Campo, string> = {
  nome: 'Nome',
  email: 'E-mail',
  departamento: 'Departamento',
  idade: 'Idade',
  salario: 'Salário',
  situacao: 'Situação'
};
export const CAMPOS: Campo[] = ['nome', 'email', 'departamento', 'idade', 'salario', 'situacao'];
