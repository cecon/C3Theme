// Célula editável da lista (`columns[].edit`): o campo do formulário sem rótulo, na própria linha. Linha que não
// deixa alterar o campo (permissão, readOnlyWhen) mostra o valor como as outras colunas.
import Box from '@mui/material/Box';
import { visuallyHidden } from '@c3theme/ui';

import FieldInput from '../../widgets/FieldInput';
import type { FieldDef, WireRecord } from '../../types';
import type { InlineEdit } from './useInlineEdit';

export function EditCell({
  entity,
  field,
  row,
  mode,
  edit,
  readView,
  onEnter
}: {
  entity: string;
  field: FieldDef;
  row: WireRecord;
  mode: 'instant' | 'batch';
  edit: InlineEdit;
  readView: React.ReactNode;
  /** Enter no campo: grava (no `instant`) e chama isto, para descer de linha. */
  onEnter?: () => void;
}) {
  if (edit.locked(row, field)) return <>{readView}</>;
  return (
    // o clique no campo não abre o registro
    <Box
      // o rótulo fica para o leitor de tela; o título da coluna já diz o que é
      sx={{ '& .MuiInputLabel-root, & .MuiFormControlLabel-label': visuallyHidden, '& legend': { display: 'none' } }}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => edit.commit(row, field)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        // dentro do formulário do pai, o Enter não envia nada
        e.preventDefault();
        edit.commit(row, field);
        onEnter?.();
      }}
      data-edit-cell={`${row.id}:${field.name}`}
    >
      <FieldInput
        field={{ ...field, help: undefined, hint: undefined }}
        value={edit.value(row, field.name)}
        onChange={(v) => edit.change(row, field, mode, v)}
        error={edit.error(row, field.name)}
        record={edit.draft(row)}
        entity={entity}
      />
    </Box>
  );
}
