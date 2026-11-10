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
