export const MODIFIERS: string[];
export function shortcutError(value: string): null | 'pattern';
export function shortcutFromKey(e: {
  key?: string;
  code?: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}): string | undefined;
export function shortcutLabel(value: string, mac?: boolean): string;
