// material-ui
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowLeft, CloseCircle, MessageAdd1, Messages2 } from 'iconsax-reactjs';

import type { Lane } from '../../core/lanes';
import AssistantPanel, { type AssistantChat, type AssistantPanelProps } from '../AssistantPanel';
import { useChatText } from '../text';
import LaneList from './LaneList';

// mesmo cabeçalho do AssistantPanel, para a lista e a conversa aberta não pularem ao trocar
const SX = {
  root: { height: '100%', minHeight: 0, bgcolor: 'background.paper' },
  header: { alignItems: 'center', px: 2, py: 1.25, minHeight: 56 },
  titleRow: { alignItems: 'center', flex: 1, minWidth: 0, color: 'primary.main' },
  title: { color: 'text.primary' }
} as const;

export interface LanePanelProps {
  /** As conversas à parte da conversa principal. */
  lanes: Lane[];
  /** A aberta. Sem isso (ou sem `chat`), o painel mostra a lista. */
  selectedId?: string;
  onSelect: (id: string) => void;
  /** Voltar da conversa aberta para a lista. */
  onBack: () => void;
  /** O chat da conversa aberta (o `useMessageWindow` dela). */
  chat?: AssistantChat;
  /** Botão "Nova conversa à parte" na lista. */
  onNewAside?: () => void;
  onClose?: () => void;
  /** Padrão: "Conversas à parte". */
  title?: string;
  /** Repassado ao `AssistantPanel` da conversa aberta: caixa, catálogo de partes, ações por mensagem. */
  panel?: Omit<AssistantPanelProps, 'chat' | 'title' | 'icon' | 'onClose' | 'actions'>;
}

/**
 * Painel das conversas à parte (pergunta lateral e ramo), ao lado da conversa principal: a lista e, ao abrir uma, o
 * assistente dela com a caixa, a fila e os cards de aprovação. Ocupa a altura do pai: ponha numa coluna ou gaveta.
 */
export default function LanePanel(props: LanePanelProps) {
  const { lanes, selectedId, chat, onClose } = props;
  const t = useChatText();
  const title = props.title ?? t('c3.chat.lanes');
  const lane = lanes.find((l) => l.id === selectedId);
  const close = onClose && (
    <Tooltip title={t('c3.chat.close')}>
      <IconButton aria-label={t('c3.chat.close')} onClick={onClose} edge="end">
        <CloseCircle size={20} />
      </IconButton>
    </Tooltip>
  );

  if (lane && chat) {
    return (
      <AssistantPanel
        {...props.panel}
        chat={chat}
        title={lane.title}
        icon={
          <Tooltip title={t('c3.chat.lanes.back')}>
            <IconButton aria-label={t('c3.chat.lanes.back')} onClick={props.onBack} edge="start" color="inherit" size="small">
              <ArrowLeft size={20} />
            </IconButton>
          </Tooltip>
        }
        actions={close}
      />
    );
  }

  return (
    <Stack sx={SX.root}>
      <Stack direction="row" spacing={1} sx={SX.header}>
        <Stack direction="row" spacing={1} sx={SX.titleRow}>
          <Messages2 size={20} variant="Bulk" />
          <Typography variant="subtitle1" component="h2" noWrap sx={SX.title}>
            {title}
          </Typography>
        </Stack>
        {props.onNewAside && (
          <Tooltip title={t('c3.chat.lanes.new')}>
            <IconButton aria-label={t('c3.chat.lanes.new')} onClick={props.onNewAside}>
              <MessageAdd1 size={20} />
            </IconButton>
          </Tooltip>
        )}
        {close}
      </Stack>
      <Divider />
      <LaneList lanes={lanes} onSelect={props.onSelect} />
    </Stack>
  );
}
