import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../api';
import { saveMove } from './saveMove';

const patch = { inicio: '2026-11-10T13:00:00Z', fim: '2026-11-10T14:00:00Z' };

describe('saveMove', () => {
  it('grava com If-Match da versão lida e não volta o evento', async () => {
    const update = vi.fn().mockResolvedValue({ id: '1', ...patch });
    const revert = vi.fn();
    await expect(saveMove({ update }, 'evento', '1', patch, '7', revert)).resolves.toEqual({ ok: true, message: 'Salvo.' });
    expect(update).toHaveBeenCalledWith('evento', '1', patch, { ifMatch: '7' });
    expect(revert).not.toHaveBeenCalled();
  });
  it('versão velha (412) volta o evento e devolve a mensagem', async () => {
    const update = vi.fn().mockRejectedValue(new ApiError(412, 'stale', 'Alguém alterou o registro.'));
    const revert = vi.fn();
    await expect(saveMove({ update }, 'evento', '1', patch, '7', revert)).resolves.toEqual({
      ok: false,
      message: 'Alguém alterou o registro.'
    });
    expect(revert).toHaveBeenCalledOnce();
  });
});
