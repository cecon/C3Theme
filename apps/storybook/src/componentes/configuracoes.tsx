import { useState } from 'react';
import { Monitor, People, Setting2 } from 'iconsax-reactjs';

import {
  SettingsAction,
  SettingsChecklist,
  SettingsGroup,
  SettingsRow,
  SettingsSelect,
  SettingsSlider,
  SettingsSwitch,
  SoftAvatar,
  notify,
  type SettingsSection
} from '@c3theme/ui';

// Configurações de exemplo no formato do Piecework (app desktop em Electron): doca de agentes e faixa.

export const SECTIONS: SettingsSection[] = [
  { id: 'geral', label: 'Geral', icon: <Setting2 size={18} /> },
  { id: 'agentes', label: 'Agentes', icon: <People size={18} /> },
  { id: 'tela', label: 'Na tela', icon: <Monitor size={18} /> }
];

const AGENTS = [
  {
    id: 'revisor',
    label: 'Revisor',
    hint: 'lê os PRs',
    avatar: (
      <SoftAvatar size="xs" tone="primary">
        RV
      </SoftAvatar>
    )
  },
  {
    id: 'testes',
    label: 'Testes',
    hint: 'roda a suíte',
    avatar: (
      <SoftAvatar size="xs" tone="success">
        TS
      </SoftAvatar>
    )
  },
  {
    id: 'docs',
    label: 'Documentação',
    avatar: (
      <SoftAvatar size="xs" tone="warning">
        DC
      </SoftAvatar>
    )
  },
  {
    id: 'deploy',
    label: 'Deploy',
    hint: 'só com aprovação',
    avatar: (
      <SoftAvatar size="xs" tone="danger">
        DP
      </SoftAvatar>
    )
  }
];

export function GeneralSettings() {
  const [theme, setTheme] = useState('system');
  const [login, setLogin] = useState(true);
  return (
    <SettingsGroup title="Geral" footnote="As mudanças valem na hora.">
      <SettingsRow label="Aparência" description="Claro, escuro ou igual ao sistema.">
        <SettingsSelect
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: 'Sistema' },
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Escuro' }
          ]}
        />
      </SettingsRow>
      <SettingsRow label="Abrir ao entrar no computador" description="O app começa minimizado na barra de menus.">
        <SettingsSwitch checked={login} onChange={setLogin} />
      </SettingsRow>
      <SettingsRow label="Pasta dos projetos" description="~/Projetos">
        <SettingsAction onClick={() => notify('Escolher pasta…', 'info')}>Escolher pasta…</SettingsAction>
      </SettingsRow>
    </SettingsGroup>
  );
}

export function DockSettings({ initialOn = true }: { initialOn?: boolean }) {
  const [on, setOn] = useState(initialOn);
  const [side, setSide] = useState('right');
  const [width, setWidth] = useState(480);
  const [names, setNames] = useState(true);
  const [agents, setAgents] = useState(['revisor', 'testes']);
  return (
    <SettingsGroup title="Doca de agentes" dependentsDisabled={!on}>
      <SettingsRow label="Mostrar a doca" description="Barra lateral com os agentes que estão trabalhando.">
        <SettingsSwitch checked={on} onChange={setOn} />
      </SettingsRow>
      <SettingsRow label="Lado da tela" description="Onde a doca fica presa." dependent>
        <SettingsSelect
          value={side}
          onChange={setSide}
          minWidth={130}
          options={[
            { value: 'left', label: 'Esquerda' },
            { value: 'right', label: 'Direita' }
          ]}
        />
      </SettingsRow>
      <SettingsRow label="Largura" description="Espaço que a doca ocupa aberta." dependent>
        <SettingsSlider value={width} onChange={setWidth} min={320} max={720} step={20} unit="pt" />
      </SettingsRow>
      <SettingsRow label="Nome embaixo do avatar" dependent>
        <SettingsSwitch checked={names} onChange={setNames} />
      </SettingsRow>
      <SettingsChecklist
        label="Agentes na doca"
        description="Os outros continuam no menu Agentes."
        dependent
        items={AGENTS}
        value={agents}
        onChange={setAgents}
      />
    </SettingsGroup>
  );
}

export function BarSettings() {
  const [on, setOn] = useState(true);
  const [opacity, setOpacity] = useState(85);
  const [top, setTop] = useState(true);
  return (
    <SettingsGroup title="Faixa de progresso" dependentsDisabled={!on}>
      <SettingsRow label="Mostrar a faixa" description="Faixa fina no topo da tela com o andamento das tarefas.">
        <SettingsSwitch checked={on} onChange={setOn} />
      </SettingsRow>
      <SettingsRow label="Opacidade" dependent>
        <SettingsSlider value={opacity} onChange={setOpacity} min={30} max={100} step={5} unit="%" />
      </SettingsRow>
      <SettingsRow label="Sempre por cima" description="Fica acima das outras janelas, mesmo em tela cheia." dependent>
        <SettingsSwitch checked={top} onChange={setTop} />
      </SettingsRow>
      <SettingsRow label="Posição" description="Volta a faixa para o centro do topo." dependent>
        <SettingsAction onClick={() => notify('Posição restaurada.', 'success')}>Restaurar</SettingsAction>
      </SettingsRow>
    </SettingsGroup>
  );
}

/** Conteúdo da seção aberta. */
export function SectionContent({ section }: { section: string }) {
  if (section === 'agentes') return <DockSettings />;
  if (section === 'tela') return <BarSettings />;
  return <GeneralSettings />;
}
