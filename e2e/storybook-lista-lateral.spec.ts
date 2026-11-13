import { expect, test } from '@playwright/test';

test('lista lateral: criar seção, mover e recolher com teclado', async ({ page }) => {
  await page.goto('/iframe.html?id=telas-lista-lateral-por-servidor--completa&viewMode=story');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const nav = page.getByRole('navigation', { name: 'Conversas da equipe' });
  await nav.getByRole('button', { name: 'Criar seção' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Pesquisa');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await nav.getByRole('button', { name: 'Ações de Bia' }).click();
  await page.getByRole('menuitem', { name: 'Mover para Pesquisa' }).click();
  const header = nav.getByRole('button', { name: /Pesquisa \(1\)/ });
  await header.focus();
  await page.keyboard.press('Space');
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  await expect(nav.getByRole('button', { name: /^Bia/ })).toHaveCount(0);
  await page.reload();
  await expect(nav.getByRole('button', { name: /Pesquisa \(1\)/ })).toHaveAttribute('aria-expanded', 'false');
});
