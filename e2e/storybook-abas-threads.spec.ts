import { expect, test } from '@playwright/test';

// Faixa de abas das threads pela spec (#134): abrir pela lista, trocar, fechar com desfazer e criar thread nova.
test('abas das threads: abrir, trocar e fechar uma aba', async ({ page }) => {
  await page.goto('/iframe.html?id=telas-abas-das-threads--completa&viewMode=story');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const strip = page.getByRole('tablist', { name: 'Threads da conversa' });
  await expect(strip.getByRole('tab', { name: 'Principal' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Todas as abas' }).click();
  await page.getByRole('menuitem', { name: 'Pesquisa de preços' }).click();
  const pesquisa = strip.getByRole('tab', { name: 'Pesquisa de preços, executando' });
  await expect(pesquisa).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Conversa de Pesquisa de preços.')).toBeVisible();
  await pesquisa.press('ArrowLeft');
  await expect(strip.getByRole('tab', { name: 'Principal' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Oi! Abra uma thread ao lado')).toBeVisible();
  await strip.getByRole('tab', { name: 'Principal' }).press('ArrowRight');
  await pesquisa.press('Delete');
  await expect(strip.getByRole('tab', { name: /Pesquisa de preços/ })).toHaveCount(0);
  // a história tem dois avisos na tela (o do Storybook e o da casca): qualquer um desfaz
  await page.getByRole('button', { name: 'Desfazer' }).first().dispatchEvent('click');
  await expect(strip.getByRole('tab', { name: /Pesquisa de preços/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('tab', { name: /Pesquisa de preços/ })).toBeVisible();
});

test('abas das threads: "+" cria a thread ao enviar a primeira mensagem', async ({ page }) => {
  await page.goto('/iframe.html?id=telas-abas-das-threads--so-a-principal&viewMode=story');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Nova thread' }).click();
  const draft = page.getByRole('tab', { name: 'Nova thread' });
  await expect(draft).toHaveAttribute('aria-selected', 'true');
  const box = page.getByRole('tabpanel').getByRole('textbox', { name: 'Mensagem' }).last();
  await box.fill('Comparar fornecedores');
  await box.press('Enter');
  await expect(page.getByRole('tab', { name: 'Comparar fornecedores' })).toHaveAttribute('aria-selected', 'true');
});

test('abas das threads: erro ao carregar oferece tentar de novo', async ({ page }) => {
  await page.goto('/iframe.html?id=telas-abas-das-threads--erro-ao-carregar&viewMode=story');
  await expect(page.getByText('Não deu para abrir as threads.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
});
