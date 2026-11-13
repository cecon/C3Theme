import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=telas-rail-de-páginas--${id}&viewMode=story`;
test('fixar pelo teclado mantém menu aberto; recolhido preserva ícones e preferência', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(story('padrao'));
  const nav = page.getByRole('navigation', { name: 'Páginas', exact: true });
  await expect(nav.getByRole('link', { name: 'Agentes' })).toBeVisible();
  await expect(nav.getByRole('button', { name: /Mais páginas/ })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('button', { name: /Mais páginas/ }).click();
  await page.getByRole('menuitem', { name: 'Uso', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  const pin = page.getByRole('menuitemcheckbox', { name: 'Fixar Uso no rail' });
  await expect(pin).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitemcheckbox', { name: 'Desafixar Uso' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(nav.getByRole('link', { name: 'Uso' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('button', { name: 'Recolher o rail' }).click();
  const box = await nav.boundingBox();
  const item = await nav.getByRole('link', { name: 'Uso' }).boundingBox();
  expect(item!.x).toBeGreaterThanOrEqual(box!.x);
  expect(item!.x + item!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
  await page.reload();
  await expect(nav.getByRole('button', { name: 'Expandir o rail' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Uso' })).toBeVisible();
});
test('ajuda recebe as notas pela porta sem remontar o rascunho; páginas indisponíveis somem', async ({ page }) => {
  await page.goto(story('sem-pagina-opcional'));
  await page.getByRole('textbox', { name: 'Rascunho' }).fill('Texto da pessoa');
  await page.getByRole('button', { name: /Ajuda e versão/ }).click();
  await expect(page.getByText('Versão 1.2.3')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Guia', exact: true })).toHaveAttribute('target', '_blank');
  await expect(page.getByText('Melhorias da equipe disponíveis.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'Rascunho' })).toHaveValue('Texto da pessoa');
  await page.getByRole('button', { name: /Mais páginas/ }).click();
  await expect(page.getByRole('menuitem', { name: 'Cobrança', exact: true })).toHaveCount(0);
});
