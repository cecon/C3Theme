import type { C3Bridge } from '@c3theme/electron/renderer';

declare global {
  interface Window {
    /** Ponte do preload (`exposeC3Bridge`). */
    c3: C3Bridge;
  }
}
