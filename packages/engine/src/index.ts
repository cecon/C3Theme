// ==============================|| @c3theme/engine - PUBLIC API ||============================== //

export { default as C3Shell } from './C3Shell';
export type { C3ShellProps } from './C3Shell';
// a moldura da shell (menu, cabeçalho, rodapé do app.json) para quem monta o EngineProvider no próprio app
export { default as C3Layout } from './C3Layout';
export type { C3LayoutProps } from './C3Layout';
export { createClient, ApiError, isStale } from './api';
// login pela shell: o sistema passa a porta (ou o adaptador HTTP de /auth/*) e o app.json diz quais telas existem
export { httpAuth } from './auth/httpAuth';
export type { AuthPort, AuthUser, AuthConfig } from './auth/port';
export { useAuthSession } from './auth/session';
export type { AuthSession } from './auth/session';
export type { C3Client, C3Notification, ListParams, NotificationList, SearchResult, WriteOptions } from './api';
// transporte e roteador trocáveis (Electron: `transport={ipcFetch(...)}` de @c3theme/electron e `router="hash"`)
export type { C3Fetch } from './transport';
export type { RouterMode } from './router';
export { desktopFrame } from './desktop/frame';
export type { DesktopDef, DesktopFrame } from './desktop/frame';
export type { DesktopHost } from './desktop/port';
// adaptador em memória da mesma porta: vitrine estática, protótipo e teste de tela, sem backend
export { createMemoryClient } from './memory/memoryClient';
export type { MemoryAction, MemorySeed } from './memory/memoryClient';
// para montar EntityList/EntityForm dentro do layout do próprio sistema, sem o <C3Shell>
export { EngineProvider, useEngine, useEntity, useText } from './context';
// metadados de /_meta para o EngineProvider, com as filhas e os alvos de reference
export { loadEntities, referencedEntities } from './access';
// def de /_meta como o usuário a enxerga (capabilities.fields): o <C3Shell> já aplica
export { applyAccess } from './access';
export type { C3Components, C3Icons, EngineState } from './context';
// telemetria de tarefa: o sistema passa `onTelemetry` ao <C3Shell> (ou `telemetry` ao EngineProvider) e decide o destino
export { changedFields, startTask } from './telemetry';
export type { TaskBase, TaskChannel, TaskEvent, TaskEventType, TaskExtra, TaskOp, TaskTracker, TelemetryPort } from './telemetry';
export { default as EntityList } from './pages/EntityList';
export { default as EntityHome } from './pages/EntityHome';
export { default as EntityForm } from './pages/EntityForm';
// quadro, calendário, painel, relatório e planta montados fora das rotas da shell (vitrine, layout próprio do sistema)
export { default as EntityBoard } from './pages/board/EntityBoard';
export { default as EntityCalendar } from './pages/calendar/EntityCalendar';
export { default as EntityDashboard } from './pages/dashboard/Dashboard';
export { default as EntityReport } from './pages/report/EntityReport';
export { default as EntityMap } from './pages/map/EntityMap';
export { default as EntityFlow } from './pages/flow/EntityFlow';
export { default as ApiDocs } from './pages/apiDocs/ApiDocs';
export { default as WizardPage } from './pages/wizard/WizardPage';
export { default as WizardGuard } from './pages/wizard/WizardGuard';
export type { WizardDef, WizardStepDef, WizardSummaryItem } from './wizard';
export type { RawReply } from './api';
export { default as AuthorizationDialog } from './authorization/AuthorizationDialog';
export type { AuthorizationConfig, AuthorizationField } from './authorization/AuthorizationDialog';
export { authorizingFetch, encodeAuthorization, AUTHORIZATION_HEADER } from './authorization/fetch';
export { useAuthorization } from './authorization/useAuthorization';
export type { AskAuthorization, AuthorizationRequest } from './authorization/fetch';
export { default as FieldInput } from './widgets/FieldInput';
export { default as RecordActions } from './widgets/RecordActions';
export { default as useAction } from './hooks/useAction';
export type { ActionState } from './hooks/useAction';
export { default as useUndoAction } from './hooks/useUndoAction';
export type { UndoOutcome } from './hooks/useUndoAction';
export { inverseOf, STALE_UNDO, UNDO_MS, undoable } from './undo';
export type { FieldInputProps, CustomFieldProps } from './widgets/FieldInput';
export type { CustomSectionProps } from './pages/FormSection';
export type { CustomPageProps } from './routes';
export type * from './types';
export type { FlowKindDef, FlowKindField, FlowView } from './viewTypes';
export type { AggregateItem, AggregateParams, DashboardDef, EntityWidget, WidgetDef } from './dashboard';
export type { MeterWidget, ShareWidget, StatusWidget, SummaryFormat, SummarySource, SummaryWidget } from './summary';
// partes de interface do assistente no chat (o agente propõe, o motor grava): `agentUiRenderers` no AssistantPanel
export { agentUiRenderers, FormPart, RecordPart, ActionPart, checkAction, checkForm, checkRecord } from './agent';
// telemetria do assistente: `taskOf` do <AssistantPanel> (mesmos entity/op/action da tela, com channel 'chat')
export { agentTaskOf } from './agent';
export type { AgentTask } from './agent';
// chat com o agente pela spec (`pages[].chat`, `layout.header.assistant`): o painel e o transporte HTTP de /_chat
export { default as ChatPanel } from './chat/ChatPanel';
export { default as ChatPage } from './chat/ChatPage';
export { httpChatTransport } from './chat/httpChat';
export type { AgentKind, ChatDef } from './chat/chatDef';
// conversas à parte e ações por mensagem do chat declarado (issue #10)
export { BRANCH_ACTION, hasAside, laneActions, lanesApi, runLaneAction } from './agent';
export type { ChatLanesDef, ChatLanesSpec, ChatMessageActionDef, LaneAction, LanesApi, MessageActionReply, WireLane } from './agent';
export type { ActionPayload, AgentAnswer, AgentPartProps, FormPayload, RecordPayload, Suggested } from './agent';

export { usePageState } from './pageStates/context';
export type { PageStates, PageStateDef, PageStateAction, PageDataState, ConnectivityPort } from './pageStates/types';

export type { AgentDockDef, AgentDockPort, AgentDockSnapshot, DockAgent } from './dock/types';
