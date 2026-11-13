import { expect, test, type Page } from '@playwright/test';

const story = '/iframe.html?id=motor-entrada-por-código--codigo&viewMode=story';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('c3.token'));
});

/**
 * O código entra de uma vez pelo evento de colar, como o OtpInput aceita. Preencher caixa a caixa faz o submit ler o
 * estado do React antes de todas as mudanças assentarem e a tela acusa "digite os 6 dígitos" em vez de conferir o código.
 */
async function colarCodigo(page: Page, codigo: string) {
  await page.evaluate((valor) => {
    const campo = document.querySelector<HTMLInputElement>('form input');
    if (!campo) throw new Error('campo do código não encontrado');
    const dados = new DataTransfer();
    dados.setData('text/plain', valor);
    campo.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dados, bubbles: true, cancelable: true }));
  }, codigo);
  await page.keyboard.press('Enter');
}

test('entrada por código: foco, Enter, código inválido e entrada sem senha', async ({ page }) => {
  await page.goto(story);
  const email = page.getByRole('textbox', { name: 'E-mail' });
  await expect(email).toBeFocused();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await email.fill('ana@exemplo.com');
  await email.press('Enter');
  await expect(page.getByText('Confira seu e-mail')).toBeVisible();
  await expect(page.getByRole('textbox').first()).toBeFocused();
  await colarCodigo(page, '000000');
  await expect(page.getByRole('alert')).toContainText('Código inválido');
  await expect(page.getByText('Reenviar código', { exact: true })).toHaveCount(0);
  await colarCodigo(page, '123456');
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
