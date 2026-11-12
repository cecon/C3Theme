// #112: o modo vem de fora pelo `theme.mode` (a barra do Storybook usa a mesma prop) e a pessoa troca pela casca.
import { expect, test } from '@playwright/test';

const shell = (mode: string) => `/iframe.html?id=layout-shell-pelo-motor--menu-vertical&viewMode=story&globals=mode:${mode}`;
const html = (page: import('@playwright/test').Page) => page.locator('html');

test('o modo pedido de fora vale na casca e a troca pela casca fica salva', async ({ page }) => {
  await page.goto(shell('dark'));
  await expect(html(page)).toHaveAttribute('data-c3-mode', 'dark');

  await page.getByRole('button', { name: 'Alternar modo claro e escuro' }).click();
  await expect(html(page)).toHaveAttribute('data-c3-mode', 'light');
  expect(await page.evaluate(() => localStorage.getItem('c3-storybook-mode'))).toBe('light');

  await page.goto(shell('light'));
  await expect(html(page)).toHaveAttribute('data-c3-mode', 'light');
});
