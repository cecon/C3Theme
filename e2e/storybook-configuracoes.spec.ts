// Configurações pelo motor (#110, ADR 0014): abas em ?tab=, busca que leva ao ajuste, confirmação antes de gravar,
// aviso de reinício e atalho de teclado capturado, tudo do JSON da entidade `preferencias` no Storybook.
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=telas-configurações-pelo-motor--${id}&viewMode=story`;

test('configurações: abas, e a busca abre a aba do ajuste', async ({ page }) => {
  await page.goto(story('geral'));
  await expect(page.getByRole('tab', { name: 'Geral' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('textbox', { name: 'Pasta dos dados' })).toBeVisible();
  const search = page.getByRole('combobox', { name: 'Buscar nas configurações' });
  await search.fill('gpu');
  await page.getByRole('option', { name: /Aceleração por hardware/ }).click();
  await expect(page.getByRole('tab', { name: 'Avançado' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('switch', { name: /Aceleração por hardware/ })).toBeVisible();
});

test('configurações: desligar a cópia pede confirmação e cancelar volta o valor', async ({ page }) => {
  await page.goto(story('geral'));
  const backup = page.getByRole('switch', { name: /Cópia de segurança diária/ });
  await expect(backup).toBeChecked();
  await backup.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Desligar a cópia de segurança?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(backup).toBeChecked();
});

test('configurações: atalho capturado e o repetido recusado', async ({ page }) => {
  await page.goto(story('atalhos'));
  await expect(page.getByRole('tab', { name: 'Atalhos' })).toHaveAttribute('aria-selected', 'true');
  const assistente = page.getByRole('textbox', { name: 'Abrir o assistente' });
  await assistente.focus();
  await page.keyboard.press('Control+K');
  await expect(page.getByText('Ctrl+K já é o atalho de Abrir a busca.')).toBeVisible();
  await page.keyboard.press('Control+Shift+J');
  await expect(assistente).toHaveValue('Ctrl+Shift+J');
});
