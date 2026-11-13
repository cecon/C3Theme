import { expect, test } from '@playwright/test';

test('lista de fixadas leva à mensagem antiga e ações refletem o meta atualizado', async ({ page }) => {
  await page.goto('/iframe.html?id=telas-mensagens-fixadas--historico&viewMode=story');
  await page.getByRole('button', { name: 'Mensagens fixadas (2)' }).click();
  await page.getByRole('menuitem', { name: /Primeira decisão da conversa/ }).click();
  await expect(page.getByText('Primeira decisão da conversa', { exact: true })).toBeVisible();
  const row = page.getByText('Primeira decisão da conversa', { exact: true }).locator('xpath=ancestor::*[@data-index][1]');
  await row.getByRole('button', { name: 'Mais ações' }).click();
  await expect(page.getByRole('menuitem', { name: 'Fixar mensagem', exact: true })).toHaveCount(0);
  await page.getByRole('menuitem', { name: 'Desafixar mensagem' }).click();
  await expect(page.getByRole('button', { name: 'Mensagens fixadas (1)' })).toBeVisible();
  await row.getByRole('button', { name: 'Mais ações' }).click();
  await expect(page.getByRole('menuitem', { name: 'Fixar mensagem', exact: true })).toBeVisible();
});

test('vazio informa e backend sem recurso esconde botão', async ({ page }) => {
  await page.goto('/iframe.html?id=telas-mensagens-fixadas--vazio&viewMode=story');
  await page.getByRole('button', { name: 'Mensagens fixadas (0)' }).click();
  await expect(page.getByText('Nenhuma mensagem fixada nesta conversa.')).toBeVisible();
  await page.goto('/iframe.html?id=telas-mensagens-fixadas--sem-recurso&viewMode=story');
  await expect(page.getByText('Mensagem 64', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Mensagens fixadas/ })).toHaveCount(0);
});
