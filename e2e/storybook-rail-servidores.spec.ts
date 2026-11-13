import { expect, test } from '@playwright/test';
const url = '/iframe.html?id=telas-rail-de-servidores--completo&viewMode=story';
test('rail de servidores: troca, atalho, ocultar/reexibir e adicionar por ID', async ({ page }) => {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const remote = page.getByRole('button', { name: 'Equipe (online)' });
  await remote.click();
  await expect(remote).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('Control+1');
  await expect(page.getByRole('button', { name: 'Este computador (online)' })).toHaveAttribute('aria-current', 'true');
  await page.getByRole('button', { name: 'Ações do servidor: Este computador' }).click();
  await page.getByRole('menuitem', { name: 'Ocultar Este computador' }).click();
  await expect(page.getByRole('button', { name: 'Este computador (online)' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Adicionar servidor' }).click();
  await page.getByRole('menuitem', { name: 'Reexibir Este computador' }).click();
  await page.getByRole('button', { name: 'Adicionar servidor' }).click();
  await expect(page.getByText('Adicionar: remote')).toBeVisible();
});
test('casca reserva a área dos rails, inclusive para o drawer fixo', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url);
  const servers = page.getByRole('navigation', { name: 'Servidores' });
  const pages = page.getByRole('navigation', { name: 'Páginas' });
  await expect(servers).toBeVisible();
  const right = await pages.evaluate((el) => el.getBoundingClientRect().right);
  await expect
    .poll(() =>
      page
        .locator('.MuiDrawer-paper')
        .first()
        .evaluate((el) => el.getBoundingClientRect().left)
    )
    .toBeGreaterThanOrEqual(right);
  await expect.poll(() => page.getByRole('main').evaluate((el) => el.getBoundingClientRect().left)).toBeGreaterThanOrEqual(right);
});
