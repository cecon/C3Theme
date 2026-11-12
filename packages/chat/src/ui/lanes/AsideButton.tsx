// third-party
import { MessageQuestion } from 'iconsax-reactjs';

import ComposerIconButton from '../composer/ComposerIconButton';
import { useChatText } from '../text';

/**
 * Botão "À parte" da caixa do assistente (`AgentComposer.startActions`): abre uma conversa à parte, que não
 * interrompe o trabalho em andamento. O `AssistantPanel` põe sozinho com `onAside`.
 */
export default function AsideButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const t = useChatText();
  return (
    <ComposerIconButton label={t('c3.chat.lanes.aside')} onClick={onClick} disabled={disabled}>
      <MessageQuestion size={16} />
    </ComposerIconButton>
  );
}
