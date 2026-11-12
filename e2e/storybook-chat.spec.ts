// Storybook: a página de chat do motor com a conversa vinda da rota (#100, ADR 0009).
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=telas-pelo-motor--${id}&viewMode=story`;

test('conversa da rota: cada endereço abre o histórico da sua conversa', async ({ page }) => {
  await page.goto(story('conversa-da-rota'));
  await expect(page.getByText('O pedido 1042 saiu para entrega hoje às 9h.', { exact: false })).toBeVisible();
  await expect(page.getByText('O pedido 1043', { exact: false })).toHaveCount(0);
  await expect(page.getByPlaceholder('Pergunte sobre este pedido')).toBeVisible();

  await page.goto(story('outra-conversa-da-rota'));
  await expect(page.getByText('O pedido 1043 espera o pagamento do boleto', { exact: false })).toBeVisible();
  await expect(page.getByText('O pedido 1042', { exact: false })).toHaveCount(0);
});

test('conversa inválida na rota: avisa em vez de abrir uma conversa', async ({ page }) => {
  await page.goto(story('conversa-invalida'));
  await expect(page.getByText('Conversa não encontrada: o endereço não traz uma conversa válida.')).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
});
