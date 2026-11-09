// @vitest-environment jsdom
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EntityDef } from '../../types';
import BoardCard from './BoardCard';

afterEach(cleanup);

const tarefa: EntityDef = {
  name: 'tarefa',
  label: { singular: 'Tarefa', plural: 'Tarefas' },
  titleField: 'titulo',
  fields: [
    { name: 'titulo', type: 'string', label: 'Título' },
    { name: 'codigo', type: 'string' },
    { name: 'comentarios', type: 'integer' }
  ],
  views: { board: { groupBy: 'etapa', code: 'codigo', counters: [{ field: 'comentarios', icon: 'X', label: 'comentários' }] } }
};
const opened = vi.fn();

function setup(draggable = true) {
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <MemoryRouter initialEntries={['/tarefa/board']}>
          <Routes>
            <Route
              path="/tarefa/board"
              element={
                <DragDropContext onDragEnd={() => {}}>
                  <Droppable droppableId="todo">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        <BoardCard
                          def={tarefa}
                          row={{ id: '7', titulo: 'Cálculo de frete', codigo: 'HU-02', comentarios: 2 }}
                          index={0}
                          fields={[]}
                          draggable={draggable}
                          done={false}
                          onOpen={opened}
                        />
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              }
            />
            <Route path="/tarefa/:id" element={<p>registro aberto</p>} />
          </Routes>
        </MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );
}

describe('cartão do quadro', () => {
  it('não tem botão dentro da alça: o dnd não arrasta com o mouse sobre elemento interativo', () => {
    setup();
    const handle = document.querySelector('[data-rfd-drag-handle-draggable-id="7"]')!;
    expect(handle).not.toBeNull();
    expect(handle.querySelector('button, a, input, select, textarea')).toBeNull();
  });

  it('mostra o código acima do título e o contador', () => {
    setup();
    expect(screen.getByText('HU-02')).toBeTruthy();
    // o rótulo do contador fica em texto escondido: o nome do cartão é o texto dele (WCAG 2.5.3)
    expect(screen.getByRole('button').textContent).toContain('2 comentários');
  });

  it('Enter abre o registro', () => {
    setup();
    fireEvent.keyDown(screen.getByRole('button', { name: /Cálculo de frete/ }), { key: 'Enter' });
    expect(opened).toHaveBeenLastCalledWith(expect.objectContaining({ id: '7' }));
  });

  it('somente leitura: sem alça de arrasto, mas focável e Enter abre', () => {
    setup(false);
    expect(document.querySelector('[data-rfd-drag-handle-draggable-id]')).toBeNull();
    const card = screen.getByRole('button', { name: /Cálculo de frete/ });
    expect(card.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(opened).toHaveBeenLastCalledWith(expect.objectContaining({ id: '7' }));
  });
});
