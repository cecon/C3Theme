// Interações das histórias pelo motor: abrem a ação como o usuário faria, para a história mostrar o diálogo ou o aviso
// que o motor desenha. O diálogo e o aviso saem num portal, fora do quadro da história.

import { screen, userEvent, within } from 'storybook/test';

type Play = (ctx: { canvasElement: HTMLElement }) => Promise<void>;

/** Clica no botão da ação do registro, quando o formulário termina de carregar. */
export const clickAction =
  (label: string): Play =>
  async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: label }));
  };

/** Abre a ação, preenche os campos do diálogo e confirma: mostra a resposta do sistema (sucesso ou recusa). */
export const runAction =
  (label: string, inputs: Record<string, string>, confirm = label): Play =>
  async (ctx) => {
    await clickAction(label)(ctx);
    const dialog = within(await screen.findByRole('dialog'));
    for (const [field, value] of Object.entries(inputs)) await userEvent.type(dialog.getByLabelText(field, { exact: false }), value);
    await userEvent.click(dialog.getByRole('button', { name: confirm }));
  };

/** Abre o Ctrl K e digita: a paleta mostra as telas e os registros que o backend (aqui, em memória) achou. */
export const searchFor =
  (text: string): Play =>
  async () => {
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(await screen.findByRole('textbox', { name: 'Ir para…' }), text);
    await screen.findByText('Clientes', { selector: '.MuiListSubheader-root' });
  };

/** Abre o assistente pelo botão do cabeçalho (`layout.header.assistant`): a gaveta com a conversa e as sugestões. */
export const openAssistant: Play = async ({ canvasElement }) => {
  await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Assistente' }));
  await screen.findByText('Cadastrar o cliente Padaria Bom Dia');
};

/**
 * Orientar (ADR 0008): pede a pesquisa longa e, com o agente escrevendo, manda uma orientação por Ctrl+Enter. Ela
 * espera na fila como "Orientando" até o agente ler.
 */
export const steerAgent: Play = async () => {
  await userEvent.click(await screen.findByText('Pesquisar faturas atrasadas'));
  const box = await screen.findByRole('textbox', { name: 'Mensagem' });
  await screen.findByText('orienta o agente sem parar o trabalho');
  await userEvent.type(box, 'Comece pelos maiores valores');
  await userEvent.keyboard('{Control>}{Enter}{/Control}');
  await screen.findByText('Comece pelos maiores valores');
};
