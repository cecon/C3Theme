// Storybook: componentes usados como o usuário usa, dentro da história (iframe sem a moldura do Storybook).
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('assistente em passos: valida o passo da empresa e chega ao último passo', async ({ page }) => {
  await page.goto(story('componentes-assistente-em-passos-uso-direto--quatro-passos'));
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByRole('heading', { name: 'A empresa' })).toBeVisible();

  const next = page.getByRole('button', { name: /continuar|próximo|avançar/i });
  await next.click();
  await expect(page.getByText('Informe o nome da empresa.')).toBeVisible();

  await page.getByRole('textbox', { name: 'Nome da empresa' }).fill('Oficina C3');
  await next.click();
  await expect(page.getByRole('heading', { name: 'Quem pensa pelos agentes' })).toBeVisible();
  await next.click();

  const hire = page.getByRole('button', { name: 'Contratar' });
  await expect(hire).toBeDisabled();
  await page.getByText('Suporte', { exact: true }).click();
  await expect(hire).toBeEnabled();
});

test('tabela com seleção: marcar uma linha e depois a página inteira', async ({ page }) => {
  await page.goto(story('tabela-datatable-uso-direto--com-selecao'));
  await expect(page.getByText('1 marcadas')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Selecionar linha 1', exact: true }).check();
  await expect(page.getByText('2 marcadas')).toBeVisible();

  const all = page.getByRole('checkbox', { name: 'Selecionar as linhas da página' });
  await all.click();
  const rows = await page.getByRole('checkbox', { name: /^Selecionar linha / }).count();
  await expect(page.getByText(`${rows} marcadas`)).toBeVisible();
});
