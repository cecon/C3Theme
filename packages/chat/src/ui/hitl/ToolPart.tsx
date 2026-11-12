import { useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Edit2 } from 'iconsax-reactjs';

import {
  approveTool,
  declineTool,
  isToolProposal,
  readDrafts,
  toDraft,
  toolAllows,
  toolFields,
  toolResult,
  type ToolProposal
} from '../../core/hitl';
import type { UiPartProps } from '../UiParts';
import { useChatText } from '../text';
import ArgsEditor, { type Drafts } from './ArgsEditor';
import ArgsSummary from './ArgsSummary';
import ClosedLine from './ClosedLine';
import DeclineBox from './DeclineBox';
import useDecision from './useDecision';
import { actionsSx, headerSx, secondarySx, spacerSx } from './sx';

/**
 * `c3.tool`: o assistente quer rodar uma ferramenta. O humano vê o quê e com quais argumentos, pode editar antes,
 * aprovar, recusar dizendo o porquê ou (se oferecido e o risco não for alto) sempre permitir. Risco alto pede o
 * segundo clique. Nada roda daqui: a resposta volta ao assistente.
 */
export default function ToolPart(props: UiPartProps) {
  const t = useChatText();
  if (!isToolProposal(props.part.payload)) return <Alert severity="warning">{t('c3.chat.hitl.invalid')}</Alert>;
  return <ToolBody {...props} proposal={props.part.payload} />;
}

function ToolBody({ part, open, onAnswer, proposal: p }: UiPartProps & { proposal: ToolProposal }) {
  const t = useChatText();
  const fields = toolFields(p);
  const allows = toolAllows(p);
  const { busy, disabled, decide } = useDecision({ open, onAnswer });
  const [mode, setMode] = useState<'view' | 'edit' | 'decline' | 'sure'>('view');
  const [drafts, setDrafts] = useState<Drafts>(() => Object.fromEntries(fields.map((f) => [f.name, toDraft(f, p.args[f.name])])));
  // só o que o humano mexeu entra: o vaivém texto → valor não pode contar como mudança
  const [touched, setTouched] = useState<string[]>([]);
  const read = readDrafts(p, Object.fromEntries(touched.map((k) => [k, drafts[k]])));
  const invalid = Object.keys(read.errors).length > 0;
  const edited = approveTool(p, read.args).values!.edited as string[];
  const name = p.tool.label ?? p.tool.name;

  async function approve(always = false) {
    if (invalid) return;
    if (p.risk === 'high' && mode !== 'sure') return setMode('sure');
    await decide(approveTool(p, read.args, always));
  }

  if (!open) return <ToolClosed part={part} proposal={p} />;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={headerSx}>
        <Typography variant="subtitle2" component="p">
          {t('c3.chat.tool.wants', { tool: name })}
        </Typography>
        {p.risk === 'high' && <Chip size="small" color="error" variant="outlined" label={t('c3.chat.tool.risk.high')} />}
        {p.risk === 'medium' && <Chip size="small" color="warning" variant="outlined" label={t('c3.chat.tool.risk.medium')} />}
      </Stack>
      {p.tool.description && (
        <Typography variant="body2" sx={secondarySx}>
          {p.tool.description}
        </Typography>
      )}
      {mode === 'edit' ? (
        <ArgsEditor
          fields={fields}
          drafts={drafts}
          errors={read.errors}
          disabled={busy}
          onChange={(k, v) => {
            setDrafts((d) => ({ ...d, [k]: v }));
            setTouched((list) => (list.includes(k) ? list : [...list, k]));
          }}
        />
      ) : (
        <ArgsSummary fields={fields} args={read.args} edited={edited} />
      )}
      {mode === 'decline' ? (
        <DeclineBox disabled={disabled} onBack={() => setMode('view')} onDecline={(r) => void decide(declineTool(r))} />
      ) : (
        <Stack direction="row" sx={actionsSx}>
          <Button
            variant="contained"
            color={mode === 'sure' ? 'error' : 'primary'}
            disabled={disabled || invalid}
            onClick={() => void approve()}
          >
            {mode === 'sure'
              ? t('c3.chat.tool.confirm', { tool: name })
              : t(edited.length ? 'c3.chat.tool.approveEdited' : 'c3.chat.tool.approve')}
          </Button>
          {allows.edit && mode !== 'edit' && mode !== 'sure' && fields.length > 0 && (
            <Button color="secondary" startIcon={<Edit2 size={16} />} disabled={disabled} onClick={() => setMode('edit')}>
              {t('c3.chat.tool.edit')}
            </Button>
          )}
          {allows.always && mode !== 'sure' && (
            <Button color="secondary" disabled={disabled || invalid} onClick={() => void approve(true)}>
              {t('c3.chat.tool.always')}
            </Button>
          )}
          <Box sx={spacerSx} />
          <Button color="error" disabled={disabled} onClick={() => (allows.respond ? setMode('decline') : void decide(declineTool()))}>
            {t('c3.chat.tool.decline')}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}

function ToolClosed({ part, proposal }: { part: UiPartProps['part']; proposal: ToolProposal }) {
  const t = useChatText();
  const result = toolResult(part);
  const name = proposal.tool.label ?? proposal.tool.name;
  if (part.state === 'submitted') {
    const label = result?.always
      ? t('c3.chat.tool.alwaysOn')
      : result?.edited.length
        ? t('c3.chat.tool.approvedEdited', { count: result.edited.length })
        : t('c3.chat.tool.approved');
    return <ClosedLine tone="success" title={name} label={label} />;
  }
  if (part.state === 'declined') return <ClosedLine tone="error" title={name} label={t('c3.chat.tool.declined')} reason={result?.reason} />;
  return <ClosedLine title={name} />;
}
