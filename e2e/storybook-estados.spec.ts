// Estados da página pelo app.json (#99): a shell inteira, com o transporte falso da história.
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=telas-estados-da-p%C3%A1gina--${id}&viewMode=story`;

test('vazio: o recado e a ação do próximo passo levam a outra página', async ({ page }) => {
  await page.goto(story('vazio'));
  await expect(page.getByText('Nenhuma venda hoje. Abra o caixa para começar.')).toBeVisible();
  await expect(page.getByText('Vendas do dia abertas no caixa.')).toHaveCount(0);
  await page.getByRole('link', { name: 'Ver relatórios' }).click();
  await expect(page.getByText('Os relatórios chegam em dezembro.')).toBeVisible();
});

test('com dados: a página de sempre, sem aviso', async ({ page }) => {
  await page.goto(story('com-dados'));
  await expect(page.getByText('Vendas do dia abertas no caixa.')).toBeVisible();
  await expect(page.getByText(/Sem conexão/)).toHaveCount(0);
});

test('erro: a mensagem e o botão declarado', async ({ page }) => {
  await page.goto(story('erro'));
  await expect(page.getByRole('alert')).toHaveText('Não deu para ler as vendas do caixa.');
  await page.getByRole('button', { name: 'Ler de novo' }).click();
  await expect(page.getByRole('alert')).toHaveText('Não deu para ler as vendas do caixa.');
});

test('sem permissão: o recado e como conseguir, no lugar do aviso fixo', async ({ page }) => {
  await page.goto(story('sem-permissao'));
  await expect(page.getByText('Você não vê o caixa desta loja.')).toBeVisible();
  await expect(page.getByText('Peça ao gerente o perfil Caixa em Configurações › Usuários.')).toBeVisible();
  await expect(page.getByText('Você não tem permissão para abrir esta página.')).toHaveCount(0);
});

test('offline: aviso no alto, o que continua funcionando e a página embaixo', async ({ page }) => {
  await page.goto(story('offline'));
  await expect(page.getByText(/^Sem conexão com a loja/)).toBeVisible();
  await expect(page.getByText('Imprimir o último cupom')).toBeVisible();
  await expect(page.getByText('Vendas do dia abertas no caixa.')).toBeVisible();

  await page.goto(story('sem-rede'));
  await expect(page.getByText(/^Sem conexão com a loja/)).toBeVisible();
  await expect(page.getByText('Vendas do dia abertas no caixa.')).toHaveCount(0);
});

test('carregando: o que está carregando, anunciado ao leitor de tela', async ({ page }) => {
  await page.goto(story('carregando'));
  await expect(page.getByRole('status').filter({ hasText: 'Carregando as vendas do dia' })).toBeAttached();
  await expect(page.getByText('Carregando as vendas do dia').first()).toBeVisible();
});
