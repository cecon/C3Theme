// Estados declarados do chat (#101, ADR 0011), pela shell inteira montada do app.json no Storybook.
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=telas-estados-do-chat--${id}&viewMode=story`;

test('estados do chat: carregando, vazio com a ação e a sugestão que envia', async ({ page }) => {
  await page.goto(story('carregando'));
  await expect(page.getByRole('status').filter({ hasText: 'Abrindo a conversa com o assistente…' })).toBeVisible();
  await page.goto(story('vazio'));
  await expect(page.getByText('Nenhuma conversa ainda.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver agentes' })).toHaveAttribute('href', /agentes/);
  await expect(page.getByRole('button', { name: 'Quanto vendi ontem?' })).toBeVisible();
});

test('estados do chat: 5xx mostra o erro com "Tentar de novo", 403 cobre o painel, rede caída é offline', async ({ page }) => {
  await page.goto(story('erro'));
  await expect(page.getByText('O assistente não respondeu agora.')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(page.getByText('O assistente não respondeu agora.')).toBeVisible();
  await page.goto(story('sem-permissao'));
  await expect(page.getByText('Você ainda não pode usar o assistente.')).toBeVisible();
  await expect(page.getByText('Peça a quem administra a loja', { exact: false })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Mensagem' })).toHaveCount(0);
  await page.goto(story('offline'));
  await expect(page.getByText('Sem conexão com o servidor.')).toBeVisible();
  await expect(page.getByText('O que já foi conversado continua aqui.')).toBeVisible();
});

test('estados do chat: com histórico, o erro vai na faixa e a conversa continua visível', async ({ page }) => {
  await page.goto(story('erro-com-historico'));
  await expect(page.getByText('Ontem você vendeu R$ 4.320,00 em 37 pedidos.')).toBeVisible();
  await expect(page.getByText('O assistente não respondeu agora.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Mensagem' })).toBeVisible();
});
