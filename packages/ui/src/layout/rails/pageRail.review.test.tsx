// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import PageRail from '../PageRail';
import { useRailPreferences } from './useRailPreferences';
import { pageRailActive } from './pageRailActive';
import type { RailPreferences } from './preferences';
const pages = [
  { id: '/agents', title: 'Agentes', url: '/agents' },
  { id: '/usage', title: 'Uso', url: '/usage' }
];
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it('primeira página sempre está fixada mesmo sem fixed/homePath/defaultPinned; atual no mais tem aria-current', () => {
  render(
    <MemoryRouter>
      <PageRail pages={pages} activePath="/usage" />
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: 'Agentes' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Mais páginas/ }).getAttribute('aria-current')).toBe('page');
  fireEvent.click(screen.getByRole('button', { name: /Mais páginas/ }));
  expect(screen.queryByRole('menuitemcheckbox', { name: /Desafixar Agentes/ })).toBeNull();
  fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Fixar Uso no rail' }));
  expect(screen.getByRole('menuitemcheckbox', { name: 'Desafixar Uso' })).toBeTruthy();
});
it('estado recolhido mantém largura suficiente para os ícones e restaura ao reabrir', () => {
  const mount = () =>
    render(
      <MemoryRouter>
        <PageRail pages={pages} storageKey="p" />
      </MemoryRouter>
    );
  const first = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Recolher o rail' }));
  expect(Number.parseFloat(getComputedStyle(screen.getByRole('navigation')).width)).toBeGreaterThanOrEqual(44);
  first.unmount();
  mount();
  expect(screen.getByRole('button', { name: 'Expandir o rail' })).toBeTruthy();
});
it('mudar chave não mistura fixação nem recolhimento entre contas/apps', () => {
  localStorage.setItem('b', JSON.stringify({ pinnedPages: ['/usage'], pagesCollapsed: false }));
  const ui = (key: string) => (
    <MemoryRouter>
      <PageRail pages={pages} storageKey={key} />
    </MemoryRouter>
  );
  const view = render(ui('a'));
  fireEvent.click(screen.getByRole('button', { name: 'Recolher o rail' }));
  view.rerender(ui('b'));
  expect(screen.getByRole('button', { name: 'Recolher o rail' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Uso' })).toBeTruthy();
  expect(JSON.parse(localStorage.getItem('a')!).pagesCollapsed).toBe(true);
});
it('dois rails com a mesma chave fazem patch parcial e acompanham alterações do outro', () => {
  let pagesPatch!: (patch: Partial<RailPreferences>) => void;
  let serversPatch!: (patch: Partial<RailPreferences>) => void;
  const seen: RailPreferences[] = [];
  function Pages() {
    const [prefs, patch] = useRailPreferences('shared');
    pagesPatch = patch;
    seen.push(prefs);
    return null;
  }
  function Servers() {
    const [, patch] = useRailPreferences('shared');
    serversPatch = patch;
    return null;
  }
  render(
    <>
      <Pages />
      <Servers />
    </>
  );
  act(() => pagesPatch({ pinnedPages: ['/usage'], pagesCollapsed: true }));
  act(() => serversPatch({ serverOrder: ['remote', 'local'] }));
  const saved = JSON.parse(localStorage.getItem('shared')!);
  expect(saved).toMatchObject({ serverOrder: ['remote', 'local'], pinnedPages: ['/usage'], pagesCollapsed: true });
  expect(seen.at(-1)).toMatchObject(saved);
  act(() => pagesPatch({ pagesCollapsed: false }));
  expect(JSON.parse(localStorage.getItem('shared')!).serverOrder).toEqual(['remote', 'local']);
});
it('ajuda atualiza notas sem fechar e erro de carregamento deixa os links abertos', () => {
  const ui = (loadingNotes: boolean, releaseNotes?: string) => (
    <MemoryRouter>
      <PageRail
        pages={pages}
        help={{ version: '1', loadingNotes, releaseNotes, links: [{ label: 'Guia', href: 'https://example.org' }] }}
      />
    </MemoryRouter>
  );
  const view = render(ui(true));
  fireEvent.click(screen.getByRole('button', { name: /Ajuda e versão/ }));
  expect(screen.getByText('Carregando notas…')).toBeTruthy();
  view.rerender(ui(false, 'Novidades prontas'));
  expect(screen.getByText('Novidades prontas')).toBeTruthy();
  view.rerender(ui(false));
  expect(screen.getByRole('menuitem', { name: 'Guia' }).getAttribute('target')).toBe('_blank');
});
it('detalhes e filtros continuam marcando a página correta', () => {
  expect(pageRailActive(pages, '/agents/123')).toBe('/agents');
  expect(pageRailActive(pages, '/absent')).toBeUndefined();
  expect(pageRailActive(pages)).toBeUndefined();
  const variants = [...pages, { id: 'filtered', title: 'Filtro', url: '/usage?period=month' }];
  expect(pageRailActive(variants, '/usage?period=month')).toBe('filtered');
  expect(pageRailActive(variants, '/usage?period=week')).toBe('/usage');
});
it('armazenamento indisponível conserva patches dos dois rails durante a sessão', () => {
  const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  let one!: (patch: Partial<RailPreferences>) => void;
  let two!: (patch: Partial<RailPreferences>) => void;
  let current!: RailPreferences;
  function A() {
    const [prefs, patch] = useRailPreferences('quota');
    current = prefs;
    one = patch;
    return null;
  }
  function B() {
    const [, patch] = useRailPreferences('quota');
    two = patch;
    return null;
  }
  render(
    <>
      <A />
      <B />
    </>
  );
  act(() => one({ pagesCollapsed: true }));
  act(() => two({ serverOrder: ['remote'] }));
  expect(current).toMatchObject({ pagesCollapsed: true, serverOrder: ['remote'] });
  blocked.mockRestore();
});
