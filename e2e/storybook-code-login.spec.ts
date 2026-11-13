import { expect, test } from '@playwright/test';

const story = '/iframe.html?id=motor-entrada-por-código--codigo&viewMode=story';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('c3.token'));
});
test('entrada por código: foco, Enter, código inválido e entrada sem senha', async ({ page }) => {
  await page.goto(story);
  const email = page.getByRole('textbox', { name: 'E-mail' });
  await expect(email).toBeFocused();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await email.fill('ana@exemplo.com');
  await email.press('Enter');
  const digits = page.getByRole('textbox');
  await expect(digits.first()).toBeFocused();
  for (let index = 0; index < 6; index++) await digits.nth(index).fill('0');
  await digits.last().press('Enter');
  await expect(page.getByRole('alert')).toContainText('Código inválido');
  await expect(page.getByText('Reenviar código', { exact: true })).toHaveCount(0);
  for (const [index, digit] of [...'123456'].entries()) await digits.nth(index).fill(digit);
  await digits.last().press('Enter');
  await expect(page.getByText('Você entrou com o código de e-mail.')).toBeVisible();
});
test('nenhuma rota de recuperação de senha é montada no modo código', async ({ page }) => {
  await page.goto(`${story}#/forgot-password`);
  await expect(page.getByRole('textbox', { name: 'E-mail' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar código' })).toBeVisible();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await expect(page.getByText('Esqueci a senha', { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/#\/login$/);
});
