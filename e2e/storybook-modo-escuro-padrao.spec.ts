// #132: o `defaultMode` escuro tem de mudar as cores na tela de verdade, não só o atributo. O teste lê o
// estilo computado do body e do Paper (o jsdom do #96 só conferia `data-c3-mode`).
import { expect, test } from '@playwright/test';

const historia = '/iframe.html?id=motor-modo-escuro--escuro&viewMode=story';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('storybook-modo-padrao-mode'));
});

test('defaultMode escuro aplica fundo escuro no body e no papel', async ({ page }) => {
  await page.goto(historia);
  await expect(page.locator('html')).toHaveAttribute('data-c3-mode', 'dark');

  const cores = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    paper: getComputedStyle(document.getElementById('paper')!).backgroundColor,
    texto: getComputedStyle(document.body).color
  }));
  // tokens do esquema escuro do tema C3; fundo claro (#F4F6F9) e texto escuro reprovariam aqui
  expect(cores.body).toBe('rgb(13, 17, 23)');
  expect(cores.paper).toBe('rgb(21, 27, 35)');
  expect(cores.texto).toBe('rgb(231, 235, 240)');
});

test('a escolha salva continua vencendo o defaultMode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('storybook-modo-padrao-mode', 'light'));
  await page.goto(historia);
  await expect(page.locator('html')).toHaveAttribute('data-c3-mode', 'light');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(244, 246, 249)');
});
