// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { LoadingLabel } from './SkeletonFrame';

afterEach(cleanup);

describe('LoadingLabel', () => {
  it('fica com 1px, não com 100% da largura (que criava rolagem horizontal na página)', () => {
    render(
      <IntlProvider locale="pt-BR">
        <LoadingLabel label="Carregando clientes" />
      </IntlProvider>
    );
    const label = screen.getByRole('status');
    expect(label.textContent).toBe('Carregando clientes');
    expect(getComputedStyle(label).width).toBe('1px');
    expect(getComputedStyle(label).height).toBe('1px');
  });
});
