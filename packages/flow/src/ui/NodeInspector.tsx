import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { CloseCircle, Trash } from 'iconsax-reactjs';

import { edgeFrom, nodeName } from '../core/graph';
import type { FlowField, FlowGraph, FlowNode, NodeRunStatus } from '../core/types';
import { StatusChip } from '@c3theme/ui';
import { STATUS_TONE, type FlowNodeKind } from './kinds';
import type { FlowText } from './text';

export interface NodeInspectorProps {
  graph: FlowGraph;
  node: FlowNode;
  kinds: FlowNodeKind[];
  status?: NodeRunStatus;
  issues: string[];
  readOnly: boolean;
  t: FlowText;
  onRename: (label: string) => void;
  onConfig: (config: Record<string, unknown>) => void;
  /** Liga a saída ao passo escolhido; `null` desfaz a ligação. É a alternativa de teclado ao arrastar. */
  onLink: (port: string, target: string | null) => void;
  /** `false`: sem o botão de remover (tipo com `removable: false`). */
  removable?: boolean;
  onRemove: () => void;
  onClose: () => void;
}

function FieldInput({
  field,
  value,
  readOnly,
  onChange
}: {
  field: FlowField;
  value: unknown;
  readOnly: boolean;
  onChange: (v: unknown) => void;
}) {
  const common = {
    label: field.label,
    required: field.required,
    helperText: field.helperText,
    disabled: readOnly,
    fullWidth: true,
    size: 'small' as const
  };
  if (field.kind === 'select') {
    return (
      <TextField select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {(field.options ?? []).map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }
  if (field.kind === 'number') {
    return (
      <TextField
        {...common}
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    );
  }
  return (
    <TextField
      {...common}
      multiline={field.kind === 'textarea'}
      minRows={field.kind === 'textarea' ? 3 : undefined}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Painel do passo selecionado: nome, formulário do tipo, ligações por menu, problemas e remover. */
export default function NodeInspector(props: NodeInspectorProps) {
  const { graph, node, kinds, status, issues, readOnly, removable = true, t, onRename, onConfig, onLink, onRemove, onClose } = props;
  const kind = kinds.find((k) => k.type === node.type);
  const name = nodeName(kinds, node);
  const config = node.config ?? {};
  const setField = (key: string, v: unknown) => onConfig({ ...config, [key]: v });
  const targets = graph.nodes.filter((n) => n.id !== node.id && kinds.find((k) => k.type === n.type)?.hasInput);
  const headingId = `c3-flow-inspector-${node.id}`;

  return (
    <Box component="section" aria-labelledby={headingId} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {kind?.label}
          </Typography>
          <Typography id={headingId} variant="h6" component="h2" noWrap title={name}>
            {name}
          </Typography>
        </Box>
        {status && <StatusChip label={t(`c3.flow.status.${status}`)} tone={STATUS_TONE[status]} />}
        <IconButton size="small" aria-label={t('c3.flow.close')} onClick={onClose}>
          <CloseCircle size={18} />
        </IconButton>
      </Stack>

      {issues.length > 0 && (
        <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
          <Typography variant="subtitle2" component="h3">
            {t('c3.flow.problems')}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {issues.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </Box>
        </Alert>
      )}

      <TextField
        label={t('c3.flow.name')}
        size="small"
        fullWidth
        disabled={readOnly}
        value={node.label ?? ''}
        placeholder={kind?.label}
        onChange={(e) => onRename(e.target.value)}
      />
      {(kind?.fields ?? []).map((field) => (
        <FieldInput key={field.key} field={field} value={config[field.key]} readOnly={readOnly} onChange={(v) => setField(field.key, v)} />
      ))}
      {kind?.renderConfig?.({ node, readOnly, onChange: onConfig, graph })}

      {kind && kind.outputs.length > 0 && (
        <>
          <Divider />
          <Typography variant="subtitle2" component="h3">
            {t('c3.flow.links')}
          </Typography>
          {kind.outputs.map((port) => (
            <TextField
              key={port.id}
              select
              size="small"
              fullWidth
              disabled={readOnly}
              label={port.label ? t('c3.flow.nextFrom', { port: port.label }) : t('c3.flow.next')}
              value={edgeFrom(graph, node.id, port.id)?.target ?? ''}
              onChange={(e) => onLink(port.id, e.target.value || null)}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">
                <em>{t('c3.flow.noLink')}</em>
              </MenuItem>
              {targets.map((n) => (
                <MenuItem key={n.id} value={n.id}>
                  {nodeName(kinds, n)}
                </MenuItem>
              ))}
            </TextField>
          ))}
        </>
      )}

      {!readOnly && removable && (
        <Button color="error" variant="outlined" startIcon={<Trash size={16} />} onClick={onRemove} sx={{ alignSelf: 'flex-start' }}>
          {t('c3.flow.remove')}
        </Button>
      )}
    </Box>
  );
}
