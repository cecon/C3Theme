import { expect, test } from '@playwright/test';

for (const width of [390, 1280])
  test(`casca integrada ${width}: áreas reservadas, foco e rascunho preservado`, async ({ page }) => {
    await page.setViewportSize({ width, height: 860 });
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/iframe.html?id=telas-casca-integrada--completa&viewMode=story');
    const main = page.getByTestId('integrated-page');
    const dock = page.locator('[data-agent-dock-area]');
    const servers = page.locator('nav[aria-label="Servidores"]');
    const pages = page.locator('nav[aria-label="Páginas"]');
    await expect(main).toBeVisible();
    await expect(servers).toBeVisible();
    await expect(pages).toBeVisible();
    const bounds = async () => ({
      main: (await main.boundingBox())!,
      dock: (await dock.boundingBox())!,
      servers: (await servers.boundingBox())!,
      pages: (await pages.boundingBox())!
    });
    await expect
      .poll(async () => {
        const b = await bounds();
        return (
          b.main.x >= b.pages.x + b.pages.width - 1 &&
          b.main.x + b.main.width <= b.dock.x + 1 &&
          b.servers.x + b.servers.width <= b.pages.x + 1
        );
      })
      .toBe(true);
    const draft = main.getByRole('textbox', { name: 'Mensagem', exact: true });
    await draft.fill('Rascunho permanece na mesma página');
    await main.getByRole('button', { name: 'Mensagens fixadas (1)', exact: true }).click();
    await page.getByRole('menuitem', { name: /Decisão integrada preservada/ }).click();
    await expect(draft).toHaveValue('Rascunho permanece na mesma página');
    await page.getByRole('button', { name: 'Atualizar estados', exact: true }).click();
    await expect(draft).toHaveValue('Rascunho permanece na mesma página');
    await servers.getByRole('button', { name: 'Servidor B (online)', exact: true }).click();
    await expect(draft).toHaveValue('Rascunho permanece na mesma página');
    await expect(page).toHaveURL(/#\/conversa$/);
    await page.getByRole('button', { name: 'Conta: Ana', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Sair', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    if (width < 1200) {
      await page.getByRole('button', { name: 'Abrir ou recolher o menu' }).click();
      const sidebar = page.getByRole('navigation', { name: 'Conversas da equipe' });
      await expect(sidebar).toBeVisible();
      await expect
        .poll(async () => {
          const paper = (await page.locator('.MuiDrawer-anchorLeft > .MuiDrawer-paper').boundingBox())!;
          const b = await bounds();
          return paper.x >= b.pages.x + b.pages.width - 1 && paper.x + paper.width <= b.dock.x + 1;
        })
        .toBe(true);
      await sidebar.getByRole('button', { name: /Ana Respondeu/ }).click();
      await expect(sidebar).toBeHidden();
      await expect(draft).toHaveValue('Rascunho permanece na mesma página');
    }
    await page.getByRole('button', { name: 'Conversa lateral', exact: true }).click();
    const drawer = page.locator('.MuiDrawer-anchorRight > .MuiDrawer-paper');
    await expect(drawer).toBeVisible();
    await expect
      .poll(async () => {
        const panel = (await drawer.boundingBox())!;
        const b = await bounds();
        return panel.x >= b.pages.x + b.pages.width - 1 && panel.x + panel.width <= b.dock.x + 1;
      })
      .toBe(true);
    await expect(drawer.getByRole('textbox', { name: 'Mensagem', exact: true })).toBeVisible();
  });
