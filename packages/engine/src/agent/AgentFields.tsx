// material-ui
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Magicpen, TickCircle } from 'iconsax-reactjs';

import FieldInput from '../widgets/FieldInput';
import type { FieldDef, WireRecord } from '../types';
import type { Suggested } from './payload';

export interface AgentFieldsProps {
  fields: FieldDef[];
  /** Disposição em linhas (nomes); padrão: um campo por linha. */
  rows?: string[][];
  values: WireRecord;
  change: (name: string, value: unknown) => void;
  error: (name: string) => string | undefined;
  required: (f: FieldDef) => boolean;
  visible: (f: FieldDef) => boolean;
  suggested?: Suggested;
  /** Campos `aiReview` sugeridos que o usuário já conferiu (ou mexeu). */
  confirmed: Set<string>;
  onConfirm: (name: string) => void;
  /** Alteração: o valor gravado hoje, já formatado, para o "antes". */
  before?: Record<string, string>;
  readOnly?: boolean;
  entity?: string;
}

/** O campo preenchido pelo assistente que ainda precisa ser conferido antes de gravar. */
export const pendingReview = (f: FieldDef, suggested: Suggested | undefined, confirmed: Set<string>) =>
  Boolean(f.aiReview && suggested?.[f.name] !== undefined && !confirmed.has(f.name));

/**
 * Campos de uma parte do assistente: os inputs do motor, com a marca do que ele preencheu ("Sugerido: do pedido
 * 1234"), o valor de antes numa alteração e, em campo crítico (`aiReview`), o botão Conferi.
 */
export default function AgentFields(props: AgentFieldsProps) {
  const { fields, values, change, error, required, visible, suggested, confirmed, onConfirm, before, readOnly, entity } = props;
  const layout = props.rows ?? fields.map((f) => [f.name]);
  return (
    <Grid container spacing={2}>
      {layout.flatMap((row) => {
        const items = row.map((name) => fields.find((f) => f.name === name)).filter((f): f is FieldDef => !!f && visible(f));
        return items.map((f) => {
          const source = suggested?.[f.name];
          const review = pendingReview(f, suggested, confirmed);
          return (
            <Grid key={f.name} size={{ xs: 12, sm: 12 / items.length }}>
              <FieldInput
                field={f}
                value={values[f.name]}
                onChange={(v) => {
                  change(f.name, v);
                  if (review) onConfirm(f.name); // mexer no valor já é conferir
                }}
                error={error(f.name)}
                required={required(f)}
                readOnly={readOnly}
                record={values}
                entity={entity}
              />
              {(source !== undefined || before?.[f.name] !== undefined) && (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5, flexWrap: 'wrap', minHeight: 24 }}>
                  {source !== undefined && (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: 'center', color: review ? 'warning.dark' : 'primary.main' }}
                      title={source ? `Sugerido pelo assistente: ${source}` : 'Sugerido pelo assistente'}
                    >
                      <Magicpen size={14} aria-hidden />
                      <Typography variant="caption" sx={{ color: 'inherit' }}>
                        {review ? 'Confira este valor' : 'Sugerido'}
                        {source && ` · ${source}`}
                      </Typography>
                    </Stack>
                  )}
                  {review && !readOnly && (
                    <Button
                      size="small"
                      color="warning"
                      startIcon={<TickCircle size={14} />}
                      onClick={() => onConfirm(f.name)}
                      sx={{ py: 0, minHeight: 0 }}
                    >
                      Conferi
                    </Button>
                  )}
                  {before?.[f.name] !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      Antes: {before[f.name] || '(vazio)'}
                    </Typography>
                  )}
                </Stack>
              )}
            </Grid>
          );
        });
      })}
    </Grid>
  );
}
