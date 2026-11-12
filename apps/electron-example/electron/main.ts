// Processo main do exemplo: escolhe o backend (remoto ou binário local), liga o IPC do C3 e abre a janela com o
// renderer empacotado. A janela segue o básico de segurança do Electron: isolamento, sandbox e nada de Node.

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';

import { forwardTo, fromPage, serveC3, windowFrame } from '@c3theme/electron/main';
// a mesma declaração que o backend local serve em GET /_meta/app: a janela abre com a moldura que a shell desenha
import appJson from '../../../spec/v0/examples/app.json';
import { chooseBackend, type Backend } from './backend';

let backend: Backend | undefined;

const indexHtml = join(__dirname, '../dist/index.html');
/** A única página do app: só ela navega e só ela fala com o backend. */
const pageUrl = pathToFileURL(indexHtml).href;
const samePage = (url: string) => url.replace(/[?#].*$/, '') === pageUrl;

function openWindow(label: string) {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    title: `C3 no Electron (${label})`,
    ...windowFrame(appJson.layout.desktop, process.platform),
    webPreferences: { preload: join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  // link externo (menu com `href`) abre no navegador do sistema, não numa janela do app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  // a página nunca sai do index.html (a navegação da shell é toda por hash): nem para outro arquivo do disco
  win.webContents.on('will-navigate', (e, url) => {
    if (!samePage(url)) e.preventDefault();
  });
  void win.loadFile(indexHtml);
}

app.whenReady().then(async () => {
  try {
    backend = await chooseBackend(process.env, app.getAppPath(), app.getPath('userData'));
  } catch (e) {
    dialog.showErrorBox('C3', (e as Error).message);
    app.quit();
    return;
  }
  serveC3(ipcMain, forwardTo(backend.apiUrl), { allow: fromPage(pageUrl) });
  openWindow(backend.label);
});

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => backend?.stop());
