// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CatalogItem } from './catalog';
import CatalogDetail from './CatalogDetail';
import CatalogGrid from './CatalogGrid';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const wrap = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

const base = { summary: 'Resumo', version: '1.0.0' };
const items: CatalogItem[] = [
  { ...base, id: 'a', kind: 'agent', name: 'Atendente', status: { state: 'available' }, category: 'Vendas' },
  { ...base, id: 'b', kind: 'skill', name: 'Ler PDF', status: { state: 'update-available', version: '2.0.0' } },
  { ...base, id: 'c', kind: 'app', name: 'WhatsApp', status: { state: 'installed' }, category: 'Mensagens' },
  { ...base, id: 'd', kind: 'skill', name: 'Planilhas', status: { state: 'installing', progress: 40 } }
];

const card = (name: string) => screen.getByRole('article', { name });

describe('CatalogGrid', () => {
  it('cada estado pede a sua ação e chama o callback com o item', () => {
    const onInstall = vi.fn();
    const onUpdate = vi.fn();
    const onOpen = vi.fn();
    wrap(<CatalogGrid items={items} actions={{ onInstall, onUpdate, onOpen }} />);
    fireEvent.click(within(card('Atendente')).getByRole('button', { name: 'Instalar Atendente' }));
    fireEvent.click(within(card('Ler PDF')).getByRole('button', { name: 'Atualizar Ler PDF' }));
    fireEvent.click(within(card('WhatsApp')).getByRole('button', { name: 'Abrir WhatsApp' }));
    expect(onInstall).toHaveBeenCalledWith(items[0]);
    expect(onUpdate).toHaveBeenCalledWith(items[1]);
    expect(onOpen).toHaveBeenCalledWith(items[2]);
    expect(within(card('Planilhas')).getByRole('button', { name: 'Instalando… 40%' })).toHaveProperty('disabled', true);
    expect(within(card('Planilhas')).getByRole('progressbar', { name: 'Instalação de Planilhas' })).toBeTruthy();
    expect(within(card('Ler PDF')).getByText('Versão 2.0.0 disponível')).toBeTruthy();
  });

  it('ações por tipo: agente se contrata de novo, habilidade instalada sem Abrir, app que só abre', () => {
    const onHire = vi.fn();
    const onOpen = vi.fn();
    const list: CatalogItem[] = [
      { ...base, id: 'a', kind: 'agent', name: 'Atendente', status: { state: 'available' }, actionLabel: 'Contratar outro' },
      { ...base, id: 's', kind: 'skill', name: 'Ler PDF', status: { state: 'installed' } },
      { ...base, id: 'w', kind: 'app', name: 'WhatsApp', status: { state: 'available' } }
    ];
    wrap(<CatalogGrid items={list} actions={{ agent: { onInstall: onHire }, skill: { onRemove: vi.fn() }, app: { onOpen } }} />);
    const hire = within(card('Atendente')).getByRole('button', { name: 'Contratar outro Atendente' });
    expect(hire.textContent).toBe('Contratar outro');
    fireEvent.click(hire);
    expect(onHire).toHaveBeenCalledWith(list[0]);
    // instalada, a habilidade não tem onOpen no seu tipo: nenhum botão (nem espaço de foco vazio)
    expect(within(card('Ler PDF')).queryAllByRole('button')).toHaveLength(0);
    // o app disponível pede Instalar, mas o tipo dele só tem onOpen: sem botão
    expect(within(card('WhatsApp')).queryAllByRole('button')).toHaveLength(0);
  });

  it('com objeto por tipo, os callbacks soltos são ignorados; tipo ausente fica sem ação', () => {
    const loose = vi.fn();
    wrap(<CatalogGrid items={items.slice(0, 1)} actions={{ onInstall: loose, skill: {} }} />);
    expect(within(card('Atendente')).queryAllByRole('button')).toHaveLength(0);
  });

  it('filtra por tipo e pela busca, e mostra o vazio quando nada casa', () => {
    wrap(<CatalogGrid items={items} />);
    fireEvent.click(screen.getByRole('button', { name: /Habilidades/ }));
    expect(screen.getAllByRole('article').map((a) => a.getAttribute('aria-label'))).toEqual(['Ler PDF', 'Planilhas']);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar' }), { target: { value: 'planilha' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar' }), { target: { value: 'zzz' } });
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByText('Nada encontrado')).toBeTruthy();
  });

  it('agrupa por categoria com "Outros" no fim', () => {
    wrap(<CatalogGrid items={items} groupByCategory />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Vendas', 'Mensagens', 'Outros']);
  });
});

describe('CatalogDetail', () => {
  it('avisa dos arquivos editados que ganham ".nova" e oferece remover o instalado', () => {
    const onRemove = vi.fn();
    const item: CatalogItem = {
      ...items[1]!,
      editedFiles: ['skills/ler-pdf/SKILL.md'],
      permissions: ['Ler arquivos da pasta do projeto'],
      versions: [{ version: '2.0.0' }, { version: '1.0.0' }]
    };
    wrap(<CatalogDetail item={item} onClose={() => {}} actions={{ onRemove }} />);
    const dialog = screen.getByRole('dialog', { name: 'Ler PDF' });
    expect(within(dialog).getByText(/Você editou um arquivo/)).toBeTruthy();
    expect(within(dialog).getByText('skills/ler-pdf/SKILL.md')).toBeTruthy();
    expect(within(dialog).getByText(/instalada/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remover' }));
    expect(onRemove).toHaveBeenCalledWith(item);
  });

  it('remover por tipo: só aparece no tipo que tem onRemove', () => {
    const onRemove = vi.fn();
    const app: CatalogItem = items[2]!;
    wrap(<CatalogDetail item={app} onClose={() => {}} actions={{ skill: { onRemove }, app: { onOpen: vi.fn() } }} />);
    const dialog = screen.getByRole('dialog', { name: 'WhatsApp' });
    expect(within(dialog).queryByRole('button', { name: 'Remover' })).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Abrir WhatsApp' })).toBeTruthy();
  });
});
