// Vitrine pelo motor: a lista de pessoas sai do JSON (adaptador em memória); o fluxo é buscar, abrir o formulário,
// validar, gravar, ver o registro e achá-lo na lista.
import { expect, test } from '@playwright/test';

const save = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /salvar|gravar/i }).first();

test('lista de pessoas: busca filtra as linhas', async ({ page }) => {
  await page.goto('/pessoa');
  await expect(page.getByRole('cell', { name: 'Ana Martins' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar' }).fill('Beatriz Pinto');
  await expect(page.getByRole('cell', { name: 'Beatriz Pinto' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Ana Martins' })).toHaveCount(0);
});

test('nova pessoa: obrigatório bloqueia, gravar abre o registro e ele aparece na lista', async ({ page }) => {
  await page.goto('/pessoa');
  await page.getByRole('button', { name: 'Adicionar pessoa' }).click();
  await save(page).click();
  await expect(page.getByText(/obrigatório/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/pessoa\/new$/);

  await page.getByRole('textbox', { name: 'Nome' }).fill('Zélia Teste E2E');
  await page.getByRole('textbox', { name: 'E-mail' }).fill('zelia@exemplo.com');
  await save(page).click();
  await expect(page).toHaveURL(/\/pessoa\/[^/]+$/);
  await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible();

  // pelo menu (navegação do app): recarregar a página zeraria o adaptador em memória
  await page.getByRole('link', { name: 'Pessoas' }).first().click();
  await page.getByRole('textbox', { name: 'Buscar' }).fill('Zélia');
  await expect(page.getByRole('cell', { name: 'Zélia Teste E2E' })).toBeVisible();
});
