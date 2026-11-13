// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AgentDock from './AgentDock';
import AgentDockFrame from './AgentDockFrame';

afterEach(cleanup);
it.each(['top', 'bottom', 'right'] as const)('frame %s reserva Ã¡rea e limita o tamanho Ã  metade do viewport', (position) => {
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <AgentDockFrame position={position} size={120} dock={<span>Dock</span>}>
        <main>Conversa</main>
      </AgentDockFrame>
    </ThemeProvider>
  );
  const frame = document.querySelector('[data-agent-dock-frame]')!;
  const styles = getComputedStyle(frame);
  expect(styles.getPropertyValue('--c3-shell-height').replaceAll(' ', '')).toContain(position === 'right' ? '0px-0px' : 'min(120px,50dvh)');
  const area = getComputedStyle(document.querySelector('[data-agent-dock-area]')!);
  expect(area.position).toBe('fixed');
  expect(position === 'right' ? area.width : area.height.replaceAll(' ', '')).toBe(position === 'right' ? '120px' : 'min(120px,50dvh)');
});
it('UI aceita marca e traduÃ§Ãµes, anuncia cada estado, e mantÃ©m botÃµes nativos navegÃ¡veis', () => {
  const select = vi.fn();
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <AgentDock
        label="Agents"
        position="right"
        onSelect={select}
        statusLabels={{ running: 'Running' }}
        items={[
          { id: 'a', label: 'Worker', mark: 'W', status: 'running' },
          { id: 'b', label: 'Review', status: 'failed' },
          { id: 'c', label: 'Done', status: 'done' }
        ]}
      />
    </ThemeProvider>
  );
  const button = screen.getByRole('button', { name: 'Worker Â· Running' });
  expect(button.tagName).toBe('BUTTON');
  button.focus();
  expect(document.activeElement).toBe(button);
  fireEvent.click(button);
  expect(select).toHaveBeenCalledWith('a');
  expect(screen.getByText('W')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain('Review: Falhou');
});

