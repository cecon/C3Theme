// Preload (sandbox): só expõe a ponte do C3 em `window.c3`. Nada de Node chega ao renderer.

import { contextBridge, ipcRenderer } from 'electron';

import { exposeC3Bridge } from '@c3theme/electron/preload';

exposeC3Bridge(contextBridge, ipcRenderer);
