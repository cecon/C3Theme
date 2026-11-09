import { ReactNode, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

// third-party
import { Heart, Lock, Notification, Profile, Setting2, Wallet } from 'iconsax-reactjs';

import Example, { ExamplePage } from '../Example';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

function Panel({ id, value, index, children }: { id: string; value: number; index: number; children: ReactNode }) {
  if (value !== index) return null;
  return (
    <Box role="tabpanel" id={`${id}-painel-${index}`} aria-labelledby={`${id}-aba-${index}`} sx={{ pt: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {children}
      </Typography>
    </Box>
  );
}

const a11y = (id: string, index: number) => ({ id: `${id}-aba-${index}`, 'aria-controls': `${id}-painel-${index}` });

function BasicDemo() {
  const [value, setValue] = useState(0);
  const tabs = ['Dados pessoais', 'Endereço', 'Pagamento'];
  return (
    <Box>
      <Tabs value={value} onChange={(_, v: number) => setValue(v)} aria-label="Cadastro" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map((t, i) => (
          <Tab key={t} label={t} {...a11y('basico', i)} />
        ))}
        <Tab label="Histórico" disabled />
      </Tabs>
      {tabs.map((t, i) => (
        <Panel key={t} id="basico" value={value} index={i}>
          Conteúdo da aba “{t}”. Só a aba ativa é renderizada.
        </Panel>
      ))}
    </Box>
  );
}

function CenteredDemo() {
  const [value, setValue] = useState(1);
  return (
    <Box>
      <Tabs
        value={value}
        onChange={(_, v: number) => setValue(v)}
        centered
        aria-label="Período"
        textColor="secondary"
        indicatorColor="secondary"
      >
        <Tab label="Hoje" />
        <Tab label="Semana" />
        <Tab label="Mês" />
      </Tabs>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 2 }}>
        Mostrando dados de: {['hoje', 'esta semana', 'este mês'][value]}
      </Typography>
    </Box>
  );
}

function IconDemo() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  return (
    <Box>
      <Tabs
        value={a}
        onChange={(_, v: number) => setA(v)}
        aria-label="Ícones em cima"
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Profile size={20} />} label="Perfil" />
        <Tab icon={<Heart size={20} />} label="Favoritos" />
        <Tab icon={<Notification size={20} />} label="Avisos" />
      </Tabs>
      <Tabs
        value={b}
        onChange={(_, v: number) => setB(v)}
        aria-label="Ícones ao lado"
        sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Profile size={18} />} iconPosition="start" label="Perfil" sx={{ minHeight: 48 }} />
        <Tab icon={<Wallet size={18} />} iconPosition="start" label="Faturas" sx={{ minHeight: 48 }} />
        <Tab
          icon={<Chip label="3" size="small" color="error" sx={{ height: 18, fontSize: 11 }} />}
          iconPosition="end"
          label="Pendências"
          sx={{ minHeight: 48 }}
        />
      </Tabs>
      <Tabs value={0} aria-label="Só ícones" sx={{ mt: 2 }}>
        <Tab icon={<Profile size={20} />} aria-label="Perfil" />
        <Tab icon={<Lock size={20} />} aria-label="Segurança" />
        <Tab icon={<Setting2 size={20} />} aria-label="Configurações" />
      </Tabs>
    </Box>
  );
}

