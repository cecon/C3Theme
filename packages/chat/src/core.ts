// @c3theme/chat/core: contrato, porta de transporte, markdown (árvore pura) e hooks headless. Só depende do React
// (sem MUI, sem rede).
export type { Attachment, Author, Conversation, Message, MessageStatus, OutgoingMessage, ToolCall } from './core/types';
export { answerLabels, isAnswerReady, isPending, primaryOption } from './core/question';
export type { AgentQuestion, QuestionAnswer, QuestionOption } from './core/question';
export { answerPart, cancelPart, isPartOpen, stateAfter } from './core/ui';
export type { UiAnswer, UiCancelReason, UiPart, UiPartState } from './core/ui';
export { applyUiCancel, findPendingPart, isUiConflict, keepOnePending, supersededBy, UiConflictError } from './core/uiPending';
export type { PendingPart } from './core/uiPending';
export { clampPercent, contextLevel, timelineRows } from './core/agentPanel';
export type { AgentEvent, AgentEventKind, AgentFile, AgentNowTone, TimelineRow } from './core/agentPanel';
export {
  fallbackModels,
  filterModels,
  findModel,
  keepFallback,
  normalizeSearch,
  selectableValues,
  stepModel,
  unavailableReason,
  FLAG_TONE
} from './core/models';
export type { ModelFlag, ModelGroup, ModelOption, ModelTag, ModelTagTone } from './core/models';
export { acceptsFile, addFiles } from './core/files';
export { newTaskWatch, watchTasks } from './core/telemetry';
export type { ChatTaskEvent, ChatTelemetryPort, PartTask, TaskOf, TaskWatch } from './core/telemetry';
export type { ChatEvent, ChatTransport, DraftStorage, MessagePage } from './core/transport';
export { appendDelta, isGenerating, mergeMessages, openWindow, windowReducer, oldestId } from './core/window';
export { inlineText, parseInline, parseMarkdown, safeHref } from './core/markdown';
export type { MdAlign, MdBlock, MdInline } from './core/markdown';
export type { WindowAction, WindowState } from './core/window';
export { continuesGroup, localDay, startsDay, GROUP_GAP_MS } from './core/grouping';
export { APPROVAL, approvalAnswer, approvalChoice, isAgent, latestBlocks, stateFor } from './core/team';
export type { ApprovalChoice, Handoff, ToolRequest } from './core/team';
export { activeTypists, updateTypists, TYPING_TTL_MS } from './core/typing';
export type { Typist } from './core/typing';

export { default as useMessageWindow } from './hooks/useMessageWindow';
export type { UseMessageWindowOptions } from './hooks/useMessageWindow';
export { default as useDraft } from './hooks/useDraft';
export { default as useChatTelemetry } from './hooks/useChatTelemetry';
export { default as useMessageQueue } from './hooks/useMessageQueue';
export type { QueuedMessage, UseMessageQueueOptions } from './hooks/useMessageQueue';
export { default as useTypingStatus, TYPING_IDLE_MS, TYPING_THROTTLE_MS } from './hooks/useTypingStatus';
export { default as useVoiceRecorder, browserRecorder } from './hooks/useVoiceRecorder';
export type { RecorderDevice, RecorderState, UseVoiceRecorderOptions } from './hooks/useVoiceRecorder';

export { localStorageDrafts, memoryDrafts } from './adapters/localStorageDrafts';
export { memoryTransport } from './adapters/memoryTransport';

export { AGENT_STATES, isBusy, isPendingRequest, needsAttention, pendingCount, progressPercent, sortRequests } from './core/agents';
export type { AgentRequest, AgentState, ApprovalRequest, FailureRequest, ProgressRequest, QuestionRequest } from './core/agents';
