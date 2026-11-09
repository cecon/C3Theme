import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../api';
import { quickCreate } from './quickCreate';

const initial = { titulo: 'Novo', etapa: 'todo' };

describe('quickCreate', () => {
  it('cria só com o título e a coluna', async () => {
    const create = vi.fn().mockResolvedValue({ id: '9', ...initial });
    await expect(quickCreate({ create }, 'tarefa', initial)).resolves.toEqual({ kind: 'created' });
    expect(create).toHaveBeenCalledWith('tarefa', initial);
  });
  it('erro por campo abre o formulário com o que foi digitado', async () => {
    const create = vi
      .fn()
      .mockRejectedValue(new ApiError(422, 'validation', 'Corrija', { prazo: [{ code: 'required', message: 'Obrigatório' }] }));
    await expect(quickCreate({ create }, 'tarefa', initial)).resolves.toEqual({ kind: 'form', initial });
  });
  it('outro erro vira mensagem', async () => {
    const create = vi.fn().mockRejectedValue(new ApiError(403, 'forbidden', 'Sem permissão'));
    await expect(quickCreate({ create }, 'tarefa', initial)).resolves.toEqual({ kind: 'error', message: 'Sem permissão' });
  });
});
