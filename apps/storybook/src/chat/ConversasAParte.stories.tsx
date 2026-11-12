import type { Meta, StoryObj } from '@storybook/react-vite';

import ConversasAParte, { DECLARADO } from './conversas-a-parte';

/**
 * Conversas à parte (issue #10, ADR 0004): "À parte" na caixa pergunta sem interromper a conversa principal, e
 * "Ramificar daqui" no menu de uma resposta abre um ramo com o histórico até ela. O painel Code mostra o que o sistema
 * declara no chat do `app.json`; o motor traduz com `laneActions`/`hasAside` e a shell (issue #71) monta o
 * `AssistantPanel` e o `LanePanel`. O agente desta página é de mentira: responde na hora.
 */
const meta = {
  title: 'Chat/Conversas à parte',
  component: ConversasAParte,
  parameters: { layout: 'padded' }
} satisfies Meta<typeof ConversasAParte>;

export default meta;
type Story = StoryObj<typeof meta>;

const source = (spec: unknown) => ({ docs: { source: { language: 'json', code: JSON.stringify(spec, null, 2) } } });

/** Escreva e toque em "À parte", ou abra "Mais ações" na resposta e escolha "Ramificar daqui". */
export const Padrao: Story = { name: 'Pergunta lateral e ramo', args: { spec: DECLARADO }, parameters: source(DECLARADO) };

/** `branch: false` e `aside: false`: só as ações declaradas no menu da mensagem. */
export const SoAcoesDeclaradas: Story = {
  name: 'Só ações declaradas',
  args: { spec: { ...DECLARADO, lanes: { aside: false, branch: false } } },
  parameters: source({ ...DECLARADO, lanes: { aside: false, branch: false } })
};
