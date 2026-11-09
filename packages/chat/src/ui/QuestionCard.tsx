import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, TickCircle } from 'iconsax-reactjs';

import { answerLabels, type AgentQuestion, type QuestionAnswer } from '../core/question';
import { approvalChoice } from '../core/team';
import QuestionInputs from './QuestionInputs';
import { isSubmitShortcut } from './Shortcut';
import ApprovalInputs from './team/ApprovalInputs';
import { useChatText } from './text';

export interface QuestionCardProps {
  question: AgentQuestion;
  /** O contexto da pergunta (o texto da mensagem), em cima. */
  children?: ReactNode;
  /** Responder ou dispensar. Sem isso, o card só mostra a pergunta. */
  onAnswer?: (answer: QuestionAnswer) => void;
  /**
   * É a pergunta em aberto da conversa: o Ctrl+Enter vale de qualquer lugar da tela, inclusive da caixa de
   * mensagem vazia (não de um campo com texto escrito). Sem isso, só com o foco no card.
   */
  active?: boolean;
  /** Quem pergunta (nome do agente), para o título da aprovação ("Cozinha quer usar Baixar estoque"). */
  agentName?: string;
}

/** Campo de texto fora do card com algo escrito: o Ctrl+Enter é de quem está escrevendo ali, não da pergunta. */
function typingElsewhere(target: EventTarget | null, card: HTMLElement | null) {
  if (!(target instanceof HTMLElement) || card?.contains(target)) return false;
  if (target.isContentEditable) return !!target.textContent?.trim();
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return !!target.value.trim();
  return target instanceof HTMLSelectElement;
}

/**
 * Card de pergunta do agente: contexto, pergunta em destaque, as opções (a principal com Ctrl+Enter) e o X para
 * dispensar. Depois de responder, vira um resumo com o que foi escolhido.
 */
export default function QuestionCard({ question: q, children, onAnswer, active, agentName }: QuestionCardProps) {
  const t = useChatText();
  const cardRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<(() => void) | null>(null);
  const answered = q.answer;
  const approval = q.kind === 'approval';
  const choice = approval ? approvalChoice(answered) : undefined;
  // aprovação não some no X: recusar é uma resposta, e o agente fica esperando por ela
  const dismissible = !approval && q.dismissible !== false;
  const toolName = q.tool?.label ?? q.tool?.name ?? '';
  const prompt = q.prompt || (approval ? t('c3.chat.approval.prompt', { agent: agentName ?? t('c3.chat.assistant'), tool: toolName }) : '');
  const labels = choice ? [t(`c3.chat.approval.${choice}`)] : answered ? answerLabels(q, answered) : [];

  useEffect(() => {
    if (!active || answered) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!isSubmitShortcut(e) || typingElsewhere(e.target, cardRef.current) || !submitRef.current) return;
      if (e.target instanceof Node && cardRef.current?.contains(e.target)) return; // dentro do card, o onKeyDown já cuidou
      e.preventDefault();
      submitRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, answered]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (answered) return;
    if (isSubmitShortcut(e) && submitRef.current) {
      e.preventDefault();
      submitRef.current();
    } else if (e.key === 'Escape' && onAnswer && dismissible) {
      onAnswer({ dismissed: true });
    }
  }

  const Inputs = approval ? ApprovalInputs : QuestionInputs;
  const canDismiss = !answered && !!onAnswer && dismissible;
  return (
    <Paper
      ref={cardRef}
      variant="outlined"
      role="group"
      aria-label={t(approval ? 'c3.chat.approval' : 'c3.chat.question')}
      onKeyDown={onKeyDown}
      sx={{ position: 'relative', width: '100%', p: 2, borderRadius: 3, bgcolor: answered ? 'transparent' : 'background.paper' }}
    >
      {canDismiss && (
        <Tooltip title={t('c3.chat.dismiss')}>
          <IconButton
            size="small"
            aria-label={t('c3.chat.dismiss')}
            onClick={() => onAnswer({ dismissed: true })}
            sx={{ position: 'absolute', top: 8, insetInlineEnd: 8, color: 'text.secondary' }}
          >
            <CloseCircle size={18} />
          </IconButton>
        </Tooltip>
      )}
      {children && <Box sx={{ pr: canDismiss ? 4 : 0, mb: 1.5 }}>{children}</Box>}
      <Typography variant="subtitle2" component="p" sx={{ pr: canDismiss && !children ? 4 : 0, mb: answered ? 1 : 1.5 }}>
        {prompt}
      </Typography>
      {answered ? (
        answered.dismissed && !approval ? (
          <Typography variant="caption" color="text.secondary">
            {t('c3.chat.dismissed')}
          </Typography>
        ) : (
          <Stack
            direction="row"
            sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.75, color: choice === 'decline' ? 'text.secondary' : 'success.main' }}
          >
            {choice === 'decline' ? (
              <CloseCircle size={16} variant="Bold" aria-hidden />
            ) : (
              <TickCircle size={16} variant="Bold" aria-hidden />
            )}
            {labels.map((label) => (
              <Chip key={label} size="small" label={label} sx={{ maxWidth: '100%' }} />
            ))}
          </Stack>
        )
      ) : (
        <Inputs question={q} onAnswer={onAnswer} submitRef={submitRef} />
      )}
    </Paper>
  );
}
