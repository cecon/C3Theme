// Etapas com ícones próprios e carrossel.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MobileStepper from '@mui/material/MobileStepper';
import Paper from '@mui/material/Paper';
import Step from '@mui/material/Step';
import type { StepIconProps } from '@mui/material/StepIcon';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import { ArrowLeft2, ArrowRight2, Card, Location, ShoppingCart, TickCircle } from 'iconsax-reactjs';
import { SoftAvatar } from '@c3theme/ui';
import { illustration } from '../../data';

const ICON_STEPS = [
  { label: 'Carrinho', icon: ShoppingCart },
  { label: 'Endereço', icon: Location },
  { label: 'Pagamento', icon: Card }
];

// ícone da etapa: o MUI passa o número da etapa em `icon`
function CheckoutStepIcon({ active, completed, error, icon }: StepIconProps) {
  const Icon = ICON_STEPS[Number(icon) - 1]?.icon ?? TickCircle;
  return (
    <SoftAvatar
      size="sm"
      tone={error ? 'danger' : completed ? 'success' : active ? 'primary' : 'neutral'}
      look={active ? 'filled' : 'soft'}
    >
      {completed ? <TickCircle size={16} /> : <Icon size={16} />}
    </SoftAvatar>
  );
}

export function CustomIconsDemo() {
  return (
    <Stepper activeStep={1} alternativeLabel>
      {ICON_STEPS.map(({ label, icon: Icon }, i) => (
        <Step key={label}>
          <StepLabel
            error={i === 2}
            optional={
              i === 2 ? (
                <Typography variant="caption" color="error">
                  Cartão recusado
                </Typography>
              ) : undefined
            }
            slots={{ stepIcon: CheckoutStepIcon }}
          >
            {label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

const SLIDES = [
  { title: 'Bem-vindo ao painel', text: 'Acompanhe vendas e estoque em tempo real.', hue: 215 },
  { title: 'Relatórios automáticos', text: 'Receba o resumo da semana toda segunda.', hue: 160 },
  { title: 'Equipe conectada', text: 'Convide colegas e defina permissões.', hue: 30 },
  { title: 'Tudo no celular', text: 'Aprove pedidos de qualquer lugar.', hue: 280 }
];

export function CarouselDemo() {
  const [active, setActive] = useState(0);
  const slide = SLIDES[active]!;
  return (
    <Paper variant="outlined" sx={{ maxWidth: 420, mx: 'auto', overflow: 'hidden', borderRadius: 3 }}>
      <Box sx={{ position: 'relative', overflow: 'hidden', height: 180 }}>
        <Box sx={{ display: 'flex', height: '100%', transition: 'transform .4s ease', transform: `translateX(-${active * 100}%)` }}>
          {SLIDES.map((s) => (
            <Box key={s.title} component="img" src={illustration(s.hue)} alt="" sx={{ width: '100%', flexShrink: 0, objectFit: 'cover' }} />
          ))}
        </Box>
      </Box>
      <Box sx={{ p: 2, minHeight: 84 }}>
        <Typography variant="h5">{slide.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {slide.text}
        </Typography>
      </Box>
      <MobileStepper
        variant="dots"
        steps={SLIDES.length}
        position="static"
        activeStep={active}
        nextButton={
          <Button
            size="small"
            onClick={() => setActive(active + 1)}
            disabled={active === SLIDES.length - 1}
            endIcon={<ArrowRight2 size={14} />}
          >
            Próximo
          </Button>
        }
        backButton={
          <Button size="small" onClick={() => setActive(active - 1)} disabled={active === 0} startIcon={<ArrowLeft2 size={14} />}>
            Anterior
          </Button>
        }
      />
    </Paper>
  );
}
