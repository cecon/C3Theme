import { useSearchParams } from 'react-router';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Lock, Profile as ProfileIcon, Setting2, Profile2User, UserEdit, UserOctagon } from 'iconsax-reactjs';
import { Panel } from '@c3theme/ui';
import TeamTab from './Equipe';
import { PasswordForm, PersonalForm } from './forms';
import { ProfileOverview } from './conta/ProfileOverview';
import { AccountTab } from './conta/AccountTab';
import { SettingsTab } from './conta/SettingsTab';

type TabKey = 'perfil' | 'dados' | 'conta' | 'senha' | 'papeis' | 'configuracoes';
const TABS: { key: TabKey; label: string; icon: typeof ProfileIcon }[] = [
  { key: 'perfil', label: 'Perfil', icon: ProfileIcon },
  { key: 'dados', label: 'Dados pessoais', icon: UserEdit },
  { key: 'conta', label: 'Minha conta', icon: UserOctagon },
  { key: 'senha', label: 'Senha', icon: Lock },
  { key: 'papeis', label: 'Papéis', icon: Profile2User },
  { key: 'configuracoes', label: 'Configurações', icon: Setting2 }
];

// ---------------------------------------------------------------- perfil (resumo)

export default function AccountSettingsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('aba');
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : 'perfil';
  const setTab = (t: TabKey) => setParams(t === 'perfil' ? {} : { aba: t }, { replace: true });

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ borderRadius: 3, px: 1 }}>
        <Tabs value={tab} onChange={(_, v: TabKey) => setTab(v)} variant="scrollable" allowScrollButtonsMobile aria-label="Seções da conta">
          {TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} icon={<t.icon size={18} />} iconPosition="start" sx={{ minHeight: 56 }} />
          ))}
        </Tabs>
      </Paper>
      {tab === 'perfil' && <ProfileOverview onEdit={() => setTab('dados')} />}
      {tab === 'dados' && (
        <Panel title="Dados pessoais" subtitle="Usados nos documentos e no seu perfil.">
          <PersonalForm />
        </Panel>
      )}
      {tab === 'conta' && <AccountTab />}
      {tab === 'senha' && (
        <Panel title="Trocar senha" subtitle="Depois da troca, as outras sessões continuam ativas até você encerrá-las em Minha conta.">
          <PasswordForm />
        </Panel>
      )}
      {tab === 'papeis' && <TeamTab />}
      {tab === 'configuracoes' && <SettingsTab />}
    </Stack>
  );
}
