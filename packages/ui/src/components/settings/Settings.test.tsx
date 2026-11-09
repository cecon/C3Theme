// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsChecklist, SettingsGroup, SettingsPanel, SettingsRow, SettingsSelect, SettingsSlider, SettingsSwitch } from '.';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const wrap = (ui: React.ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

function Dock({ onWidth = vi.fn() }: { onWidth?: (v: number) => void }) {
  const [on, setOn] = useState(true);
  const [agents, setAgents] = useState(['ana']);
  return (
    <SettingsGroup title="Doca de agentes" dependentsDisabled={!on}>
      <SettingsRow label="Mostrar a doca" description="Barra com os agentes na borda da tela.">
        <SettingsSwitch checked={on} onChange={setOn} />
      </SettingsRow>
      <SettingsRow label="Largura" description="Espaço que a doca ocupa." dependent>
        <SettingsSlider value={480} min={320} max={720} unit="pt" onChange={onWidth} />
      </SettingsRow>
      <SettingsChecklist
        label="Agentes na doca"
        dependent
        items={[
          { id: 'ana', label: 'Ana' },
          { id: 'bia', label: 'Bia', hint: 'revisa', avatar: <span>BI</span> }
        ]}
        value={agents}
        onChange={setAgents}
      />
    </SettingsGroup>
  );
}

describe('Settings', () => {
  it('o switch tem role switch e fica ligado ao rótulo e à explicação', () => {
    wrap(<Dock />);
    const sw = screen.getByRole('switch', { name: 'Mostrar a doca' });
    expect(sw).toHaveProperty('checked', true);
    const desc = document.getElementById(sw.getAttribute('aria-describedby') ?? '');
    expect(desc?.textContent).toBe('Barra com os agentes na borda da tela.');
  });

  it('o slider mostra valor com unidade e o leitor de tela ouve o mesmo texto', () => {
    wrap(<Dock />);
    const slider = screen.getByRole('slider', { name: 'Largura' });
    expect(slider.getAttribute('aria-valuetext')).toBe('480 pt');
    expect(screen.getByText('480 pt')).toBeTruthy();
  });

  it('desligar o switch principal desabilita as linhas dependentes, que continuam visíveis', () => {
    wrap(<Dock />);
    fireEvent.click(screen.getByRole('switch', { name: 'Mostrar a doca' }));
    expect(screen.getByRole('slider', { name: 'Largura' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('checkbox', { name: 'Ana' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('group', { name: 'Agentes na doca' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('a lista múltipla marca e desmarca itens; o nome é só o rótulo e a dica vira descrição', () => {
    wrap(<Dock />);
    const hint = screen.getByRole('checkbox', { name: 'Bia' }).getAttribute('aria-describedby');
    expect(document.getElementById(hint ?? '')?.textContent).toBe('revisa');
    const bia = screen.getByRole('checkbox', { name: 'Bia' });
    fireEvent.click(bia);
    expect(bia).toHaveProperty('checked', true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Ana' }));
    expect(screen.getByRole('checkbox', { name: 'Ana' })).toHaveProperty('checked', false);
  });

  it('o select usa o rótulo da linha como nome', () => {
    wrap(
      <SettingsGroup>
        <SettingsRow label="Tema">
          <SettingsSelect value="auto" options={[{ value: 'auto', label: 'Automático' }]} onChange={vi.fn()} />
        </SettingsRow>
      </SettingsGroup>
    );
    expect(screen.getByRole('combobox', { name: /Tema/ })).toBeTruthy();
  });

  it('com duas seções ou mais mostra a navegação e marca a seção aberta', () => {
    const onSection = vi.fn();
    wrap(
      <SettingsPanel
        variant="window"
        title="Configurações"
        sections={[
          { id: 'geral', label: 'Geral' },
          { id: 'agentes', label: 'Agentes' }
        ]}
        section="agentes"
        onSectionChange={onSection}
        onClose={vi.fn()}
      >
        <div />
      </SettingsPanel>
    );
    const nav = screen.getByRole('navigation', { name: 'Seções das configurações' });
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe('Agentes');
    fireEvent.click(screen.getByRole('button', { name: 'Geral' }));
    expect(onSection).toHaveBeenCalledWith('geral');
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeTruthy();
  });

  it('com uma seção só não mostra navegação', () => {
    wrap(
      <SettingsPanel variant="window" title="Configurações" sections={[{ id: 'geral', label: 'Geral' }]}>
        <div />
      </SettingsPanel>
    );
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Fechar' })).toBeNull();
  });
});
