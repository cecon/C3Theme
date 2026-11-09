import { useState } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Add, Edit2, Warning2 } from 'iconsax-reactjs';

import { Panel } from '@c3theme/ui';
import { useEngine, useText } from '../context';
import { evalFormula, parseFormula } from '../formulas.mjs';
import { displayValue, findOption, formatComputed, isNumeric } from '../format';
import { editsInline, INLINE_MAX } from '../formStart';
import { defaults, rowErrors } from '../formValues';
import ChildInlineRows from './ChildInlineRows';
import ChildRowDialog from './ChildRowDialog';
import { RemoveButton } from './RemoveButton';
import type { FieldDef, RelatedDef, Text, WireRecord } from '../types';

export interface ChildRowsProps {
  related: RelatedDef;
  title?: Text;
  rows: WireRecord[];
  onChange: (rows: WireRecord[]) => void;
  /** Erros do formulário inteiro; os desta lista vêm como `{entity}` e `{entity}.{posição}.{campo}`. */
  errors: Record<string, string>;
  editing: boolean;
}

/**
 * Seção `related` com `save: with_parent`: os filhos são editados aqui e só vão para o servidor no Salvar
 * do formulário do pai. Nada nesta seção grava sozinho.
 */
export default function ChildRows({ related, title, rows, onChange, errors, editing }: ChildRowsProps) {
  const { entities } = useEngine();
  const text = useText();
  const intl = useIntl();
  const [open, setOpen] = useState<number | 'new' | null>(null);
  const child = entities[related.entity];
  if (!child) return null;

  const { def } = child;
  const max = related.maxItems ?? 200;
  const fields = def.fields.filter((f) => !f.readOnly && f.name !== related.field);
  const listCols = def.views?.list?.columns?.map((c) => (typeof c === 'string' ? c : c.field));
  const columns = (related.columns ?? listCols ?? fields.slice(0, INLINE_MAX).map((f) => f.name))
    .filter((n) => n !== related.field)
    .map((n) => def.fields.find((f) => f.name === n))
    .filter((f): f is FieldDef => Boolean(f));
  // consulta (CEP) só no diálogo: a linha no lugar não tem espaço para o botão nem para o aviso
  const inline = editsInline(def, related.field);
  const computed = (related.computed ?? []).map((c) => ({ ...c, ast: parseFormula(c.value) }));

  const listError = errors[related.entity];
  const label = (f: FieldDef, v: unknown) => displayValue(f, v, intl.locale, (x) => text(findOption(f, x)?.label, x));

  return (
    <Panel
      title={text(title ?? def.label.plural)}
      subtitle={editing && !inline ? `${rows.length} de ${max}` : undefined}
      flush
      action={
        editing &&
        !inline && (
          <Button size="small" startIcon={<Add />} onClick={() => setOpen('new')} disabled={rows.length >= max}>
            Adicionar
          </Button>
        )
      }
    >
      {listError && (
        <Alert severity="error" sx={{ borderRadius: 0 }}>
          {listError}
        </Alert>
      )}
      {rows.length === 0 && !(inline && editing) ? (
        <Typography color="text.secondary" sx={{ px: 2.5, py: 3 }}>
          {`Nenhum ${text(def.label.singular).toLowerCase()}.`}
        </Typography>
      ) : inline && editing ? (
        <ChildInlineRows def={def} related={related} fields={fields} rows={rows} onChange={onChange} errors={errors} />
      ) : (
        <TableContainer sx={{ maxHeight: 480 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((f) => (
                  <TableCell key={f.name} align={isNumeric(f) ? 'right' : 'left'}>
                    {text(f.label, f.name)}
                  </TableCell>
                ))}
                {computed.map((c, k) => (
                  <TableCell key={`c${k}`} align="right">
                    {text(c.label)}
                  </TableCell>
                ))}
                {editing && <TableCell sx={{ width: 96 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => {
                const errs = Object.values(rowErrors(errors, related.entity, i));
                return (
                  <TableRow key={String(row.id ?? `new-${i}`)} hover={editing} selected={errs.length > 0}>
                    {columns.map((f, c) => (
                      <TableCell
                        key={f.name}
                        align={isNumeric(f) ? 'right' : 'left'}
                        sx={{ fontVariantNumeric: isNumeric(f) ? 'tabular-nums' : undefined }}
                      >
                        {c === 0 && errs.length > 0 && (
                          <Tooltip title={errs.join(' ')}>
                            <Box component="span" sx={{ color: 'error.main', mr: 1, verticalAlign: 'middle' }}>
                              <Warning2 size={16} />
                            </Box>
                          </Tooltip>
                        )}
                        {label(f, row[f.name]) || '—'}
                      </TableCell>
                    ))}
                    {computed.map((c, k) => (
                      <TableCell key={`c${k}`} align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatComputed(evalFormula(c.ast, row), intl.locale, c.currency)}
                      </TableCell>
                    ))}
                    {editing && (
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => setOpen(i)}>
                            <Edit2 size={18} />
                          </IconButton>
                        </Tooltip>
                        <RemoveButton onClick={() => onChange(rows.filter((_, j) => j !== i))} />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {open !== null && (
        <ChildRowDialog
          title={text(def.label.singular)}
          def={def}
          fields={fields}
          row={open === 'new' ? defaults(def) : rows[open]}
          errors={open === 'new' ? {} : rowErrors(errors, related.entity, open)}
          onCancel={() => setOpen(null)}
          onApply={(row) => {
            onChange(open === 'new' ? [...rows, row] : rows.map((r, j) => (j === open ? row : r)));
            setOpen(null);
          }}
        />
      )}
    </Panel>
  );
}
