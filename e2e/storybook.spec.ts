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

test('prévia do cupom em texto pré-formatado: espaços e alinhamento preservados (#66)', async ({ page }) => {
  await page.goto(story('tabela-lista-pelo-motor--relacao-entregas'));
  await page.getByRole('button', { name: 'Imprimir relação' }).click();
  const cells = page.getByRole('dialog').getByRole('table', { name: 'Prévia' }).getByRole('cell');
  await expect(cells.first()).toBeVisible();
  await expect(cells.first()).toHaveCSS('white-space', 'pre');
  // textContent cru, sem a normalização de espaços: o título espaçado e as linhas de 40 colunas chegam como vieram
  const lines = await cells.evaluateAll((tds) => tds.map((td) => td.textContent ?? ''));
  expect(lines).toContain(`${'R E L .   E N T R E G A S'.padStart(32)}`.padEnd(40));
  expect(lines.filter((l) => l.startsWith('#')).every((l) => l.length === 40)).toBe(true);
  await page.getByRole('button', { name: 'Imprimir relação' }).last().click();
  await expect(page.getByText('Relação enviada para a impressora.')).toBeVisible();
});

test('consulta do sistema com href: o produto leva ao kardex filtrado por ele (#69)', async ({ page }) => {
  await page.goto(story('layout-shell-pelo-motor--posicao-para-kardex'));
  await page.getByRole('link', { name: 'Café torrado 500 g' }).click();
  await expect(page.getByRole('button', { name: 'Adicionar movimento de estoque' })).toBeVisible();
  await expect(page.getByText('Compra NF 1201')).toBeVisible();
  // o filtro do produto veio do endereço: o feijão (produto 2) não aparece
  await expect(page.getByText('Compra NF 1207')).toHaveCount(0);
});

test('agenda da semana: pedidos na hora, atrasado em vermelho e o clique leva à entrega (#65)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(story('layout-shell-pelo-motor--agenda-semana'));
  await expect(page.locator('.fc-timeGridWeek-view')).toBeVisible();
  const late = page.locator('.fc-event.ev-danger', { hasText: 'Pedido 1041' });
  await expect(late).toBeVisible();
  await expect(page.locator('.fc-event.ev-info', { hasText: 'Pedido 1042' })).toBeVisible();
  // a semana seguinte não tem pedidos; Hoje volta
  await page.getByRole('button', { name: /próximo|seguinte/i }).click();
  await expect(page.locator('.fc-event')).toHaveCount(0);
  await page.getByRole('button', { name: 'Hoje' }).click();
  await late.click();
  await expect(page.getByRole('textbox', { name: 'Cliente' })).toHaveValue('Ana Souza');
});

test('painel financeiro: variação no KPI, soma no aviso, abas e filtro na lista (#64)', async ({ page }) => {
  await page.goto(story('telas-pelo-motor--financeiro'));
  await expect(page.getByLabel(/em relação a setembro/).first()).toBeVisible();
  await expect(page.getByText(/^\d+ faturas atrasadas somando R\$/)).toBeVisible();
  await page.getByRole('tab', { name: 'Boletos' }).click();
  await expect(page.getByRole('link', { name: 'BL-001' })).toBeVisible();
  const todas = page.getByLabel(/Todas as faturas: \d+ linhas, role para ver todas/);
  await expect(todas).toBeVisible();
  await page.getByRole('combobox', { name: 'Status' }).click();
  await page.getByRole('option', { name: 'Paga' }).click();
  await expect(page.getByLabel(/Todas as faturas: \d+ linhas/)).toBeVisible();
  await expect(todas.getByText('Atrasada')).toHaveCount(0);
});

test('janela de desktop pelo app.json: cabeçalho arrasta a janela, botões continuam clicáveis e a fonte é a do sistema (#73)', async ({
  page
}) => {
  await page.goto(story('layout-shell-pelo-motor--janela-mac'));
  const header = page.locator('header').first();
  await expect(header).toBeVisible();
  const region = (el: Element) =>
    getComputedStyle(el).getPropertyValue('-webkit-app-region') || getComputedStyle(el).getPropertyValue('app-region');
  await expect.poll(() => header.evaluate(region)).toBe('drag');
  const settings = page.getByRole('button', { name: 'Aparência' });
  await expect.poll(() => settings.evaluate(region)).toBe('no-drag');
  // fonte do sistema e densidade compacta vieram do `layout.desktop`, pelo tema
  const clientes = page.getByRole('link', { name: 'Clientes' }).first();
  await expect.poll(() => clientes.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^-apple-system/);
  // a navegação continua funcionando dentro da faixa de arrastar (o menu é no-drag)
  await expect(page.getByText('FT-0020')).toBeVisible();
  await clientes.click();
  await expect(page.getByText('FT-0020')).toHaveCount(0);
});

test('conversas à parte: ramificar uma resposta, voltar e perguntar à parte com o texto da caixa (#10)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(story('chat-conversas-à-parte--padrao'));
  await expect(page.getByText('Nenhuma conversa à parte')).toBeVisible();
  await page.getByRole('button', { name: 'Mais ações' }).first().click();
  await page.getByRole('menuitem', { name: 'Ramificar daqui' }).click();
  // o ramo abre com o histórico até a resposta
  await expect(page.getByRole('heading', { name: 'Ramo da resposta' })).toBeVisible();
  await expect(page.getByRole('log', { name: 'Mensagens de Ramo da resposta' }).getByText('Quais faturas estão atrasadas?')).toBeVisible();
  await page.getByRole('button', { name: 'Voltar às conversas à parte' }).click();
  await expect(page.getByRole('list', { name: 'Conversas à parte' }).getByText('Ramo', { exact: true })).toBeVisible();

  await page.getByRole('textbox').first().fill('E a FT-0047, foi paga?');
  await page.getByRole('button', { name: 'À parte', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'E a FT-0047, foi paga?' })).toBeVisible();
  await expect(page.getByText('Sobre "E a FT-0047, foi paga?": sigo a conversa principal enquanto respondo aqui.')).toBeVisible();
});
