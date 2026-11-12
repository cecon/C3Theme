import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import Box from '@mui/material/Box';

import { answerPart, AssistantMessage, hitlUiRenderers, type Message, type UiAnswer, type UiPart } from '@c3theme/chat';
import pagina from './pagina-pagamento.png';

/**
 * Human-in-the-loop: o agente propõe e o humano decide antes de aplicar. Cada card é uma parte declarada em JSON
 * (`spec/v0/agent-ui.schema.json`), conferida no backend (`Engine::check_agent_part`) e desenhada pelo catálogo do
 * chat; o painel Code mostra o JSON que o agente manda. Responder fecha o card com o resumo.
 */
const parts: Record<string, UiPart> = {
  ferramenta: {
    id: 'p1',
    kind: 'c3.tool',
    payload: {
      tool: { name: 'enviar_email', label: 'Enviar e-mail', description: 'Manda a cobrança da fatura 1026 ao cliente.' },
      args: { para: 'financeiro@padaria.com', assunto: 'Fatura 1026 vencida', corpo: 'Olá,\nA fatura 1026 venceu em 05/11.', copias: 1 },
      fields: [
        { name: 'para', label: 'Para', type: 'string', required: true },
        { name: 'assunto', label: 'Assunto', type: 'string' },
        { name: 'corpo', label: 'Mensagem', type: 'text' },
        { name: 'copias', label: 'Cópias', type: 'number' }
      ],
      risk: 'medium',
      allow: { always: true }
    }
  },
  riscoAlto: {
    id: 'p2',
    kind: 'c3.tool',
    payload: {
      tool: { name: 'excluir_clientes', label: 'Excluir clientes', description: 'Apaga 12 clientes sem compra há 3 anos.' },
      args: { ids: ['17', '23', '41'], motivo: 'inativos' },
      risk: 'high'
    }
  },
  plano: {
    id: 'p3',
    kind: 'c3.plan',
    payload: {
      title: 'Fechar outubro',
      steps: [
        { id: 'ler', text: 'Ler as faturas de outubro', detail: '120 faturas' },
        { id: 'conciliar', text: 'Conciliar com o extrato do banco' },
        { id: 'cobrar', text: 'Mandar cobrança às vencidas', detail: '8 clientes' },
        { id: 'gravar', text: 'Gravar o fechamento', required: true }
      ]
    }
  },
  navegador: {
    id: 'p4',
    kind: 'c3.browser',
    payload: {
      url: 'https://banco.example.com/pagamentos/boleto',
      title: 'Pagamento de boleto',
      frame: pagina,
      intent: 'Pagar o boleto de R$ 1.250,00 da Distribuidora Sul',
      target: { x: 83, y: 71 },
      risk: 'high'
    }
  }
};

const base: Message = {
  id: 'r1',
  conversationId: 'c1',
  author: { id: 'bot', name: 'Assistente' },
  direction: 'in',
  format: 'markdown',
  createdAt: '2026-11-12T10:00:00Z'
};

function Conversa({ part, text }: { part: UiPart; text: string }) {
  const [current, setCurrent] = useState(part);
  const answer = async (_m: Message, _id: string, a: UiAnswer) => {
    setCurrent((p) => answerPart(p, a));
    return true;
  };
  return (
    <Box sx={{ maxWidth: 640 }}>
      <AssistantMessage message={{ ...base, text, ui: [current] }} uiRenderers={hitlUiRenderers} onAnswerUi={answer} />
    </Box>
  );
}

const source = (part: UiPart) => ({ docs: { source: { language: 'json', code: JSON.stringify(part, null, 2) } } });

const meta = {
  title: 'Chat/Humano no circuito',
  component: Conversa,
  args: { part: parts.ferramenta, text: 'Encontrei a fatura 1026 vencida. Posso mandar a cobrança?' }
} satisfies Meta<typeof Conversa>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `c3.tool`: aprovar, editar os argumentos antes, sempre permitir (oferecido) ou recusar dizendo o porquê. */
export const Ferramenta: Story = { parameters: source(parts.ferramenta) };

/** `risk: high`: segundo clique ("Confirmar …") e nunca "Sempre permitir". */
export const RiscoAlto: Story = {
  name: 'Ferramenta de risco alto',
  args: { part: parts.riscoAlto, text: 'Achei 12 clientes sem compra há 3 anos.' },
  parameters: source(parts.riscoAlto)
};

/** `c3.plan`: desmarcar (menos o obrigatório), reordenar pelas setas, reescrever o passo e aprovar. */
export const Plano: Story = {
  name: 'Plano editável',
  args: { part: parts.plano, text: 'Antes de começar, este é o plano:' },
  parameters: source(parts.plano)
};

/** `c3.browser`: a página como o agente vê, onde vai clicar, e permitir, assumir o controle ou recusar. */
export const Navegador: Story = {
  name: 'Navegador interno',
  args: { part: parts.navegador, text: 'Cheguei na tela de pagamento do banco.' },
  parameters: source(parts.navegador)
};
