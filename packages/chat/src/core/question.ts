// Pergunta do agente ao usuário ("Removo o rótulo Low?"): vem dentro de uma mensagem do assistente e a resposta volta
// pela porta (`ChatTransport.answer`). Puro: sem React e sem rede.

import type { ToolRequest } from './team';

export interface QuestionOption {
  id: string;
  label: string;
  /** Uma linha de explicação embaixo do rótulo (escolha múltipla) ou dica no botão. */
  description?: string;
  /** A opção principal: botão cheio e atalho Ctrl+Enter. No máximo uma. */
  primary?: boolean;
}

/** O que o usuário respondeu. `dismissed`: fechou no X sem responder. */
export interface QuestionAnswer {
  optionIds?: string[];
  text?: string;
  dismissed?: boolean;
}

export interface AgentQuestion {
  id: string;
  /** A pergunta, em destaque. O contexto vai no `text` da mensagem, logo acima. */
  prompt: string;
  /**
   * `single` (padrão): um botão por opção, clicar responde. `multiple`: marca várias e envia. `text`: resposta livre.
   * `approval`: o agente pede para usar a ferramenta `tool`; as opções são fixas (`APPROVAL`: permitir uma vez,
   * sempre permitir, recusar) e o `options` é ignorado.
   */
  kind?: 'single' | 'multiple' | 'text' | 'approval';
  /** A ferramenta pedida, na `kind: 'approval'`. */
  tool?: ToolRequest;
  options?: QuestionOption[];
  /** Além das opções, aceita uma resposta escrita ("Outra coisa…"). */
  allowText?: boolean;
  placeholder?: string;
  /** Mostra o X para dispensar. Padrão: sim. */
  dismissible?: boolean;
  /** Já respondida (vem do servidor, ou na hora, otimista). */
  answer?: QuestionAnswer;
}

/** A resposta tem conteúdo para enviar: alguma opção marcada ou texto que não seja só espaço. */
export const isAnswerReady = (a: QuestionAnswer) => !!a.dismissed || !!a.optionIds?.length || !!a.text?.trim();

/** A opção principal: a marcada como `primary`, senão nenhuma (o atalho só vale quando o sistema escolhe). */
export const primaryOption = (q: AgentQuestion) => q.options?.find((o) => o.primary);

/** Rótulos do que foi respondido, para o resumo depois de responder ("Sim, remover", "Outro: …"). */
export function answerLabels(q: AgentQuestion, a: QuestionAnswer): string[] {
  const chosen = (a.optionIds ?? []).map((id) => q.options?.find((o) => o.id === id)?.label ?? id);
  const text = a.text?.trim();
  return text ? [...chosen, text] : chosen;
}

/** A pergunta ainda espera resposta: existe e não foi respondida nem dispensada. */
export const isPending = (q: AgentQuestion | undefined): q is AgentQuestion => !!q && !q.answer;
