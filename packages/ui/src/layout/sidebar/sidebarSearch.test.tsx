// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import C3ThemeProvider from '../../C3ThemeProvider';
import SectionSidebar from '../SectionSidebar';
import { readPreferences } from './preferences';
import { filterItems } from './search';
import type { SectionSidebarProps, SidebarItem } from './types';

const items: SidebarItem[] = [
  { id: 'claude', label: 'Claude', section: 'team', status: 'Trabalhando', avatar: { label: 'Claude Code', color: '#1d4ed8' } },
  { id: 'clara', label: 'Clara', section: 'people', status: 'Ausente', avatar: { label: 'Clara', color: '#fde68a' } },
  { id: 'joao', label: 'João', section: 'people', status: 'Revisão de código', mark: <i>J</i> }
];
const data: SectionSidebarProps = {
  storageKey: 'busca',
  label: 'Conversas',
  title: 'Agentes',
  sections: [
    { id: 'team', label: 'Time' },
    { id: 'people', label: 'Pessoas' }
  ],
  items,
  onSelect: vi.fn(),
  search: { label: 'Buscar agentes', placeholder: 'Buscar' }
};
const show = (props: Partial<SectionSidebarProps> = {}) =>
  render(
    <C3ThemeProvider>
      <SectionSidebar {...data} {...props} />
    </C3ThemeProvider>
  );
const type = (q: string) => fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar agentes' }), { target: { value: q } });
beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('filterItems (#135)', () => {
  it('casa nome ou resumo sem acento e sem caixa; vazio devolve tudo', () => {
    expect(filterItems(items, 'cla').map((i) => i.id)).toEqual(['claude', 'clara']);
    expect(filterItems(items, 'JOAO').map((i) => i.id)).toEqual(['joao']);
    expect(filterItems(items, 'codigo').map((i) => i.id)).toEqual(['joao']);
    expect(filterItems(items, '  ')).toBe(items);
    expect(filterItems(items, 'xyz')).toEqual([]);
  });
});

describe('busca na lista lateral (#135)', () => {
  it('"cla" mostra só quem casa, esconde a seção sem achado e anuncia o resultado', () => {
    show();
    type('cla');
    expect(screen.getByRole('group', { name: 'Claude' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Clara' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'João' })).toBeNull();
    expect(screen.getByRole('button', { name: /Pessoas \(1\)/ })).toBeTruthy();
    expect(screen.getByText('2 itens encontrados')).toBeTruthy();
    type('ausente');
    expect(screen.queryByRole('button', { name: /Time/ })).toBeNull();
    expect(screen.queryByText('Seção vazia')).toBeNull();
  });

  it('sem achado mostra o vazio próprio; Escape limpa e devolve a lista', () => {
    show({ search: { label: 'Buscar agentes', empty: 'Ninguém com esse nome.' } });
    type('zzz');
    expect(screen.getByText('Ninguém com esse nome.')).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('group', { name: 'João' })).toBeTruthy();
    expect(screen.getByText('Busca limpa')).toBeTruthy();
  });

  it('sem texto próprio, o vazio diz o que foi buscado; Escape com campo vazio não faz nada', () => {
    show({ search: { label: 'Buscar agentes' } });
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
    expect(screen.queryByText('Busca limpa')).toBeNull();
    type(' nada ');
    expect(screen.getByText('Nada encontrado para "nada".')).toBeTruthy();
  });

  it('fixar durante a busca vale para a lista inteira; fixado fora do filtro não aparece', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Fixar João' }));
    type('cla');
    expect(screen.queryByText('Fixados')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Fixar Clara' }));
    expect(screen.getByText('Fixados')).toBeTruthy();
    expect(readPreferences('busca').pinned).toEqual(['joao', 'clara']);
    fireEvent.click(screen.getByRole('button', { name: /^▾ Pessoas/ }));
    expect(readPreferences('busca').collapsed).toEqual(['people']);
  });

  it('sem `search`, não há campo', () => {
    show({ search: undefined });
    expect(screen.queryByRole('searchbox')).toBeNull();
  });
});

describe('avatar do item (#135)', () => {
  it('desenha iniciais sobre a cor, com texto pelo contraste; sem avatar, fica o ícone', () => {
    show();
    const claude = screen.getByRole('group', { name: 'Claude' });
    const dark = claude.querySelector('.MuiAvatar-root') as HTMLElement;
    expect(dark.textContent).toBe('CC');
    expect(dark.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(dark).backgroundColor).toBe('rgb(29, 78, 216)');
    expect(getComputedStyle(dark).color).toBe('rgb(255, 255, 255)');
    const light = screen.getByRole('group', { name: 'Clara' }).querySelector('.MuiAvatar-root') as HTMLElement;
    expect(light.textContent).toBe('C');
    expect(getComputedStyle(light).color).not.toBe('rgb(255, 255, 255)');
    const joao = screen.getByRole('group', { name: 'João' });
    expect(joao.querySelector('.MuiAvatar-root')).toBeNull();
    expect(joao.querySelector('i')?.textContent).toBe('J');
  });

  it('cor fora do formato hex cai na cor neutra do tema', () => {
    show({ items: [{ id: 'x', label: 'Xis', section: 'team', avatar: { label: 'Xis', color: 'red; background: url(x)' } }] });
    const avatar = screen.getByRole('group', { name: 'Xis' }).querySelector('.MuiAvatar-root') as HTMLElement;
    expect(avatar.textContent).toBe('X');
    expect(avatar.getAttribute('style') ?? '').not.toContain('url');
  });
});
