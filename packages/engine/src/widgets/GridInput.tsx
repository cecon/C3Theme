import { KeyboardEvent, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Add, SearchNormal1, Trash } from 'iconsax-reactjs';

import { useText } from '../context';
import { displayValue, findOption, isNumeric } from '../format';
import FieldInput from './FieldInput';
import { matchingRows, nextRow } from '../hooks/gridFind';
import type { GridFieldDef } from '../actionTypes';
import type useActionInput from '../hooks/useActionInput';

/** Com mais linhas que isso, a grade ganha busca. */
const SEARCH_FROM = 10;

/**
 * Grade no input da ação (`type: grid`): uma linha por item (forma de pagamento, produto). Coluna `readOnly` aparece
 * como texto; as outras são editáveis. Erro de célula vem em `<grade>.<linha>.<coluna>`, como no 422 do backend.
 * Como numa planilha, Enter numa célula vai para a mesma coluna da próxima linha (Shift+Enter, da anterior) e nunca
 * confirma a ação. Grade grande ganha busca, que só esconde linhas: o que vai ao servidor é a grade inteira.
 */
export default function GridInput({
  grid,
  form,
  error
}: {
  grid: GridFieldDef;
  form: ReturnType<typeof useActionInput>;
  error: (name: string) => string | undefined;
}) {
  const text = useText();
  const intl = useIntl();
  const rows = form.rowsOf(grid.name);
  const label = text(grid.label, grid.name);
  const own = error(grid.name);
  // linha nova só faz sentido quando o usuário preenche tudo; coluna readOnly vem do sistema (prefill)
  const canAdd = !grid.fields.some((f) => f.readOnly) && rows.length < (grid.maxItems ?? 200);
  const [query, setQuery] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const shown = (f: GridFieldDef['fields'][number], v: unknown) => displayValue(f, v, intl.locale, (x) => text(findOption(f, x)?.label, x));
  const visible = matchingRows(rows.length, (i) => grid.fields.map((f) => shown(f, rows[i][f.name])), query);
  const editable = grid.fields.find((f) => !f.readOnly)?.name;

  const focusCell = (row: number | undefined, col: string | undefined) => {
    const input = row === undefined ? null : box.current?.querySelector<HTMLInputElement>(`[data-cell="${row}:${col}"] input`);
    input?.focus();
    input?.select();
  };
  // Enter numa célula desce (Shift+Enter sobe) em vez de confirmar o diálogo, que é um formulário
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const cell = e.target instanceof HTMLInputElement ? e.target.closest<HTMLElement>('[data-cell]') : null;
    if (e.key !== 'Enter' || !cell) return;
    e.preventDefault();
    const [row, col] = cell.dataset.cell!.split(':');
    focusCell(nextRow(visible, Number(row), e.shiftKey), col);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" component="h3">
        {label}
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {visible.length < rows.length && `${visible.length} de `}
          {rows.length} {rows.length === 1 ? 'linha' : 'linhas'}
        </Typography>
      </Typography>
      {grid.help && <FormHelperText sx={{ mt: 0 }}>{text(grid.help)}</FormHelperText>}
      {rows.length > SEARCH_FROM && (
        <TextField
          size="small"
          placeholder="Buscar na grade"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Enter na busca vai para a primeira linha achada, sem confirmar a ação
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            focusCell(visible[0], editable);
          }}
          slotProps={{
            input: { startAdornment: <SearchNormal1 size={16} style={{ marginRight: 8 }} /> },
            htmlInput: { 'aria-label': `Buscar em ${label}` }
          }}
          sx={{ maxWidth: 360 }}
        />
      )}
      <TableContainer
        ref={box}
        onKeyDown={onKey}
        sx={{ maxHeight: 'max(420px, calc(100vh - 300px))', border: 1, borderColor: 'divider', borderRadius: 1 }}
      >
        <Table size="small" stickyHeader aria-label={label}>
          <TableHead>
            <TableRow>
              {grid.fields.map((f) => (
                <TableCell key={f.name} align={isNumeric(f) ? 'right' : 'left'}>
                  {text(f.label, f.name)}
                  {f.required && !f.readOnly && ' *'}
                </TableCell>
              ))}
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((i) => {
              const row = rows[i];
              return (
                // linhas não reordenam nem ganham id: a posição é a chave, como no erro do backend
                <TableRow key={i}>
                  {grid.fields.map((f) => {
                    const key = `${grid.name}.${i}.${f.name}`;
                    const numeric = isNumeric(f);
                    return (
                      <TableCell
                        key={f.name}
                        data-cell={`${i}:${f.name}`}
                        align={numeric ? 'right' : 'left'}
                        sx={{
                          verticalAlign: 'top',
                          py: 0.75,
                          minWidth: f.readOnly ? 0 : 140,
                          width: numeric && !f.readOnly ? 200 : undefined
                        }}
                      >
                        {f.readOnly ? (
                          <Typography variant="body2" sx={{ pt: 1.5 }}>
                            {shown(f, row[f.name]) || '—'}
                          </Typography>
                        ) : (
                          <FieldInput
                            field={{ ...f, label: '', help: undefined }}
                            value={row[f.name]}
                            onChange={(v) => form.changeCell(grid.name, i, f.name, v)}
                            error={error(key)}
                            required={f.required}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell padding="checkbox" sx={{ verticalAlign: 'top', py: 0.75 }}>
                    <IconButton
                      size="small"
                      aria-label={`Tirar a linha ${i + 1}`}
                      onClick={() => form.removeRow(grid.name, i)}
                      sx={{ mt: 0.75 }}
                    >
                      <Trash size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={grid.fields.length + 1}>
                  <Typography variant="body2" color="text.secondary">
                    {rows.length === 0 ? 'Nenhuma linha.' : 'Nenhuma linha com essa busca.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {canAdd && (
        <Button size="small" startIcon={<Add size={16} />} onClick={() => form.addRow(grid.name)} sx={{ alignSelf: 'flex-start' }}>
          Adicionar linha
        </Button>
      )}
      {own && <FormHelperText error>{own}</FormHelperText>}
    </Stack>
  );
}
