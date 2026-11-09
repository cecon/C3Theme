// @vitest-environment jsdom
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import TextField from '@mui/material/TextField';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Wizard, { type WizardProps } from './Wizard';
import ChoiceCard, { ChoiceGroup } from './ChoiceCard';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const wrap = (ui: ReactNode) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const STEPS = [{ label: 'Boas-vindas' }, { label: 'A empresa' }, { label: 'Agentes' }];

function Controlled(props: Partial<WizardProps>) {
  const [step, setStep] = useState(0);
  return (
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <Wizard steps={STEPS} step={step} onStepChange={setStep} title={`Título ${step}`} {...props}>
          <TextField label="Nome" />
        </Wizard>
      </IntlProvider>
    </ThemeProvider>
  );
}

describe('Wizard', () => {
  it('marca o passo atual com aria-current e os anteriores como concluídos', () => {
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    const current = screen.getByText('A empresa').closest('li')!;
    expect(current.getAttribute('aria-current')).toBe('step');
    expect(screen.getByText('Boas-vindas, concluído')).toBeTruthy();
  });

  it('Voltar não aparece no primeiro passo e volta um passo depois', () => {
    render(<Controlled />);
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByRole('heading', { name: 'Título 0' })).toBeTruthy();
  });

  it('o foco vai para o título do passo novo, mas não no primeiro desenho', () => {
    render(<Controlled />);
    expect(document.activeElement).toBe(document.body);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Título 1' }));
  });

  it('Enter fora de um campo de texto avança; com a principal desabilitada, não', () => {
    const { unmount } = render(<Controlled />);
    fireEvent.keyDown(screen.getByRole('heading'), { key: 'Enter' });
    expect(screen.getByRole('heading', { name: 'Título 1' })).toBeTruthy();
    unmount();
    render(<Controlled primary={{ disabled: true }} />);
    fireEvent.keyDown(screen.getByRole('heading'), { key: 'Enter' });
    fireEvent.submit(screen.getByRole('heading').closest('form')!);
    expect(screen.getByRole('heading', { name: 'Título 0' })).toBeTruthy();
  });

  it('Enter num botão fica com o botão (Voltar não vira Continuar)', () => {
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Voltar' }), { key: 'Enter' });
    expect(screen.getByRole('heading', { name: 'Título 1' })).toBeTruthy();
  });

  it('principal com onClick não troca de passo sozinha (o app valida) e o erro vira alerta', () => {
    const onClick = vi.fn();
    render(<Controlled primary={{ label: 'Salvar', onClick }} error="Informe o nome da empresa." />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Título 0' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Informe o nome da empresa.');
  });

  it('ação secundária aparece e não envia o form', () => {
    const skip = vi.fn();
    render(<Controlled secondary={{ label: 'Pular por enquanto', onClick: skip }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pular por enquanto' }));
    expect(skip).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Título 0' })).toBeTruthy();
  });
});

describe('ChoiceCard', () => {
  it('é um checkbox nativo com título como nome e explicação como descrição', () => {
    const onChange = vi.fn();
    wrap(<ChoiceCard checked={false} onChange={onChange} title="Vendas" description="Atende quem chega pelo site." />);
    const box = screen.getByRole('checkbox', { name: 'Vendas' });
    expect(box.getAttribute('aria-describedby')).toBe(screen.getByText('Atende quem chega pelo site.').id);
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('no modo radio vira radio', () => {
    wrap(<ChoiceCard type="radio" name="m" checked onChange={() => {}} title="Claude" />);
    expect((screen.getByRole('radio', { name: 'Claude' }) as HTMLInputElement).checked).toBe(true);
  });

  it('ChoiceGroup nomeia o grupo pela pergunta e anuncia o erro como alerta', () => {
    wrap(
      <ChoiceGroup label="Que vagas estão faltando?" helperText="Escolha ao menos uma." error>
        <ChoiceCard checked={false} onChange={() => {}} title="Vendas" />
      </ChoiceGroup>
    );
    const group = screen.getByRole('group', { name: 'Que vagas estão faltando?' });
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Escolha ao menos uma.');
    expect(group.getAttribute('aria-describedby')).toBe(alert.id);
  });
});
