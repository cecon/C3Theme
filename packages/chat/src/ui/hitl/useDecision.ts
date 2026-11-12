import { useState } from 'react';

import type { UiAnswer } from '../../core/ui';
import type { UiPartProps } from '../UiParts';

/**
 * O envio de uma decisão do card: `busy` enquanto o servidor responde (os botões travam, sem clique duplo) e
 * `disabled` quando não dá para responder (parte fechada ou chat sem `answerUi`).
 */
export default function useDecision({ open, onAnswer }: Pick<UiPartProps, 'open' | 'onAnswer'>) {
  const [busy, setBusy] = useState(false);
  const disabled = !open || !onAnswer || busy;

  async function decide(answer: UiAnswer) {
    if (disabled) return false;
    setBusy(true);
    try {
      return await onAnswer(answer);
    } finally {
      setBusy(false);
    }
  }

  return { busy, disabled, decide };
}
