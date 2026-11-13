// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import ServerRail from '../ServerRail';
import type { ServerRailItem } from './types';
const servers: ServerRailItem[] = [
  { id: 's1', name: 'Matriz', state: 'online' },
  { id: 'local', name: 'Este computador', state: 'online' },
  { id: 's2', name: 'Filial', state: 'offline' }
];
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it('opção única de adicionar informa o ID declarado ao app', () => {
  const onAdd = vi.fn();
  render(<ServerRail servers={servers} onSelect={vi.fn()} onAdd={onAdd} addOptions={[{ id: 'remote', label: 'Servidor remoto' }]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar servidor' }));
  expect(onAdd).toHaveBeenCalledWith('remote');
});
it('servidor local ocultado pode ser reexibido sem duplicar seus dados em outra prop', async () => {
  render(<ServerRail servers={servers} localServerId="local" onSelect={vi.fn()} onAdd={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ações do servidor: Este computador' }));
  fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: 'Ocultar Este computador' }));
  expect(screen.queryByRole('button', { name: 'Este computador (online)' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar servidor' }));
  expect(screen.getByRole('menuitem', { name: 'Reexibir Este computador' })).toBeTruthy();
});
it('o servidor local não é arrastável', () => {
  render(<ServerRail servers={servers} localServerId="local" onSelect={vi.fn()} />);
  const button = screen.getByRole('button', { name: 'Este computador (online)' });
  expect(button.closest('[draggable="true"]')).toBeNull();
});
it('mover remoto pelo menu conserva a posição do servidor local', async () => {
  const onReorder = vi.fn();
  render(<ServerRail servers={servers} localServerId="local" onSelect={vi.fn()} onReorder={onReorder} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ações do servidor: Matriz' }));
  fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: 'Mover para baixo' }));
  expect(onReorder).toHaveBeenCalledWith(['s2', 'local', 's1']);
});
it('arrastar um servidor remoto sobre outro reordena e anuncia a nova posição', () => {
  const onReorder = vi.fn();
  const onAnnounce = vi.fn();
  render(<ServerRail servers={servers} localServerId="local" onSelect={vi.fn()} onReorder={onReorder} onAnnounce={onAnnounce} />);
  const origem = screen.getByRole('button', { name: 'Matriz (online)' }).closest('[draggable="true"]')!;
  const destino = screen.getByRole('button', { name: 'Filial (offline)' }).closest('[draggable="true"]')!.parentElement!;
  fireEvent.dragStart(origem);
  fireEvent.dragOver(destino);
  fireEvent.drop(destino);
  expect(onReorder).toHaveBeenCalledWith(['s2', 'local', 's1']);
  expect(onAnnounce).toHaveBeenCalledWith('Servidor movido para a posição 3 de 3.');
});
