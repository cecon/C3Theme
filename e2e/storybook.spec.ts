// Storybook: componentes usados como o usuário usa, dentro da história (iframe sem a moldura do Storybook).
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('assistente em passos: valida o passo da empresa e chega ao último passo', async ({ page }) => {
  await page.goto(story('componentes-assistente-em-passos-uso-direto--quatro-passos'));
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByRole('heading', { name: 'A empresa' })).toBeVisible();

  const next = page.getByRole('button', { name: /continuar|próximo|avançar/i });
  await next.click();
  await expect(page.getByText('Informe o nome da empresa.')).toBeVisible();

  await page.getByRole('textbox', { name: 'Nome da empresa' }).fill('Oficina C3');
  await next.click();
  await expect(page.getByRole('heading', { name: 'Quem pensa pelos agentes' })).toBeVisible();
  await next.click();

  const hire = page.getByRole('button', { name: 'Contratar' });
  await expect(hire).toBeDisabled();
  await page.getByText('Suporte', { exact: true }).click();
  await expect(hire).toBeEnabled();
});

test('tabela com seleção: marcar uma linha e depois a página inteira', async ({ page }) => {
  await page.goto(story('tabela-datatable-uso-direto--com-selecao'));
  await expect(page.getByText('1 marcadas')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Selecionar linha 1', exact: true }).check();
  await expect(page.getByText('2 marcadas')).toBeVisible();

  const all = page.getByRole('checkbox', { name: 'Selecionar as linhas da página' });
  await all.click();
  const rows = await page.getByRole('checkbox', { name: /^Selecionar linha / }).count();
  await expect(page.getByText(`${rows} marcadas`)).toBeVisible();
});

test('seção related com o preset "Todos" sem where: carrega os itens e a aba aparece uma vez (#67)', async ({ page }) => {
  await page.goto(story('tabela-lista-pelo-motor--inventario'));
  const todos = page.getByRole('tab', { name: 'Todos' });
  await expect(todos).toHaveCount(1);
  await expect(todos).toHaveAttribute('aria-selected', 'true');
  const contado = page.locator('[data-edit-cell$=":contado"]');
  await expect(contado.first()).toBeVisible();
  const all = await contado.count();
  await page.getByRole('tab', { name: 'Só não contados' }).click();
  await expect.poll(() => contado.count()).toBeLessThan(all);
  await todos.click();
  await expect.poll(() => contado.count()).toBe(all);
});

test('humano no circuito: edita o argumento da ferramenta, aprova e o card fecha com o resumo', async ({ page }) => {
  await page.goto(story('chat-humano-no-circuito--ferramenta'));
  await expect(page.getByText('O assistente quer usar Enviar e-mail')).toBeVisible();
  await page.getByRole('button', { name: 'Editar argumentos' }).click();
  await page.getByRole('textbox', { name: 'Cópias' }).fill('2');
  await page.getByRole('button', { name: 'Aprovar com as mudanças' }).click();
  await expect(page.getByText('Aprovado com 1 mudança')).toBeVisible();
  await expect(page.getByRole('button', { name: /Aprovar/ })).toHaveCount(0);
});

test('humano no circuito: plano sem um passo e recusa do navegador com motivo', async ({ page }) => {
  await page.goto(story('chat-humano-no-circuito--plano'));
  await page.getByRole('checkbox', { name: 'Passo 3' }).uncheck();
  await page.getByRole('button', { name: 'Aprovar com as mudanças' }).click();
  await expect(page.getByText('Plano aprovado: 3 passos · 1 tirado')).toBeVisible();

  await page.goto(story('chat-humano-no-circuito--navegador'));
  await expect(page.getByRole('region', { name: 'Navegador do assistente' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Onde o assistente vai clicar' })).toBeVisible();
  await page.getByRole('button', { name: 'Recusar' }).click();
  await page.getByRole('textbox', { name: 'Diga ao assistente o porquê (opcional)' }).fill('o boleto é de outro mês');
  await page.getByRole('button', { name: 'Recusar e avisar' }).click();
  await expect(page.getByText('Motivo: o boleto é de outro mês')).toBeVisible();
});

test('navegador interno: assumir o controle libera a barra e navegar troca o endereço', async ({ page }) => {
  await page.goto(story('chat-navegador-interno-uso-direto--voce-no-controle'));
  await page.getByRole('button', { name: /^Endereço:/ }).click();
  const address = page.getByRole('textbox', { name: 'Endereço' });
  await address.fill('loja.example.com/pedido');
  await address.press('Enter');
  await expect(page.getByText('loja.example.com')).toBeVisible();
  await page.getByRole('button', { name: 'Devolver ao assistente' }).click();
  await expect(page.getByRole('status')).toHaveText('O assistente está no controle');
  await expect(page.getByRole('button', { name: /^Endereço:/ })).toBeDisabled();
});
