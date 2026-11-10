// @vitest-environment jsdom
// #57: consulta com origem reference e `with` (os outros campos do formulário, ainda não salvos) e `overwrite`.
import { act, cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Notifier } from '@c3theme/ui';
import { EngineProvider } from '../context';
import type { EntityDef, WireRecord } from '../types';
import useLookups from './useLookups';

afterEach(cleanup);

const orcamento = {
  name: 'orcamento',
  label: { singular: 'Orçamento', plural: 'Orçamentos' },
  fields: [
    { name: 'conta', type: 'reference', entity: 'conta', label: 'Conta' },
    { name: 'centro', type: 'reference', entity: 'centro', label: 'Centro' },
    { name: 'ano', type: 'integer', label: 'Ano' },
    { name: 'mes_01', type: 'decimal', scale: 2, label: 'Jan' }
  ],
  lookups: [{ name: 'media', field: 'conta', with: ['centro', 'ano'], fills: ['mes_01'], overwrite: true, label: 'Sugerir pela média' }]
} as unknown as EntityDef;

function Probe({ record, patch }: { record: WireRecord; patch: (v: WireRecord) => void }) {
  const button = useLookups(orcamento, record, true, patch)('conta');
  return (
    <button disabled={button?.disabled} onClick={button?.run}>
      {button?.label ?? 'sem botão'}
    </button>
  );
}

function mount(record: WireRecord) {
  const lookup = vi.fn(async () => ({ mes_01: '150.00' }));
  const patch = vi.fn();
  render(
    <IntlProvider locale="pt-BR" onError={() => {}}>
      <EngineProvider value={{ client: { lookup } as never, app: { name: 'x' } as never, entities: {}, components: {} }}>
        <Probe record={record} patch={patch} />
        <Notifier />
      </EngineProvider>
    </IntlProvider>
  );
  return { lookup, patch };
}

describe('consulta com with', () => {
  it('manda o id da conta e os outros campos como estão; overwrite troca o já digitado', async () => {
    const { lookup, patch } = mount({
      conta: { id: '3', title: 'Aluguel' },
      centro: { id: '8', title: 'Loja' },
      ano: 2026,
      mes_01: '99.00'
    });
    await act(async () => screen.getByRole('button', { name: 'Sugerir pela média' }).click());
    expect(lookup).toHaveBeenCalledWith('orcamento', 'media', '3', { centro: '8', ano: 2026 });
    expect(patch).toHaveBeenCalledWith({ mes_01: '150.00' });
  });

  it('sem a conta escolhida o botão fica desligado; with vazio vai null', async () => {
    mount({ conta: null, centro: null });
    expect(screen.getByRole('button', { name: 'Sugerir pela média' })).toHaveProperty('disabled', true);
    cleanup();
    const { lookup } = mount({ conta: '3', centro: null });
    await act(async () => screen.getByRole('button', { name: 'Sugerir pela média' }).click());
    expect(lookup).toHaveBeenCalledWith('orcamento', 'media', '3', { centro: null, ano: null });
  });
});
