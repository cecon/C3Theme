import { useState } from 'react';

// material-ui
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Add, ArrowDown2, Card, Lock, Profile, Truck } from 'iconsax-reactjs';

import { notify, SoftAvatar, StatusChip, type Tone } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

const FAQ = [
  {
    q: 'Como emito a segunda via do boleto?',
    a: 'Acesse Financeiro › Faturas, escolha a fatura e clique em “Segunda via”. O novo boleto tem vencimento em 3 dias úteis.'
  },
  {
    q: 'Posso trocar de plano a qualquer momento?',
    a: 'Sim. A diferença é calculada proporcionalmente aos dias restantes do ciclo atual.'
  },
  { q: 'Os dados ficam salvos no Brasil?', a: 'Sim, em servidores localizados em São Paulo, de acordo com a LGPD.' }
];

const arrow = <ArrowDown2 size={18} />;

function ControlledDemo() {
  const [expanded, setExpanded] = useState<string | false>('dados');
  const sections: { id: string; title: string; subtitle: string; icon: typeof Profile; tone: Tone; text: string }[] = [
    {
      id: 'dados',
      title: 'Dados pessoais',
      subtitle: 'Nome, CPF e telefone',
      icon: Profile,
      tone: 'primary',
      text: 'Mantenha seus dados atualizados para receber notas fiscais corretamente.'
    },
    {
      id: 'entrega',
      title: 'Endereço de entrega',
      subtitle: 'Rua das Palmeiras, 120 – Curitiba',
      icon: Truck,
      tone: 'info',
      text: 'Você pode cadastrar até 5 endereços e escolher um como principal.'
    },
    {
      id: 'pagamento',
      title: 'Pagamento',
      subtitle: 'Cartão final 4821',
      icon: Card,
      tone: 'success',
      text: 'Cartões e Pix ficam salvos com criptografia; o CVV nunca é armazenado.'
    }
  ];
  return (
    <Box>
      {sections.map((s) => (
        <Accordion key={s.id} expanded={expanded === s.id} onChange={(_, open) => setExpanded(open ? s.id : false)}>
          <AccordionSummary expandIcon={arrow} aria-controls={`${s.id}-conteudo`} id={`${s.id}-cabecalho`}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
              <SoftAvatar tone={s.tone} size="sm">
                <s.icon size={16} />
              </SoftAvatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1">{s.title}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {s.subtitle}
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary">{s.text}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

export default function AccordionPage() {
  return (
    <ExamplePage intro="O acordeão esconde e mostra seções de conteúdo. Bom para perguntas frequentes e formulários longos divididos em partes.">
      <Example
        title="Básico"
        code={`<Accordion>
  <AccordionSummary expandIcon={<ArrowDown2 />}>Pergunta</AccordionSummary>
  <AccordionDetails>Resposta</AccordionDetails>
</Accordion>`}
      >
        <Box>
          {FAQ.map((f, i) => (
            <Accordion key={f.q} defaultExpanded={i === 0}>
              <AccordionSummary expandIcon={arrow}>
                <Typography variant="subtitle1">{f.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{f.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Example>

      <Example
        title="Controlado"
        description="Só uma seção aberta por vez."
        code={`<Accordion expanded={aberto === 'dados'} onChange={(_, abrir) => setAberto(abrir ? 'dados' : false)}>...</Accordion>`}
      >
        <ControlledDemo />
      </Example>

      <Example title="Desabilitado" code={`<Accordion disabled>...</Accordion>`}>
        <Box>
          <Accordion>
            <AccordionSummary expandIcon={arrow}>
              <Typography variant="subtitle1">Preferências</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">Idioma, fuso horário e formato de datas.</Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion disabled>
            <AccordionSummary expandIcon={arrow}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Lock size={16} />
                <Typography variant="subtitle1">Integrações (plano Empresa)</Typography>
              </Stack>
            </AccordionSummary>
          </Accordion>
        </Box>
      </Example>

      <Example
        title="Com ações"
        description="Botões no rodapé da seção."
        code={`<Accordion>
  ...
  <AccordionActions><Button>Cancelar</Button><Button>Salvar</Button></AccordionActions>
</Accordion>`}
      >
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={arrow}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Typography variant="subtitle1">Assinatura de e-mail</Typography>
              <StatusChip label="Rascunho" tone="warning" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary">Ana Beatriz Souza · Gerente de projetos · (41) 3333-0000</Typography>
          </AccordionDetails>
          <AccordionActions>
            <Button onClick={() => notify('Alterações descartadas.', 'info')}>Descartar</Button>
            <Button variant="contained" onClick={() => notify('Assinatura salva.')}>
              Salvar
            </Button>
          </AccordionActions>
        </Accordion>
      </Example>

      <Example
        title="Personalizado"
        description="Separado em cartões, ícone de mais e fundo suave quando aberto."
        code={`<Accordion disableGutters sx={{ borderRadius: 2, '&::before': { display: 'none' }, '&.Mui-expanded': { bgcolor: 'action.hover' } }}>...</Accordion>`}
      >
        <Stack spacing={1.5}>
          {FAQ.map((f, i) => (
            <Accordion
              key={f.q}
              defaultExpanded={i === 1}
              disableGutters
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                '&::before': { display: 'none' },
                '&.Mui-expanded': { borderColor: 'primary.main' },
                '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': { transform: 'rotate(45deg)' }
              }}
            >
              <AccordionSummary expandIcon={<Add size={18} />} sx={{ '&.Mui-expanded': { color: 'primary.main' } }}>
                <Typography variant="subtitle1">{f.q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography color="text.secondary">{f.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Example>

      <Example
        title="Sem espaçamento e quadrado"
        description="Fixo, sem mudar de altura ao abrir; bom em painéis laterais."
        code={`<Accordion disableGutters square>...</Accordion>`}
      >
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          {['Filtros por data', 'Filtros por cliente', 'Filtros por situação'].map((t, i) => (
            <Accordion
              key={t}
              disableGutters
              square
              elevation={0}
              defaultExpanded={i === 0}
              sx={{ '&:not(:last-of-type)': { borderBottom: 1, borderColor: 'divider' }, '&::before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={arrow} sx={{ bgcolor: 'background.default' }}>
                <Typography variant="subtitle2">{t}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Opções de filtro aparecem aqui.
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Example>
    </ExamplePage>
  );
}
