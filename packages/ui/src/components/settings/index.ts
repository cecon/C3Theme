// Tela de ajustes de app desktop (Electron): painel, grupos, linhas com rótulo e explicação, controles prontos.
export { default as SettingsPanel } from './SettingsPanel';
export type { SettingsPanelProps } from './SettingsPanel';
export type { SettingsSection } from './SettingsNav';
export { default as SettingsGroup } from './SettingsGroup';
export type { SettingsGroupProps } from './SettingsGroup';
export { default as SettingsRow } from './SettingsRow';
export type { SettingsRowProps } from './SettingsRow';
export { default as SettingsChecklist } from './SettingsChecklist';
export type { SettingsChecklistItem, SettingsChecklistProps } from './SettingsChecklist';
export { SettingsSwitch, SettingsSelect, SettingsSlider, SettingsAction } from './controls';
export type { SettingsSwitchProps, SettingsSelectProps, SettingsSelectOption, SettingsSliderProps } from './controls';
export { useSettingsRow, SYSTEM_FONT_STACK } from './context';
export type { SettingsRowState } from './context';
