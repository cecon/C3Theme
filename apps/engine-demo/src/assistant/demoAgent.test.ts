import { ApiError, type C3Client } from '@c3theme/engine';
import { describe, expect, it, vi } from 'vitest';

import { answerFor } from './demoAgent';

const clientWith = (list: C3Client['list']) => ({ list }) as unknown as C3Client;

describe('assistente do exemplo: Cancelar o último pedido', () => {
  it('sem filial (403) responde o que fazer, sem estourar erro', async () => {
    const api = clientWith(vi.fn().mockRejectedValue(new ApiError(403, 'forbidden', 'Sem acesso.')));
    const m = await answerFor('Cancelar o último pedido', api);
    expect(m.text).toContain('não tem acesso a pedidos na filial atual');
    expect(m.ui).toBeUndefined();
  });

  it('outro erro mostra a mensagem do servidor', async () => {
    const api = clientWith(vi.fn().mockRejectedValue(new ApiError(0, 'network', 'Sem conexão com o servidor.')));
    const m = await answerFor('cancelar', api);
    expect(m.text).toContain('Sem conexão com o servidor.');
  });

  it('com pedido em aberto, monta a ação de cancelar', async () => {
    const api = clientWith(vi.fn().mockResolvedValue({ data: [{ id: 7 }] }));
    const m = await answerFor('cancelar', api);
    expect(m.ui?.[0]).toMatchObject({ kind: 'c3.action', payload: { entity: 'sales_order', id: '7', action: 'cancel' } });
  });
});

describe('assistente do exemplo: parte aberta', () => {
  const pending = { messageId: 'b1', partId: 'periodo-1', kind: 'c3.form' };

  it('"esquece" cancela a parte aberta', async () => {
    const cancel = vi.fn();
    const m = await answerFor('esquece, faço depois', null, pending, cancel);
    expect(cancel).toHaveBeenCalledWith('periodo-1');
    expect(m.ui).toBeUndefined();
  });

  it('texto sem pedido novo mantém a parte aberta', async () => {
    const cancel = vi.fn();
    const m = await answerFor('ok, já vejo', null, pending, cancel);
    expect(cancel).not.toHaveBeenCalled();
    expect(m.ui).toBeUndefined();
  });
});
