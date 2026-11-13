// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SettingsDialog, { type SettingsDialogProps } from './SettingsDialog';
import type { SettingsSearchEntry } from './search';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });

const ENTRIES: SettingsSearchEntry[] = [
  {
    id: 'notificacoes',
    title: 'Notificações',
    section: 'notificacoes',
    where: 'Notificações',
    description: 'Avisos de tarefas e mensagens.'
  },
  {
    id: 'som',
    title: 'Som das notificações',
    section: 'notificacoes',
    where: 'Notificações',
    description: 'Toca um som quando chega uma mensagem.'
  },
  { id: 'idioma', title: 'Idioma', section: 'voz', where: 'Voz', description: 'Idioma da transcrição.' }
];

const SECTIONS = [
  { id: 'geral', label: 'Geral', description: 'Resumo do app' },
  { id: 'notificacoes', label: 'Notificações', description: 'Avisos e som' },
  { id: 'voz', label: 'Voz', description: 'Microfone e idioma' }
];

/** O diálogo controlado por um botão, para conferir a entrada e o retorno do foco. */
function Harness(props: Partial<SettingsDialogProps> = {}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('geral');
  const [query, setQuery] = useState('');
  const [escolhido, setEscolhido] = useState('');
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir configurações</button>
      <button onClick={() => setOpen(true)}>Outro botão</button>
      <span data-testid="escolhido">{escolhido}</span>
      <SettingsDialog
        open={open}
        title="Configurações"
        description="Ajustes deste app."
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        section={section}
        onSectionChange={setSection}
        search={{
          entries: ENTRIES,
          value: query,
          onChange: setQuery,
          onPick: (hit) => {
            setEscolhido(`${hit.section}:${hit.id}`);
            setSection(hit.section);
            setQuery('');
          }
        }}
        {...props}
      >
        <div>conteúdo de {section}</div>
      </SettingsDialog>
    </>
  );
}

function wrap(ui: React.ReactNode) {
  return render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );
}

describe('moldura do modal de configurações', () => {
  it('abre como diálogo rotulado, com a descrição associada e o foco na busca', async () => {
    wrap(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir configurações' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const label = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '');
    expect(label?.textContent).toBe('Configurações');
    const description = document.getElementById(dialog.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toBe('Ajustes deste app.');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('combobox')));
  });

  it('o fundo fica inerte: a casca atrás do diálogo sai da árvore de acessibilidade', async () => {
    wrap(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir configurações' }));
    const dialog = await screen.findByRole('dialog');
    expect(screen.queryByRole('button', { name: 'Abrir configurações' })).toBeNull();
    const casca = screen.getByRole('button', { name: 'Abrir configurações', hidden: true }).closest('[aria-hidden="true"]');
    expect(casca).not.toBeNull();
    expect(dialog.contains(casca!)).toBe(false);
  });

  it('o Tab circula dentro do diálogo', async () => {
    wrap(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir configurações' }));
    await screen.findByRole('dialog');
    const dialog = screen.getByRole('dialog');
    const focaveis = dialog.querySelectorAll<HTMLElement>('button, input');
    const primeiro = focaveis[0]!;
    const ultimo = focaveis[focaveis.length - 1]!;
    primeiro.focus();
    fireEvent.keyDown(primeiro, { key: 'Tab', shiftKey: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
    ultimo.focus();
    fireEvent.keyDown(ultimo, { key: 'Tab' });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('Escape limpa a busca antes de fechar e fecha na segunda vez', async () => {
    wrap(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir configurações' }));
    const search = await screen.findByRole('combobox');
    fireEvent.change(search, { target: { value: 'notificacoes' } });
    expect(search).toHaveProperty('value', 'notificacoes');
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(search).toHaveProperty('value', '');
    expect(screen.queryByRole('dialog')).not.toBeNull();
    fireEvent.keyDown(search, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('ao fechar, o foco volta ao botão que abriu', async () => {
    wrap(<Harness />);
    const abrir = screen.getByRole('button', { name: 'Abrir configurações' });
    abrir.focus();
    fireEvent.click(abrir);
    const search = await screen.findByRole('combobox');
    fireEvent.keyDown(search, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(abrir);
  });

  it('o botão de fechar e o clique no fundo respeitam a política', async () => {
    const onClose = vi.fn();
    wrap(<Harness open onClose={onClose} closeOnBackdrop={false} />);
    const dialog = await screen.findByRole('dialog');
    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('com alterações pendentes, o fechamento pede confirmação', async () => {
    const onClose = vi.fn();
    wrap(<Harness open onClose={onClose} pendingChanges />);
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(within(dialog).getByText('Descartar alterações?')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar editando' }));
    expect(within(dialog).getByText('Configurações')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Descartar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a busca filtra, conta, abre o primeiro com Enter e mostra o vazio', async () => {
    wrap(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir configurações' }));
    const search = await screen.findByRole('combobox');
    fireEvent.change(search, { target: { value: 'notificacoes' } });
    expect(screen.getByText('2 resultados')).toBeTruthy();
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['NotificaçõesNotificações', 'Som das notificaçõesNotificações']);
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(screen.getByTestId('escolhido').textContent).toBe('notificacoes:notificacoes');
    expect(search).toHaveProperty('value', '');
    fireEvent.change(search, { target: { value: 'inexistente' } });
    expect(screen.getByText('Nenhuma configuração encontrada.')).toBeTruthy();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('os estados de carregando, erro e sem permissão ficam no painel', async () => {
    const onRetry = vi.fn();
    const { rerender } = wrap(<Harness open status="carregando" />);
    expect(await screen.findByText('Carregando configurações…')).toBeTruthy();
    rerender(
      <ThemeProvider theme={theme}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <Harness open status="erro" onRetry={onRetry} />
        </IntlProvider>
      </ThemeProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(
      <ThemeProvider theme={theme}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <Harness open status="sem-permissao" />
        </IntlProvider>
      </ThemeProvider>
    );
    expect(screen.getByText('Você não tem permissão para ver esta seção.')).toBeTruthy();
  });

  it('salvando e salvo aparecem no rodapé, junto da versão', async () => {
    wrap(<Harness open saving version="1.2.3" />);
    expect(await screen.findByText('Salvando…')).toBeTruthy();
    expect(screen.getByText('Versão 1.2.3')).toBeTruthy();
    cleanup();
    wrap(<Harness open saved />);
    expect(await screen.findByText('Salvo')).toBeTruthy();
  });

  it('a navegação lateral mostra a seção aberta e troca pelo teclado', async () => {
    wrap(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir configurações' }));
    await screen.findByRole('dialog');
    const geral = screen.getByRole('button', { name: /Geral/ });
    expect(geral.getAttribute('aria-current')).toBe('page');
    const notificacoes = screen.getByRole('button', { name: /Notificações/ });
    notificacoes.focus();
    fireEvent.keyDown(notificacoes, { key: 'Enter' });
    fireEvent.click(notificacoes);
    expect(notificacoes.getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('conteúdo de notificacoes')).toBeTruthy();
  });
});
