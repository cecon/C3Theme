import { useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  approvePlan,
  canApprove,
  isPlanProposal,
  moveStep,
  planAllows,
  planDraft,
  planResult,
  renameStep,
  toggleStep,
  type PlanProposal
} from '../../core/hitlPlan';
import { declineTool } from '../../core/hitl';
import type { UiPartProps } from '../UiParts';
import { useChatText } from '../text';
import ClosedLine from './ClosedLine';
import DeclineBox from './DeclineBox';
import PlanStepRow from './PlanStepRow';
import useDecision from './useDecision';

/**
 * `c3.plan`: o assistente mostra o plano antes de começar. O humano desmarca passos (menos os obrigatórios), muda a
 * ordem pelas setas, reescreve o texto e aprova, ou recusa com o porquê. O que volta ao assistente é o plano final.
 */
export default function PlanPart(props: UiPartProps) {
  const t = useChatText();
  if (!isPlanProposal(props.part.payload)) return <Alert severity="warning">{t('c3.chat.hitl.invalid')}</Alert>;
  return <PlanBody {...props} plan={props.part.payload} />;
}

function PlanBody({ part, open, onAnswer, plan }: UiPartProps & { plan: PlanProposal }) {
  const t = useChatText();
  const allows = planAllows(plan);
  const { disabled, decide } = useDecision({ open, onAnswer });
  const [steps, setSteps] = useState(() => planDraft(plan));
  const [declining, setDeclining] = useState(false);
  const title = plan.title ?? t('c3.chat.plan.title');
  const answer = approvePlan(plan, steps);

  if (!open) {
    const result = planResult(part);
    if (part.state === 'submitted' && result) {
      const label = [
        t('c3.chat.plan.approved', { count: result.steps.length }),
        result.removed.length ? t('c3.chat.plan.removed', { count: result.removed.length }) : ''
      ]
        .filter(Boolean)
        .join(' · ');
      return <ClosedLine tone="success" title={title} label={label} />;
    }
    if (part.state === 'declined')
      return (
        <ClosedLine
          tone="error"
          title={title}
          label={t('c3.chat.plan.declined')}
          reason={(part.result as { reason?: string } | undefined)?.reason}
        />
      );
    return <ClosedLine title={title} />;
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" component="h3">
        {title}
      </Typography>
      <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 0.75 }}>
        {steps.map((s, i) => (
          <PlanStepRow
            key={s.id}
            step={s}
            index={i}
            last={i === steps.length - 1}
            allows={allows}
            disabled={disabled}
            onToggle={() => setSteps((list) => toggleStep(list, s.id))}
            onRename={(text) => setSteps((list) => renameStep(list, s.id, text))}
            onMove={(to) => setSteps((list) => moveStep(list, i, to))}
          />
        ))}
      </Box>
      {declining ? (
        <DeclineBox disabled={disabled} onBack={() => setDeclining(false)} onDecline={(r) => void decide(declineTool(r))} />
      ) : (
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" disabled={disabled || !canApprove(steps)} onClick={() => void decide(answer)}>
            {t(answer.values!.edited ? 'c3.chat.plan.approveEdited' : 'c3.chat.plan.approve')}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button color="error" disabled={disabled} onClick={() => setDeclining(true)}>
            {t('c3.chat.tool.decline')}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
