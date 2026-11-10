import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { FlowEditor, type FlowEditorProps, type FlowGraph } from '@c3theme/flow';
import { stateful } from '../support/stateful';
import { COM_ERROS, EM_ANDAMENTO, KINDS, PEDIDO } from './fluxos';

const Editor = stateful<FlowEditorProps & { onChange: (next: FlowGraph) => void }>(FlowEditor);

/**
 * Editor de fluxo de trabalho (`@c3theme/flow`): passos e ligações num canvas, tipos de passo do app, validação
 * marcada no nó e execução ao vivo. O componente não executa nada: recebe `{ nodes, edges }` e devolve no `onChange`.
 *
 * Teclado: Tab vai de passo em passo, Enter seleciona, setas movem, Delete remove. Para ligar sem arrastar, use o
 * campo "Próximo passo" no painel do passo selecionado.
 */
const meta = {
  title: 'Fluxo/FlowEditor',
  component: Editor,
  args: { value: PEDIDO, kinds: KINDS, onChange: fn(), minimap: true, height: 560 },
  argTypes: { kinds: { control: false }, value: { control: false }, run: { control: false } }
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fluxo de 6 passos: WhatsApp, Atendente, condição com "sim"/"não", Cozinha, entregador e fim. */
export const SeisPassos: Story = { name: 'Fluxo de 6 passos' };

/** Acompanhando uma execução: situação por passo e o caminho percorrido em destaque (só leitura). */
export const EmExecucao: Story = {
  name: 'Execução em andamento',
  args: { run: EM_ANDAMENTO, readOnly: true }
};

/** Erros de validação marcados no passo: saída sem ligação, passo solto, ciclo sem limite e campo obrigatório vazio. */
export const ComErros: Story = {
  name: 'Com erros de validação',
  args: { value: COM_ERROS }
};

/**
 * Regras do app: um gatilho só (`max: 1`) que não sai (`removable: false`), agente novo já com o primeiro agente
 * (`defaults`) e um problema que só o app conhece (`extraIssues`), marcado no passo e somado na barra.
 */
export const RegrasDoApp: Story = {
  name: 'Gatilho único e problema do app',
  args: {
    kinds: KINDS.map((k) =>
      k.type === 'gatilho'
        ? { ...k, max: 1, removable: false }
        : k.type === 'agente'
          ? { ...k, defaults: () => ({ agente: 'atendente' }) }
          : k
    ),
    extraIssues: [{ nodeId: PEDIDO.nodes.find((n) => n.type === 'agente')!.id, message: 'Agente desativado na empresa' }]
  }
};

/** O "não" da condição é `optional`: sem ligação, o fluxo termina ali e a barra não conta problema. */
export const SaidaOpcional: Story = {
  name: 'Saída que pode ficar solta',
  args: {
    kinds: KINDS.map((k) => (k.type === 'condicao' ? { ...k, outputs: k.outputs.map((p) => ({ ...p, optional: p.id === 'nao' })) } : k)),
    value: { ...PEDIDO, edges: PEDIDO.edges.filter((e) => !(e.source === 'confirmado' && e.sourcePort === 'nao')) }
  }
};
