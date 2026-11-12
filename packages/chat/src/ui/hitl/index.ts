import type { UiRenderers } from '../UiParts';
import BrowserPart from './BrowserPart';
import PlanPart from './PlanPart';
import ToolPart from './ToolPart';

/**
 * As partes de human-in-the-loop do chat (`spec/v0/agent-ui.schema.json`): ferramenta com argumentos editáveis,
 * plano editável e o navegador interno. O `AssistantPanel` já traz estas; o catálogo do motor (`agentUiRenderers` do
 * @c3theme/engine) soma as de registro.
 */
export const hitlUiRenderers = {
  'c3.tool': ToolPart,
  'c3.plan': PlanPart,
  'c3.browser': BrowserPart
} satisfies UiRenderers;

export { ToolPart, PlanPart, BrowserPart };
export { default as BrowserView } from './BrowserView';
export type { BrowserViewProps } from './BrowserView';
export { default as BrowserBar } from './BrowserBar';
export type { BrowserBarProps } from './BrowserBar';
export { default as ArgsEditor } from './ArgsEditor';
export type { ArgsEditorProps } from './ArgsEditor';
export { default as WaitingBanner } from './WaitingBanner';
export type { WaitingBannerProps } from './WaitingBanner';
