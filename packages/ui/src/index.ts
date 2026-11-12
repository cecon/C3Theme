import './theme/vars';

// @c3theme/ui: tema, layout e componentes da C3 sobre o MUI.

// tema e preferências
export { default as C3ThemeProvider } from './C3ThemeProvider';
export type { C3ThemeProviderProps, LocaleMessages } from './C3ThemeProvider';
export { createC3Theme, BRAND_COLORS, DEFAULT_FONT, FONT_OPTIONS } from './theme/createC3Theme';
export { softColors, toneMain, toneText } from './theme/soft';
export type { Tone } from './theme/soft';
export { visuallyHidden } from './theme/visuallyHidden';
export type { BrandColor, C3ThemeOptions, Look } from './theme/createC3Theme';
export type { C3SchemeTokens, C3Tokens } from './theme/tokens';
export { ANGLE, ANGLE_FIELD_HEIGHT } from './theme/angle';
export { C3_FIELD_HEIGHT } from './theme/fieldSize';
export type { FieldSize, FieldHeights } from './theme/fieldSize';
export { useUiConfig, useBranding, useLocales, DEFAULT_UI_CONFIG } from './config';
export type { UiConfig, MenuOrientation, Direction, Branding, LocaleOption } from './config';

// textos dos componentes
export { useUiText, UI_MESSAGES_EN, uiMessagesFor } from './i18n';
export type { UiMessageId } from './i18n';

// layout
export { default as AppLayout, DRAWER_WIDTH, MINI_DRAWER_WIDTH, HEADER_HEIGHT, CONTAINER_WIDTH } from './layout/AppLayout';
export type { AppLayoutProps } from './layout/AppLayout';
export { DESKTOP_DRAWER_FROM, desktopTokens, resolveDesktop, SYSTEM_FONT } from './layout/desktop';
export type { DesktopOptions, DesktopPlatform, ResolvedDesktop, WindowControls } from './layout/desktop';
export { default as WindowDragBar } from './layout/WindowDragBar';
export type { WindowDragBarProps } from './layout/WindowDragBar';
export { COMPACT_FIELD_HEIGHT, HEADER_HEIGHTS, useHeaderHeight } from './theme/density';
export type { Density } from './theme/density';
export { default as FillHeight } from './layout/FillHeight';
export type { FillHeightProps } from './layout/FillHeight';
export { default as AppFooter } from './layout/AppFooter';
export type { FooterLink } from './layout/AppFooter';
export { default as CommandSearch } from './layout/CommandSearch';
export type { RecordSearch, SearchHit } from './layout/search/types';
export { FullscreenButton, ColorModeButton } from './layout/HeaderButtons';
export { default as AuthLayout } from './layout/AuthLayout';
export type { AuthLayoutProps } from './layout/AuthLayout';
export { default as Breadcrumbs } from './layout/Breadcrumbs';
export type { BreadcrumbLink, BreadcrumbsProps } from './layout/Breadcrumbs';
export type { CrumbOption } from './layout/crumbs';
export { pageTitle, useDocumentTitle } from './layout/documentTitle';
export { SettingsButton, SettingsDrawer } from './layout/SettingsDrawer';
export { default as UserMenu } from './layout/UserMenu';
export type { UserMenuItem, UserMenuProps } from './layout/UserMenu';
export type { UserMenuPlacement } from './layout/UserMenuTrigger';
export { default as NotificationsButton } from './layout/NotificationsButton';
export type { NotificationItem, NotificationsButtonProps } from './layout/NotificationsButton';
export { useNav, flattenNav, activeItemId, activeTrail } from './layout/nav';
export type { NavGroup, NavItem } from './layout/nav';
export { lintNav, MAX_NAV_DEPTH } from './layout/navLint';
export type { NavWarning } from './layout/navLint';
export { RAIL_WIDTH } from './layout/RailNav';
export { PANEL_WIDTH } from './layout/RailPanel';

// componentes
export { default as ActionDialog } from './components/ActionDialog';
export type { ActionDialogProps } from './components/ActionDialog';
export { default as Panel } from './components/Panel';
export type { PanelProps } from './components/Panel';
export { default as StatusChip } from './components/StatusChip';
export type { StatusTone } from './components/StatusChip';
export { default as Logo, LogoMark } from './components/Logo';
export { default as PageLoader } from './components/PageLoader';
export { notify, dismissNotice, Notifier } from './components/notify';
export type { NotifyAction, NotifySeverity } from './components/notify';
export { default as Dot } from './components/Dot';
export { default as SoftAvatar } from './components/SoftAvatar';
export type { SoftAvatarProps } from './components/SoftAvatar';
export { default as ConfirmDialog } from './components/ConfirmDialog';
export type { ConfirmDialogProps } from './components/ConfirmDialog';
export { default as SoftIconButton } from './components/SoftIconButton';
export type { SoftIconButtonProps } from './components/SoftIconButton';
export { LinearWithLabel, CircularWithLabel } from './components/Progress';
export { default as OtpInput } from './components/OtpInput';
export type { OtpInputProps } from './components/OtpInput';
export { default as Loadable } from './components/Loadable';
export { default as ScrollX } from './components/ScrollX';
export { default as InlineAdd } from './components/InlineAdd';
export type { InlineAddProps } from './components/InlineAdd';
export { default as EmptyState } from './components/EmptyState';
export type { EmptyStateProps } from './components/EmptyState';
export { default as MessagePage } from './components/MessagePage';
export type { MessagePageProps } from './components/MessagePage';
export * from './components/countdown';
export { default as PasswordStrength, passwordScore } from './components/PasswordStrength';

// assistente em passos (primeiro contato) e cartões de escolha
export * from './components/wizard';

// campos de formulário (os mesmos do motor)
export * from './components/fields';

// anexos com envio na hora e progresso (arquivo grande)
export * from './components/upload';
export * from './components/providers';

// tabelas MUI: bordas alinhadas ao card e última coluna sem vão
export * from './components/tableEdges';

// carregando: placeholders com o formato do conteúdo
export * from './components/skeletons';

// consulta por período e impressão
export * from './components/period';

// calendário: barra e estilos do FullCalendar no tema (o FullCalendar fica com quem usa)
export * from './calendar';

// tela de ajustes de app desktop (Electron)
export * from './components/settings';
// ligar aparelho por QR Code ou código, pedidos de acesso e lista de liberados (só callbacks, sem rede)
export * from './components/device';
// catálogo de itens instaláveis (loja de agentes, habilidades e apps)
export * from './components/catalog';
