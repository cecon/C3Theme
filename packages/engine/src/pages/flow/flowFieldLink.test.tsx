// @vitest-environment jsdom
// O campo do grafo (views.flow.field) no formulário: resumo com o botão do editor no lugar da caixa de texto (#72).
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { WireRecord } from '../../types';
import FieldInput from '../../widgets/FieldInput';
import { automacao, fakeClient, mount, record, SAVED, VALID } from './flowFixture.test-utils';

afterEach(cleanup);

const field = automacao.fields[1];
const input = (value: unknown, rec: WireRecord | undefined, readOnly = false, entity = 'automacao') => (
  <FieldInput field={field} value={value} onChange={() => {}} entity={entity} record={rec} readOnly={readOnly} />
);

describe('campo do grafo no formulário', () => {
  it('mostra quantos passos e abre o editor do registro', () => {
    mount(fakeClient(record()), input(JSON.stringify(VALID), { id: '7' }));
    expect(screen.getByText('2 passos')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir o fluxo' }).getAttribute('href')).toBe('/automacao/7/flow');
  });

  it('um passo, nenhum e inválido; com o formulário em leitura o botão continua abrindo o editor', () => {
    mount(fakeClient(record()), input(JSON.stringify(SAVED), { id: '7' }, true));
    expect(screen.getByText('1 passo')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir o fluxo' }).getAttribute('href')).toBe('/automacao/7/flow');
    cleanup();
    mount(fakeClient(record()), input('', { id: '7' }));
    expect(screen.getByText('Nenhum passo ainda.')).toBeTruthy();
    cleanup();
    mount(fakeClient(record()), input('{', { id: '7' }));
    expect(screen.getByText('O fluxo gravado não é válido.')).toBeTruthy();
  });

  it('cadastro novo: pede para salvar antes, botão desligado', () => {
    mount(fakeClient(record()), input(undefined, {}));
    expect(screen.getByText('Salve o cadastro para montar o fluxo.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Abrir o fluxo' }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    mount(fakeClient(record()), input(undefined, undefined));
    expect(screen.getByText('Salve o cadastro para montar o fluxo.')).toBeTruthy();
  });

  it('outro campo text, ou o mesmo nome em entidade sem fluxo, continua texto', () => {
    mount(fakeClient(record()), <FieldInput field={{ ...field, name: 'obs' }} value="oi" onChange={() => {}} entity="automacao" />);
    expect(screen.getByRole('textbox')).toBeTruthy();
    cleanup();
    mount(fakeClient(record()), input('oi', { id: '7' }, false, 'outra'));
    expect(screen.getByRole('textbox')).toBeTruthy();
  });
});
