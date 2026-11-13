import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
  for (const [story, position] of [
    ['inferior', 'bottom'],
    ['superior', 'top'],
    ['lateral', 'right']
  ] as const) {
    test(`dock ${position} reserva área e conversa lateral a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/iframe.html?id=telas-dock-de-agentes--${story}&viewMode=story`);
      const dock = page.getByRole('region', { name: 'Agentes ativos' });
      await expect(dock).toBeVisible();
      const draft = page.getByRole('textbox', { name: 'Rascunho' });
      await draft.fill('Rascunho fica na conversa');
      const main = await page.getByRole('main').boundingBox();
      const area = await page.locator('[data-agent-dock-area]').boundingBox();
      expect(main).not.toBeNull();
      expect(area).not.toBeNull();
      if (position === 'bottom') expect(main!.y + main!.height).toBeLessThanOrEqual(area!.y + 1);
      if (position === 'top') expect(main!.y).toBeGreaterThanOrEqual(area!.y + area!.height - 1);
      if (position === 'right') expect(main!.x + main!.width).toBeLessThanOrEqual(area!.x + 1);
      await page.getByRole('button', { name: 'Ficar offline' }).click();
      await expect(draft).toHaveValue('Rascunho fica na conversa');
      await expect(dock.getByRole('button', { name: /Design Executando/ })).toBeVisible();
      await page.getByRole('button', { name: 'Abrir conversa lateral' }).click();
      const conversation = page.getByRole('textbox', { name: 'Mensagem lateral' });
      await expect(conversation).toBeVisible();
      const drawerEdge = async () => {
        const drawer = await conversation.locator('..').boundingBox();
        return position === 'bottom' ? drawer!.y + drawer!.height : position === 'top' ? drawer!.y : drawer!.x + drawer!.width;
      };
      if (position === 'bottom') await expect.poll(drawerEdge).toBeLessThanOrEqual(area!.y + 1);
      if (position === 'top') await expect.poll(drawerEdge).toBeGreaterThanOrEqual(area!.y + area!.height - 1);
      if (position === 'right') await expect.poll(drawerEdge).toBeLessThanOrEqual(area!.x + 1);
      await page.getByRole('button', { name: 'Fechar conversa' }).click();
      const item = dock.getByRole('button', { name: /Desenvolvimento · Aguardando aprovação/ });
      await item.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/#\/dev/);
      await dock.getByRole('button', { name: /Design Executando/ }).focus();
      await page.keyboard.press('Space');
      await expect(page).toHaveURL(/#\/design/);
    });
  }
}
