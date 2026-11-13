// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../api';
import { EngineProvider, type EngineState } from '../context';
import SettingsLauncher from './SettingsLauncher';
import SettingsModal from './SettingsModal';
import type { SettingsData, SettingsPort } from './port';
import type { AppDef } from '../types';
import type { AppSettingsDef, SettingsRowDef } from '../settingsTypes';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });

function linha(id: string, title: string, extra: Partial<SettingsRowDef> = {}): SettingsRowDef {
  return { id, title, description: `${title}: explicação`, control: { type: 'switch', value: false }, ...extra };
}

const PESSOAL: AppSettingsDef = {
  title: 'Configurações',
  search: 'Pesquisar configurações…',
  confirmPending: true,
  sections: [
    { id: 'geral', title: 'Geral', rows: [linha('iniciar', 'Abrir ao iniciar')] },
    { id: 'agentes', title: 'Agentes', rows: [linha('padrao', 'Agente padrão')] },
    { id: 'perfil', title: 'Perfil', rows: [linha('nome', 'Nome')] },
    {
      id: 'notificacoes',
      title: 'Notificações',
      rows: [linha('som', 'Som das notificações', { description: 'Toca um som quando chega uma mensagem.' })]
    },
    { id: 'voz', title: 'Voz', rows: [linha('idioma', 'Idioma da transcrição', { keywords: ['microfone'] })] },
    { id: 'ilha', title: 'Ilha dinâmica', rows: [linha('mostrar', 'Mostrar a ilha')] },
    { id: 'doca', title: 'Dock de agentes', rows: [linha('doca', 'Mostrar o dock')] },
    { id: 'computador', title: 'Uso do computador', platforms: ['desktop', 'web'], rows: [linha('acesso', 'Acesso à tela')] },
    { id: 'cobranca', title: 'Cobrança', rows: [linha('plano', 'Plano atual')] },
    { id: 'celular', title: 'Conectar celular', rows: [linha('parear', 'Parear celular')] },
    { id: 'atualizacoes', title: 'Atualizações', rows: [linha('canal', 'Canal')] },
    {
      id: 'servidores',
      title: 'Servidores hospedados',
      rows: [{ id: 'provedor', title: 'Provedor', control: { type: 'page', page: 'provedor', label: 'Abrir provedor' } }],
      pages: [{ id: 'provedor', title: 'Provedor', rows: [linha('chave', 'Chave do provedor')] }]
    }
  ],
  server: {
    title: 'Configurações do servidor',
    search: 'Pesquisar configurações do servidor…',
    sections: [
      { id: 'geral', title: 'Geral', rows: [linha('nome-servidor', 'Nome do servidor')] },
      { id: 'papel', title: 'Papéis', permission: '/servidor/papel', hideWhenDenied: false, rows: [linha('dono', 'Dono')] }
    ]
  }
};

const APP: AppDef = { name: 'App', entities: [], layout: { menu: [] }, settings: PESSOAL };

function wrap(ui: React.ReactNode, extra: Partial<EngineState> = {}) {
  const state: EngineState = {
    client: {} as C3Client,
    app: APP,
    entities: {},
    components: {},
    icons: {},
    pageAccess: {},
    platform: 'desktop',
    ...extra
  };
  return render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={state}>{ui}</EngineProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}

function portCom(dados: SettingsData = {}, extra: Partial<SettingsPort> = {}) {
  const load = vi.fn(() => Promise.resolve(dados));
  const change = vi.fn(() => Promise.resolve());
  return { port: { load, change, ...extra } satisfies SettingsPort, load, change };
}

async function abas() {
  const nav = await screen.findByRole('navigation', { name: 'Seções das configurações' });
  return within(nav).getAllByRole('button');
}