function ScrollableDemo() {
  const [value, setValue] = useState(9);
  return (
    <Box>
      <Tabs
        value={value}
        onChange={(_, v: number) => setValue(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Meses"
      >
        {MONTHS.map((m) => (
          <Tab key={m} label={m} />
        ))}
      </Tabs>
      <Typography variant="body2" color="text.secondary" sx={{ pt: 2 }}>
        Fechamento de {MONTHS[value]!.toLowerCase()} de 2026.
      </Typography>
    </Box>
  );
}

function VerticalDemo() {
  const [value, setValue] = useState(0);
  const items = [
    { icon: Profile, label: 'Conta', text: 'Nome, e-mail e foto de perfil.' },
    { icon: Lock, label: 'Segurança', text: 'Senha, verificação em duas etapas e sessões ativas.' },
    { icon: Notification, label: 'Notificações', text: 'Quais avisos chegam por e-mail e no app.' },
    { icon: Wallet, label: 'Cobrança', text: 'Plano atual, faturas e forma de pagamento.' }
  ];
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, minHeight: 200 }}>
      <Tabs
        orientation="vertical"
        value={value}
        onChange={(_, v: number) => setValue(v)}
        aria-label="Configurações"
        sx={{
          borderRight: { sm: 1 },
          borderColor: 'divider',
          minWidth: 180,
          '& .MuiTab-root': { justifyContent: 'flex-start', minHeight: 44 }
        }}
      >
        {items.map(({ icon: Icon, label }, i) => (
          <Tab key={label} icon={<Icon size={18} />} iconPosition="start" label={label} {...a11y('vertical', i)} />
        ))}
      </Tabs>
      <Box sx={{ px: { sm: 3 }, flex: 1 }}>
        {items.map((it, i) => (
          <Panel key={it.label} id="vertical" value={value} index={i}>
            <Typography variant="h5" component="span" sx={{ display: 'block', color: 'text.primary', mb: 1 }}>
              {it.label}
            </Typography>
            {it.text}
          </Panel>
        ))}
      </Box>
    </Box>
  );
}

function PillsDemo() {
  const [value, setValue] = useState(0);
  return (
    <Tabs
      value={value}
      onChange={(_, v: number) => setValue(v)}
      aria-label="Filtro em pílulas"
      variant="scrollable"
      slotProps={{ indicator: { sx: { display: 'none' } } }}
      sx={{
        minHeight: 0,
        '& .MuiTabs-flexContainer': { gap: 1 },
        '& .MuiTab-root': { minHeight: 36, py: 0.75, px: 2, borderRadius: 999, bgcolor: 'action.hover' },
        '& .MuiTab-root.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' }
      }}
    >
      <Tab label="Todos" />
      <Tab label="Abertos" />
      <Tab label="Pagos" />
      <Tab label="Cancelados" />
    </Tabs>
  );
}

export default function TabsPage() {
  return (
    <ExamplePage intro="Abas organizam conteúdos relacionados no mesmo lugar, mostrando um de cada vez.">
      <Example
        title="Básicas"
        code={`<Tabs value={aba} onChange={(_, v) => setAba(v)}>
  <Tab label="Dados pessoais" />
  <Tab label="Histórico" disabled />
</Tabs>`}
      >
        <BasicDemo />
      </Example>

      <Example title="Centralizadas e cor secundária" code={`<Tabs centered textColor="secondary" indicatorColor="secondary">...</Tabs>`}>
        <CenteredDemo />
      </Example>

      <Example
        title="Com ícones"
        code={`<Tab icon={<Profile />} label="Perfil" />
<Tab icon={<Wallet />} iconPosition="start" label="Faturas" />
<Tab icon={<Lock />} aria-label="Segurança" />`}
      >
        <IconDemo />
      </Example>

      <Example
        title="Com rolagem"
        description="Setas aparecem quando não cabe tudo."
        code={`<Tabs variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>...</Tabs>`}
      >
        <ScrollableDemo />
      </Example>

      <Example title="Verticais" description="Bom para telas de configuração." code={`<Tabs orientation="vertical">...</Tabs>`}>
        <VerticalDemo />
      </Example>

      <Example
        title="Pílulas"
        description="Estilo de filtro, sem indicador."
        code={`<Tabs slotProps={{ indicator: { sx: { display: 'none' } } }} sx={{ '& .MuiTab-root.Mui-selected': { bgcolor: 'primary.main' } }} />`}
      >
        <PillsDemo />
      </Example>
    </ExamplePage>
  );
}
