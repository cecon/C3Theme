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

test('seção related com o preset "Todos" sem where: carrega os itens e a aba aparece uma vez (#67)', async ({ page }) => {
  await page.goto(story('tabela-lista-pelo-motor--inventario'));
  const todos = page.getByRole('tab', { name: 'Todos' });
  await expect(todos).toHaveCount(1);
  await expect(todos).toHaveAttribute('aria-selected', 'true');
  const contado = page.locator('[data-edit-cell$=":contado"]');
  await expect(contado.first()).toBeVisible();
  const all = await contado.count();
  await page.getByRole('tab', { name: 'Só não contados' }).click();
  await expect.poll(() => contado.count()).toBeLessThan(all);
  await todos.click();
  await expect.poll(() => contado.count()).toBe(all);
});

test('prévia do cupom em texto pré-formatado: espaços e alinhamento preservados (#66)', async ({ page }) => {
  await page.goto(story('tabela-lista-pelo-motor--relacao-entregas'));
  await page.getByRole('button', { name: 'Imprimir relação' }).click();
  const cells = page.getByRole('dialog').getByRole('table', { name: 'Prévia' }).getByRole('cell');
  await expect(cells.first()).toBeVisible();
  await expect(cells.first()).toHaveCSS('white-space', 'pre');
  // textContent cru, sem a normalização de espaços: o título espaçado e as linhas de 40 colunas chegam como vieram
  const lines = await cells.evaluateAll((tds) => tds.map((td) => td.textContent ?? ''));
  expect(lines).toContain(`${'R E L .   E N T R E G A S'.padStart(32)}`.padEnd(40));
  expect(lines.filter((l) => l.startsWith('#')).every((l) => l.length === 40)).toBe(true);
  await page.getByRole('button', { name: 'Imprimir relação' }).last().click();
  await expect(page.getByText('Relação enviada para a impressora.')).toBeVisible();
});
