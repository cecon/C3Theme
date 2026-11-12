// #108: o painel /uso sai só do app.json, lido de um resumo do sistema (dashboard.source), sem entidade.
import { expect, test } from '@playwright/test';

test('painel por resumo: uso por provedor, consumo por agente e a atualização com as ações do sistema', async ({ page }) => {
  await page.goto('/iframe.html?id=telas-pelo-motor--painel-por-resumo&viewMode=story');
  await expect(page.getByRole('progressbar', { name: 'Anthropic: 86% do limite' })).toBeVisible();
  await expect(page.getByText('US$ 41,30')).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Revisor de PR: 42,4% do total' })).toBeVisible();
  await expect(page.getByText('Versão nova disponível')).toBeVisible();
  await expect(page.getByText('Canal beta: versões de teste podem ter falhas.')).toBeVisible();

  await page.getByRole('button', { name: 'Baixar' }).click();
  await expect(page.getByText('Baixando', { exact: true })).toBeVisible();
  const install = page.getByRole('button', { name: 'Instalar e reiniciar' });
  await expect(install).toBeDisabled();
  await expect(page.getByText('Espere o download terminar para instalar.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Baixar' })).toHaveCount(0);
});
