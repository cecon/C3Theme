import { answerLabels, type AgentQuestion, type QuestionAnswer } from '@c3theme/chat';
import type { ScriptedAnswer } from './answers';

// Respostas roteirizadas que terminam com uma pergunta ao usuário (card com opções) e o que o assistente diz depois.

export const QUESTIONS: ScriptedAnswer[] = [
  {
    match: /remov|apag|inativ/i,
    reasoning: [
      'Pedido para tirar o produto inativo. Antes confiro se ele tem estoque ou venda recente, porque remover com saldo bagunça o inventário.',
      'Sem estoque e sem venda há 3 semanas. Mesmo assim é uma remoção: pergunto antes de fazer.'
    ],
    tools: [
      {
        name: 'erp_consultar',
        label: 'Consultar cadastro',
        input: '{\n  "entidade": "produto",\n  "codigo": 102\n}',
        output: '102  Guaraná 1 L  inativo desde 12/10  estoque 0  última venda 11/10'
      }
    ],
    text: 'O **Guaraná 1 L** (código 102) está inativo desde 12/10, sem estoque e sem venda desde então. Remover tira ele das buscas e dos pedidos; o histórico de vendas continua.',
    question: {
      id: 'remover-102',
      prompt: 'Removo o Guaraná 1 L do cadastro?',
      options: [
        { id: 'sim', label: 'Sim, remover', primary: true },
        { id: 'nao', label: 'Deixar como está' }
      ]
    }
  },
  {
    match: /fechamento|relat[óo]rios/i,
    reasoning: ['Fechamento do mês: há quatro relatórios possíveis. Pergunto quais entram em vez de gerar todos.'],
    tools: [],
    text: 'Posso montar o fechamento de outubro com os relatórios abaixo. Cada um leva cerca de um minuto.',
    question: {
      id: 'fechamento-10',
      prompt: 'Quais relatórios entram no fechamento?',
      kind: 'multiple',
      allowText: true,
      placeholder: 'Outro relatório…',
      options: [
        { id: 'vendas', label: 'Vendas', description: 'Por dia, por vendedor e por forma de pagamento' },
        { id: 'estoque', label: 'Estoque', description: 'Saldo, giro e itens parados' },
        { id: 'financeiro', label: 'Financeiro', description: 'Contas a pagar e a receber' },
        { id: 'fiscal', label: 'Fiscal', description: 'Notas emitidas e impostos' }
      ]
    }
  },
  {
    match: /reajust|pre[çc]o/i,
    reasoning: ['Reajuste de preço: o percentual é decisão do usuário, não minha. Pergunto antes de calcular.'],
    tools: [],
    text: 'Os refrigerantes estão com margem média de **18%**. O último reajuste foi em agosto.',
    question: { id: 'reajuste', prompt: 'Qual percentual de reajuste aplico nos refrigerantes?', kind: 'text', placeholder: 'Ex.: 5%' }
  }
];

/** O que o assistente responde depois da escolha do usuário. */
export function followUp(question: AgentQuestion, answer: QuestionAnswer): ScriptedAnswer {
  const chosen = answerLabels(question, answer);
  const text = answer.dismissed
    ? 'Tudo bem, não mexi em nada. É só pedir de novo quando quiser.'
    : answer.optionIds?.includes('nao')
      ? 'Combinado, o produto continua no cadastro como inativo.'
      : `Feito: **${chosen.join(', ')}**. Te aviso aqui quando terminar.`;
  return {
    match: /.*/,
    reasoning: [answer.dismissed ? 'O usuário dispensou a pergunta: não faço nada.' : `O usuário escolheu: ${chosen.join(', ')}.`],
    tools: [],
    text
  };
}
