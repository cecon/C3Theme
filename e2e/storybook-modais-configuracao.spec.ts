// Configurações em modal (#119) no Storybook: a moldura do diálogo, as 12 abas pessoais, a busca que abre a aba e foca
// a linha, o foco preso e devolvido, e as 16 seções do servidor com subpágina e trilha. Comportamento descrito na
// cecon/C3Theme#119 e na épica cecon/piecework#389.
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=componentes-modais-de-configuração--${id}&viewMode=story`;

test('pessoal: abre pelo botão, busca abre a aba e foca a linha, Escape limpa antes de fechar', async ({ page }) => {
  await page.goto(story('pessoal'));
  const botao = page.getByRole('button', { name: 'Configurações' });
  await botao.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Configurações' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Geral' })).toHaveAttribute('aria-current', 'page');
  await expect(dialog.getByRole('navigation', { name: 'Seções das configurações' }).getByRole('button')).toHaveCount(12);

  const busca = dialog.getByRole('combobox', { name: 'Pesquisar configurações…' });
  await busca.fill('som');
  await busca.press('Enter');
  await expect(dialog.getByRole('button', { name: 'Notificações' })).toHaveAttribute('aria-current', 'page');
  await expect(dialog.getByRole('switch', { name: 'Som das notificações' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(busca).toHaveValue('');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(botao).toBeFocused();
});

test('pessoal: Tab circula dentro do diálogo', async ({ page }) => {
  await page.goto(story('pessoal'));
  await page.getByRole('button', { name: 'Configurações' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('combobox', { name: 'Pesquisar configurações…' }).focus();
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab');
    const dentro = await page.evaluate(() => {
      const ativo = document.activeElement;
      return ativo !== null && ativo.closest('[role="dialog"]') !== null;
    });
    expect(dentro).toBe(true);
  }
});

test('servidor: abre pelo rodapé do pessoal, mostra as 16 seções e a subpágina com trilha e voltar', async ({ page }) => {
  await page.goto(story('pessoal'));
  await page.getByRole('button', { name: 'Configurações' }).click();
  const pessoal = page.getByRole('dialog');
  await expect(pessoal).toBeVisible();
  await pessoal.getByRole('button', { name: 'Configurações do servidor' }).click();
  const servidor = page.getByRole('dialog').filter({ hasText: 'Configurações do servidor' });
  await expect(servidor.getByRole('navigation', { name: 'Seções das configurações' }).getByRole('button')).toHaveCount(16);
  await servidor.getByRole('button', { name: 'Provedores' }).click();
  const abrir = servidor.getByRole('button', { name: 'Abrir' });
  await abrir.focus();
  await abrir.click();
  await expect(servidor.getByRole('button', { name: 'Voltar' })).toBeVisible();
  await expect(servidor.getByText('Modelos', { exact: true })).toBeVisible();
  await servidor.getByRole('button', { name: 'Voltar' }).click();
  await expect(servidor.getByRole('button', { name: 'Abrir' })).toBeFocused();
});

test('estados: sem permissão e salvando aparecem na moldura', async ({ page }) => {
  await page.goto(story('estados'));
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Você não tem permissão para ver esta seção.')).toBeVisible();
  await expect(dialog.getByText('Salvando…')).toBeVisible();
  await expect(dialog.getByText('Versão 1.5.0')).toBeVisible();
});