describe('modal de configurações pela spec', () => {
  it('mostra as 12 abas na ordem e esconde a condicional por plataforma', async () => {
    const { port } = portCom();
    wrap(<SettingsModal def={PESSOAL} port={port} open onClose={() => {}} />);
    expect((await abas()).map((aba) => aba.textContent)).toEqual([
      'Geral',
      'Agentes',
      'Perfil',
      'Notificações',
      'Voz',
      'Ilha dinâmica',
      'Dock de agentes',
      'Uso do computador',
      'Cobrança',
      'Conectar celular',
      'Atualizações',
      'Servidores hospedados'
    ]);
    cleanup();
    wrap(<SettingsModal def={PESSOAL} port={port} open onClose={() => {}} />, { platform: 'mobile' });
    expect((await abas()).map((aba) => aba.textContent)).not.toContain('Uso do computador');
  });

  it('abre direto na seção pedida pela política', async () => {
    const { port } = portCom();
    wrap(<SettingsModal def={PESSOAL} port={port} open section="voz" onClose={() => {}} />);
    const nav = await screen.findByRole('navigation');
    const voz = within(nav).getByRole('button', { name: /Voz/ });
    expect(voz.getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Idioma da transcrição')).toBeTruthy();
  });

  it('carrega os valores pela porta e mostra o carregando até a resposta', async () => {
    let resolver: (dados: SettingsData) => void = () => {};
    const load = vi.fn(() => new Promise<SettingsData>((resolve) => (resolver = resolve)));
    wrap(<SettingsModal def={PESSOAL} port={{ load }} open onClose={() => {}} />);
    expect(await screen.findByText('Carregando configurações…')).toBeTruthy();
    resolver({ values: { iniciar: true }, version: '2.0.0' });
    expect(await screen.findByText('Versão 2.0.0')).toBeTruthy();
    const botao = screen.getByRole('switch', { name: 'Abrir ao iniciar' });
    expect(botao).toHaveProperty('checked', true);
  });

  it('a busca abre a aba do resultado, rola, destaca e foca o controle', async () => {
    const { port } = portCom();
    wrap(<SettingsModal def={PESSOAL} port={port} open onClose={() => {}} />);
    const search = await screen.findByRole('combobox');
    fireEvent.change(search, { target: { value: 'idioma' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    const nav = await screen.findByRole('navigation');
    expect(within(nav).getByRole('button', { name: /Voz/ }).getAttribute('aria-current')).toBe('page');
    const linhaIdioma = screen.getByText('Idioma da transcrição').closest('[data-settings-row]');
    expect(linhaIdioma).not.toBeNull();
    expect(linhaIdioma?.getAttribute('data-highlighted')).toBe('true');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('switch', { name: 'Idioma da transcrição' })));
  });

  it('a subpágina mostra a trilha e o voltar devolve o foco ao botão que abriu', async () => {
    const { port } = portCom();
    wrap(<SettingsModal def={PESSOAL} port={port} open onClose={() => {}} />);
    const nav = await screen.findByRole('navigation');
    fireEvent.click(within(nav).getByRole('button', { name: /Servidores hospedados/ }));
    const abrir = screen.getByRole('button', { name: 'Abrir provedor' });
    abrir.focus();
    fireEvent.click(abrir);
    expect(await screen.findByText('Chave do provedor')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeTruthy();
    const voltar = screen.getByRole('button', { name: 'Voltar' });
    fireEvent.click(voltar);
    expect(await screen.findByRole('button', { name: 'Abrir provedor' })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir provedor' })));
  });

  it('grava a mudança pela porta e mostra salvando/salvo', async () => {
    let resolver: () => void = () => {};
    const change = vi.fn(() => new Promise<void>((resolve) => (resolver = resolve)));
    const { port } = portCom({}, { change });
    wrap(<SettingsModal def={PESSOAL} port={port} open onClose={() => {}} />);
    fireEvent.click(await screen.findByRole('switch', { name: 'Abrir ao iniciar' }));
    await waitFor(() => expect(change).toHaveBeenCalledWith({ modal: 'personal', section: 'geral', row: 'iniciar', value: true }));
    expect(screen.getByText('Salvando…')).toBeTruthy();
    resolver();
    expect(await screen.findByText('Salvo')).toBeTruthy();
  });

  it('com gravação em andamento, fechar pede confirmação', async () => {
    const change = vi.fn(() => new Promise<void>(() => {}));
    const onClose = vi.fn();
    const { port } = portCom({}, { change });
    wrap(<SettingsModal def={PESSOAL} port={port} open onClose={onClose} />);
    fireEvent.click(await screen.findByRole('switch', { name: 'Abrir ao iniciar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Descartar alterações?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('seção sem permissão aparece com o painel explicativo em vez do conteúdo', async () => {
    const { port } = portCom();
    wrap(<SettingsModal def={PESSOAL.server!} port={port} open scope="server" onClose={() => {}} />, {
      pageAccess: { '/servidor/papel': false }
    });
    const nav = await screen.findByRole('navigation');
    fireEvent.click(within(nav).getByRole('button', { name: /Papéis/ }));
    expect(await screen.findByText('Você não tem permissão para ver esta seção.')).toBeTruthy();
    expect(screen.queryByRole('switch', { name: 'Dono' })).toBeNull();
  });

  it('o botão do cabeçalho abre o modal pessoal e o rodapé abre o do servidor', async () => {
    const { port } = portCom();
    wrap(<SettingsLauncher def={PESSOAL} port={port} />);
    fireEvent.click(screen.getByRole('button', { name: 'Configurações' }));
    const pessoal = await screen.findByRole('dialog');
    expect(within(pessoal).getByText('Abrir ao iniciar')).toBeTruthy();
    fireEvent.click(within(pessoal).getByRole('button', { name: 'Configurações do servidor' }));
    const servidor = await screen.findAllByRole('dialog');
    const dialogoDoServidor = servidor.find((dialog) => within(dialog).queryByText('Nome do servidor') !== null);
    expect(dialogoDoServidor).toBeDefined();
  });

  it('sem a porta, desenha os valores da spec e não chama nada', async () => {
    const { port } = portCom();
    wrap(<SettingsModal def={PESSOAL} port={undefined} open onClose={() => {}} />);
    expect(await screen.findByRole('switch', { name: 'Abrir ao iniciar' })).toHaveProperty('checked', false);
    fireEvent.click(screen.getByRole('switch', { name: 'Abrir ao iniciar' }));
    expect(port.load).not.toHaveBeenCalled();
  });
});
