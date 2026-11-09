import { useEffect, useRef, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { keyframes, type SxProps, type Theme } from '@mui/material/styles';

import { useUiText } from '../../i18n';
import WizardSteps from './WizardSteps';

export interface WizardAction {
  /** Texto do botão. A principal usa "Continuar" e Voltar usa "Voltar" quando não vem. */
  label?: ReactNode;
  /** Sem `onClick`, a principal vai para o próximo passo e Voltar para o anterior. */
  onClick?: () => void;
  disabled?: boolean;
}

export interface WizardStep {
  /** Nome curto no indicador do topo, ex.: "A empresa". */
  label: string;
}

export interface WizardProps {
  steps: WizardStep[];
  /** Passo atual (0 é o primeiro). Quem manda é o app: o Wizard não guarda estado nem salva nada. */
  step: number;
  onStepChange: (next: number) => void;
  /** Título do passo atual. Recebe o foco a cada passo novo. */
  title: ReactNode;
  description?: ReactNode;
  /** Acima do título, ex.: os avatares do app no passo de boas-vindas. */
  illustration?: ReactNode;
  /** Erro do passo inteiro (o erro de cada campo fica no campo). Lido pelo leitor de tela quando aparece. */
  error?: ReactNode;
  /** Ação principal. Enter também a dispara quando está habilitada. */
  primary?: WizardAction;
  /** Ação opcional à esquerda da principal, ex.: "Pular por enquanto". */
  secondary?: WizardAction;
  /** `false` esconde Voltar. Ele já some no primeiro passo. */
  back?: WizardAction | false;
  /** Nível do título. Padrão h1: o assistente costuma ser a tela inteira. */
  titleComponent?: 'h1' | 'h2' | 'h3';
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

const enter = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; }`;

// elementos em que Enter já tem efeito próprio (botão, link, quebra de linha, abrir lista); o resto deixa o form tratar
const CHOICE = new Set(['checkbox', 'radio']);
const OWN_ENTER =
  'button, a[href], textarea, select, [role="button"], [role="combobox"], [role="option"], [role="menuitem"], [contenteditable="true"]';

/**
 * Assistente em passos para o primeiro contato de um app: indicador no topo, conteúdo centralizado e a barra com
 * Voltar, a ação secundária e a principal. O passo atual vem do app (`step` + `onStepChange`); validar e salvar
 * também ficam com o app, normalmente no `onClick` da principal.
 */
export default function Wizard(props: WizardProps) {
  const {
    steps,
    step,
    onStepChange,
    title,
    description,
    illustration,
    error,
    primary,
    secondary,
    back,
    titleComponent = 'h1',
    children,
    sx
  } = props;
  const t = useUiText();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const last = steps.length - 1;

  useEffect(() => {
    // no primeiro desenho o foco fica onde o app deixou; a cada passo novo vai para o título
    if (firstRender.current) firstRender.current = false;
    else titleRef.current?.focus();
  }, [step]);

  const goNext = () => {
    if (primary?.disabled) return;
    if (primary?.onClick) primary.onClick();
    else if (step < last) onStepChange(step + 1);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    goNext();
  };
  // input de texto já envia o form com Enter (o navegador faz); aqui fica o Enter no título, num cartão ou no fundo
  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.defaultPrevented) return;
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement ? !CHOICE.has(target.type) : target.closest(OWN_ENTER)) return;
    e.preventDefault();
    goNext();
  };

  const showBack = back !== false && step > 0;
  const goBack = () => (back && back.onClick ? back.onClick() : onStepChange(step - 1));

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={submit}
      onKeyDown={onKeyDown}
      sx={[{ gap: 4, width: '100%', maxWidth: 720, mx: 'auto', px: 3, py: 4 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {steps.length > 1 && <WizardSteps labels={steps.map((s) => s.label)} active={step} />}

      <Stack
        key={step}
        sx={{
          gap: 3,
          width: '100%',
          maxWidth: 560,
          mx: 'auto',
          animation: `${enter} 200ms ease-out`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
        }}
      >
        {illustration && <Box sx={{ display: 'flex', justifyContent: 'center' }}>{illustration}</Box>}
        <Stack sx={{ gap: 1, textAlign: 'center' }}>
          <Typography ref={titleRef} component={titleComponent} variant="h3" tabIndex={-1} sx={{ '&:focus': { outline: 'none' } }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
        {children}
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>

      <Stack direction="row" sx={{ gap: 1, alignItems: 'center', width: '100%', maxWidth: 560, mx: 'auto' }}>
        {showBack && (
          <Button type="button" color="inherit" onClick={goBack} disabled={back ? back.disabled : false}>
            {(back && back.label) || t('c3.action.back')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {secondary && (
          <Button type="button" color="inherit" onClick={secondary.onClick} disabled={secondary.disabled}>
            {secondary.label}
          </Button>
        )}
        <Button type="submit" variant="contained" disabled={primary?.disabled}>
          {primary?.label ?? t('c3.wizard.next')}
        </Button>
      </Stack>
    </Stack>
  );
}
