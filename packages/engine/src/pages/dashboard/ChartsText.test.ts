// Texto do gráfico sem dados no idioma da shell (#7).
import { describe, expect, it } from 'vitest';

import { chartsLocaleText } from './ChartsText';

describe('chartsLocaleText', () => {
  it('escolhe o português do Brasil, de Portugal ou deixa o padrão', () => {
    expect(chartsLocaleText('pt-BR')?.noData).toBe('Sem dados para exibir');
    expect(chartsLocaleText('pt')?.noData).toBe(chartsLocaleText('pt-BR')?.noData);
    expect(chartsLocaleText('pt-PT')).toBeDefined();
    expect(chartsLocaleText('en-US')).toBeUndefined();
  });
});
