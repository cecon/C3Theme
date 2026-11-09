import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cloud, Code1, Cpu, MessageQuestion, People, ShoppingCart } from 'iconsax-reactjs';

import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import { ChoiceCard, ChoiceGroup, SoftAvatar, Wizard, type WizardAction } from '@c3theme/ui';

const STEPS = [{ label: 'Boas-vindas' }, { label: 'A empresa' }, { label: 'Quem pensa' }, { label: 'Primeiro agente' }];

const BRAINS = [
  { value: 'cloud', title: 'Modelo na nuvem', description: 'Responde rápido e não pesa no computador.', icon: <Cloud size={22} /> },
  { value: 'local', title: 'Modelo local', description: 'Nada sai da máquina; precisa de uma boa placa de vídeo.', icon: <Cpu size={22} /> }
];

const ROLES = [
  { value: 'vendas', title: 'Vendas', description: 'Atende quem chega pelo site.', icon: <ShoppingCart size={22} /> },
  { value: 'suporte', title: 'Suporte', description: 'Responde dúvidas de quem já é cliente.', icon: <MessageQuestion size={22} /> },
  { value: 'dev', title: 'Desenvolvimento', description: 'Revisa código e abre pull requests.', icon: <Code1 size={22} /> },
  { value: 'rh', title: 'Pessoas', description: 'Faz a triagem dos currículos.', icon: <People size={22} /> }
];

interface Page {
  title: string;
  description: string;
  illustration?: ReactNode;
  body?: ReactNode;
  error?: string;
  primary?: WizardAction;
}

interface DemoProps {
  start: number;
  /** Mostra o erro de validação logo de cara (história do passo com erro). */
  showError?: boolean;
}

/** Os quatro passos do primeiro contato. O estado fica aqui, na história, como ficaria no app. */
function Onboarding({ start, showError = false }: DemoProps) {
  const [step, setStep] = useState(start);
  const [company, setCompany] = useState('');
  const [tried, setTried] = useState(showError);
  const [brain, setBrain] = useState('cloud');
  const [roles, setRoles] = useState<string[]>([]);
  const companyError = tried && !company.trim();

  const pages: Page[] = [
    {
      title: 'Boas-vindas ao Piecework',
      description: 'Em quatro passos curtos a sua equipe de agentes fica pronta para trabalhar.',
      illustration: (
        <AvatarGroup sx={{ '& .MuiAvatar-root': { borderColor: 'background.paper' } }}>
          <SoftAvatar tone="primary" size="lg">
            AN
          </SoftAvatar>
          <SoftAvatar tone="success" size="lg">
            BE
          </SoftAvatar>
          <SoftAvatar tone="warning" size="lg">
            CA
          </SoftAvatar>
        </AvatarGroup>
      ),
      primary: { label: 'Começar' }
    },
    {
      title: 'A empresa',
      description: 'O nome aparece para os agentes e nos relatórios.',
      body: (
        <TextField
          label="Nome da empresa"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          error={companyError}
          helperText={companyError ? 'Informe o nome da empresa.' : 'Pode mudar depois.'}
          required
          fullWidth
        />
      ),
      error: companyError ? 'Falta um dado para continuar.' : undefined,
      primary: { onClick: () => (company.trim() ? setStep(2) : setTried(true)) }
    },
    {
      title: 'Quem pensa pelos agentes',
      description: 'Escolha onde roda o modelo que os agentes usam.',
      body: (
        <ChoiceGroup label="Onde roda o modelo">
          {BRAINS.map((b) => (
            <ChoiceCard
              key={b.value}
              type="radio"
              name="brain"
              value={b.value}
              checked={brain === b.value}
              onChange={() => setBrain(b.value)}
              title={b.title}
              description={b.description}
              media={<SoftAvatar tone="primary">{b.icon}</SoftAvatar>}
            />
          ))}
        </ChoiceGroup>
      )
    },
    {
      title: 'Contratar o primeiro agente',
      description: 'Dá para contratar mais depois, na tela de Equipe.',
      body: (
        <ChoiceGroup label="Que vagas estão faltando?" helperText="Escolha uma ou mais.">
          {ROLES.map((r) => (
            <ChoiceCard
              key={r.value}
              value={r.value}
              checked={roles.includes(r.value)}
              onChange={(on) => setRoles((cur) => (on ? [...cur, r.value] : cur.filter((v) => v !== r.value)))}
              title={r.title}
              description={r.description}
              media={<SoftAvatar tone="secondary">{r.icon}</SoftAvatar>}
            />
          ))}
        </ChoiceGroup>
      ),
      primary: { label: 'Contratar', disabled: roles.length === 0, onClick: () => setStep(0) }
    }
  ];
  const page = pages[step];

  return (
    <Box sx={{ minWidth: 900, bgcolor: 'background.default' }}>
      <Wizard
        steps={STEPS}
        step={step}
        onStepChange={setStep}
        title={page.title}
        description={page.description}
        illustration={page.illustration}
        error={page.error}
        primary={page.primary}
        secondary={step === 3 ? { label: 'Pular por enquanto', onClick: () => setStep(0) } : undefined}
      >
        {page.body}
      </Wizard>
    </Box>
  );
}

/** Uso direto: a spec não tem assistente em passos (cadastro guiado); hoje ele é montado em código. */
const meta = {
  title: 'Componentes/Assistente em passos (uso direto)',
  tags: ['uso-direto'],
  component: Onboarding,
  args: { start: 0 },
  argTypes: { start: { control: { type: 'number', min: 0, max: 3 } } },
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, iframeHeight: 640 } } }
} satisfies Meta<typeof Onboarding>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Os quatro passos: boas-vindas com ilustração, a empresa, quem pensa (escolha única) e contratar (várias). */
export const QuatroPassos: Story = { name: 'Quatro passos' };

/** Tentou continuar sem o nome: o campo e o passo mostram o erro, e o passo não muda. */
export const ComErro: Story = { name: 'Passo com erro de validação', args: { start: 1, showError: true } };

/** Nenhuma vaga marcada: "Contratar" fica desabilitado, e Enter também não avança. */
export const PrincipalDesabilitada: Story = { name: 'Ação principal desabilitada', args: { start: 3 } };
